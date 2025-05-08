import { getSuperAdminUsers } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { hashSync, genSaltSync } from "bcrypt-ts"
import { db } from "@/lib/db/db"
import { users } from "@/lib/db/schema"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const users = await getSuperAdminUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { email, firstname, lastname, password } = body

    // Hash password
    const salt = genSaltSync(10)
    const hashedPassword = hashSync(password, salt)

    // Create new super admin user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstname,
        lastname,
        password: hashedPassword,
        role: "super_admin",
        createdAt: new Date(),
      })
      .returning()

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error creating user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
