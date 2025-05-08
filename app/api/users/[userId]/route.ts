import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { users, workspaceAccess, chats, messages, organizationMemberships } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { and, eq } from "drizzle-orm"
import { hashSync, genSaltSync } from "bcrypt-ts"

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""
    const userId = Number.parseInt(params.userId)

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.organizationId, organizationId)),
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Begin transaction to ensure all related data is deleted
    await db.transaction(async (tx) => {
      // 1. Delete workspace access entries
      await tx.delete(workspaceAccess).where(eq(workspaceAccess.userId, userId))

      // 2. Delete messages from user's chats
      const userChats = await tx.query.chats.findMany({
        where: eq(chats.userId, userId),
      })

      for (const chat of userChats) {
        await tx.delete(messages).where(eq(messages.chatId, chat.id))
      }

      // 3. Delete user's chats
      await tx.delete(chats).where(eq(chats.userId, userId))

      // 4. Delete user's organization memberships
      await tx.delete(organizationMemberships).where(eq(organizationMemberships.userId, userId))

      // 5. Finally, delete the user
      await tx.delete(users).where(eq(users.id, userId))
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { firstname, lastname, email, password, role } = body
    const userId = params.userId

    // Check if email is already taken by another user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser && existingUser.id.toString() !== userId) {
      return new NextResponse("Email already taken", { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      firstname,
      lastname,
      email,
      role: role || "user",
    }

    // Only include password if it was provided
    if (password) {
      const salt = genSaltSync(10)
      updateData.password = hashSync(password, salt)
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number.parseInt(userId)))
      .returning()

    if (!updatedUser.length) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Format the response
    const formattedUser = {
      id: updatedUser[0].id.toString(),
      firstname: updatedUser[0].firstname || "",
      lastname: updatedUser[0].lastname || "",
      email: updatedUser[0].email || "",
      role: updatedUser[0].role || "user",
      createdAt: updatedUser[0].createdAt.toISOString(),
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
