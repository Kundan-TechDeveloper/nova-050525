import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { workspaces, workspaceAccess } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"

// Get all workspaces with access information for a user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""

    // Get all workspaces for the organization
    const allWorkspaces = await db.query.workspaces.findMany({
      where: eq(workspaces.organizationId, organizationId),
    })

    // Get user's workspace access
    const userAccess = await db.query.workspaceAccess.findMany({
      where: eq(workspaceAccess.userId, Number.parseInt(params.userId)),
    })

    // Format the response
    const workspacesWithAccess = allWorkspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      hasAccess: userAccess.some((access) => access.workspaceId === workspace.id),
    }))

    return NextResponse.json(workspacesWithAccess)
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Grant access to a workspace
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""
    const { workspaceId } = await request.json()

    // Check if workspace belongs to the organization
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.organizationId, organizationId)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 })
    }

    // Check if access already exists
    const existingAccess = await db.query.workspaceAccess.findFirst({
      where: and(
        eq(workspaceAccess.userId, Number.parseInt(params.userId)),
        eq(workspaceAccess.workspaceId, workspaceId),
      ),
    })

    if (!existingAccess) {
      await db.insert(workspaceAccess).values({
        userId: Number.parseInt(params.userId),
        workspaceId: workspaceId,
        accessLevel: "view",
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error granting workspace access:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Remove access from a workspace
export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""
    const { workspaceId } = await request.json()

    // Check if workspace belongs to the organization
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.organizationId, organizationId)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 })
    }

    await db
      .delete(workspaceAccess)
      .where(
        and(eq(workspaceAccess.userId, Number.parseInt(params.userId)), eq(workspaceAccess.workspaceId, workspaceId)),
      )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error removing workspace access:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
