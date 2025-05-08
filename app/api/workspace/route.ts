import { getServerSession } from "next-auth"
import { getWorkspacesByUserId } from "@/lib/db/queries"
import { NextResponse } from "next/server"
import authOptions from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const workspaces = await getWorkspacesByUserId(session.user.id, organizationId)
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
