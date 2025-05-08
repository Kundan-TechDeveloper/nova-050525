import { getOrganizationUsers, getUser, createOrganizationUser } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { hashSync, genSaltSync } from "bcrypt-ts"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const users = await getOrganizationUsers(params.id)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { email, firstname, lastname, password, role } = body

    // Check if user already exists
    const existingUser = await getUser(email)
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ message: "Email address is already in use by another user" }, { status: 409 })
    }

    // Hash password
    const salt = genSaltSync(10)
    const hashedPassword = hashSync(password, salt)

    // Create new user using the query function
    const newUser = await createOrganizationUser(params.id, email, role || "user", hashedPassword, firstname, lastname)

    return NextResponse.json({
      message: "User added successfully",
      user: newUser,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
