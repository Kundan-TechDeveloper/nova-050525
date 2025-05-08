import { getAdminStats } from "@/lib/db/queries"
import DashboardContent from "./dashboard-content"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  // Use a default organization ID if not available
  const organizationId = session.user.organizationId || ""
  const adminStats = await getAdminStats(organizationId)

  return <DashboardContent initialStats={adminStats} />
}
