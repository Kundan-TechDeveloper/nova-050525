// Create a new API route to handle workspace configurations
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth"
import { db } from "@/lib/db/db"
import { workspaces } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Define the field types
export interface WorkspaceField {
  name: string
  type: "text" | "textarea" | "dropdown" | "multi-line"
  options?: string[]
  default?: string
}

// Define the workspace configuration interface
export interface WorkspaceConfig {
  workspace: string
  fields: WorkspaceField[]
}

// Get workspace configuration
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get("workspaceId")

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
  }

  try {
    // Get workspace from database
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if workspace has configuration
    const config = workspace.config as WorkspaceConfig | null

    if (!config) {
      // Return default configuration if none exists
      return NextResponse.json({
        workspace: workspace.name,
        fields: [],
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching workspace configuration:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Update workspace configuration
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user has admin role
  if (session.user.role !== "org_admin" && session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const { workspaceId, config } = await request.json()

    if (!workspaceId || !config) {
      return NextResponse.json({ error: "Workspace ID and configuration are required" }, { status: 400 })
    }

    // Update workspace configuration
    const updatedWorkspace = await db
      .update(workspaces)
      .set({ config })
      .where(eq(workspaces.id, workspaceId))
      .returning()

    return NextResponse.json(updatedWorkspace[0])
  } catch (error) {
    console.error("Error updating workspace configuration:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
