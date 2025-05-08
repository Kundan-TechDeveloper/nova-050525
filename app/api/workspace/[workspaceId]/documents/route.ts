import { auth } from "@/lib/auth"
import { getDocumentsByWorkspaceId } from "@/lib/db/queries"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const documents = await getDocumentsByWorkspaceId(params.workspaceId, organizationId)
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
