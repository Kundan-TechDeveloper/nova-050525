import { getServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt-ts"
import { getUser } from "@/lib/db/queries"

export type AuthUser = {
  id: string
  email: string
  firstname: string
  lastname: string
  name?: string
  role: string
  organizationId?: string
}

declare module "next-auth" {
  interface Session {
    user: AuthUser
  }
  interface User extends AuthUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    firstname: string
    lastname: string
    role: string
    organizationId?: string
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60, // 1 hour in seconds
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const users = await getUser(credentials.email)
          if (!users?.length) return null

          const user = users[0]
          if (!user?.password) return null

          const isValid = await compare(credentials.password, user.password)
          if (!isValid) return null

          return {
            id: user.id.toString(),
            email: user.email || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            name: `${user.firstname || ""} ${user.lastname || ""}`.trim() || undefined,
            role: user.role || "user",
            organizationId: user.organizationId || undefined,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email || ""
        token.firstname = user.firstname || ""
        token.lastname = user.lastname || ""
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstname: token.firstname,
        lastname: token.lastname,
        name: `${token.firstname} ${token.lastname}`.trim(),
        role: token.role,
        organizationId: token.organizationId,
      }
      return session
    },
  },
}

export default authOptions

export const auth = () => getServerSession(authOptions)
