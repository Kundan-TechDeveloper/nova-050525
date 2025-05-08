import { getAllOrganizations } from "@/lib/db/queries"
import { OrganizationsContent } from "./organizations-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Organizations - Super Admin",
  description: "Manage all organizations in the system",
}

// Disable caching for this page
export const revalidate = 0

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <OrganizationsContent initialOrganizations={organizations} />
    </div>
  )
}
