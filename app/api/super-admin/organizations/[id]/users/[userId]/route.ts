import { updateOrganizationUser, deleteOrganizationUser, getUser } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { email, firstname, lastname, role } = await request.json()

    // Check if email exists for a different user
    const existingUser = await getUser(email)
    if (existingUser.length > 0 && existingUser[0].id !== Number.parseInt(params.userId)) {
      return NextResponse.json({ message: "Email address is already in use by another user" }, { status: 409 })
    }

    const user = await updateOrganizationUser(Number.parseInt(params.userId), {
      email,
      firstname,
      lastname,
      role,
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const result = await deleteOrganizationUser(Number.parseInt(params.userId))
    if (!result) {
      return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
