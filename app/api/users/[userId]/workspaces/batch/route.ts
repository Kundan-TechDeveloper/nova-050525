import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { workspaceAccess } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, inArray } from "drizzle-orm"

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { add = [], remove = [] } = await request.json()

    // If both arrays are empty, return success immediately
    if ((!add || add.length === 0) && (!remove || remove.length === 0)) {
      return new NextResponse(null, { status: 204 })
    }

    // Process all changes in a transaction
    await db.transaction(async (tx) => {
      // Add new access
      if (add && add.length > 0) {
        // Get all existing access for this user
        const existingAccess = await tx.query.workspaceAccess.findMany({
          where: eq(workspaceAccess.userId, Number.parseInt(params.userId)),
        })

        const existingWorkspaceIds = new Set(existingAccess.map((a) => a.workspaceId))

        // Filter out workspaces that the user already has access to
        const workspacesToAdd = add.filter((id: string) => !existingWorkspaceIds.has(id))

        if (workspacesToAdd.length > 0) {
          await tx.insert(workspaceAccess).values(
            workspacesToAdd.map((workspaceId: string) => ({
              userId: Number.parseInt(params.userId),
              workspaceId,
              accessLevel: "view",
              createdAt: new Date(),
            })),
          )
        }
      }

      // Remove access
      if (remove && remove.length > 0) {
        await tx
          .delete(workspaceAccess)
          .where(
            and(
              eq(workspaceAccess.userId, Number.parseInt(params.userId)),
              inArray(workspaceAccess.workspaceId, remove),
            ),
          )
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error updating workspace access:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
