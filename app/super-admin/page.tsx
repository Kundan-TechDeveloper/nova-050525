import type { Metadata } from "next"
import { SuperAdminDashboardContent } from "./dashboard-content"

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "Manage organizations and system-wide settings",
}

export default function SuperAdminDashboardPage() {
  return (
    <div className="min-h-screen">
      <SuperAdminDashboardContent />
    </div>
  )
}
