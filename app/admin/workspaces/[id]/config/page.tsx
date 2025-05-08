import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { WorkspaceConfigEditor } from "@/components/admin/workspace-config-editor"
import authOptions from "@/lib/auth"
import { getWorkspaceById } from "@/lib/db/queries"

export default async function WorkspaceConfigPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Check if user is admin
  if (session.user.role !== "org_admin" && session.user.role !== "super_admin") {
    redirect("/admin")
  }

  const organizationId = session.user.organizationId || ""
  const workspace = await getWorkspaceById(params.id, organizationId)

  if (!workspace) {
    redirect("/admin/workspaces")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configure Workspace: {workspace.name}</h1>
      <WorkspaceConfigEditor workspaceId={params.id} initialConfig={workspace.config} />
    </div>
  )
}
