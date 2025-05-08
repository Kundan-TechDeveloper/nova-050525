import { deleteUser } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    const { email, firstname, lastname } = body

    // Update user while keeping role as super_admin
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        firstname,
        lastname,
        role: "super_admin", // Ensure role stays as super_admin
      })
      .where(eq(users.id, Number.parseInt(params.id)))
      .returning()

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    await deleteUser(Number.parseInt(params.id))
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
