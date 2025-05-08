"use server"

import { getSuperAdminStats, createOrganization as createOrg, getAllOrganizations } from "@/lib/db/queries"

export async function getStats() {
  try {
    const stats = await getSuperAdminStats()
    return { success: true, data: stats }
  } catch (error) {
    console.error("Error fetching super admin stats:", error)
    return { success: false, error: "Failed to fetch stats" }
  }
}

export async function createOrganization(name: string, expiryDays = 30) {
  try {
    const organization = await createOrg(name, expiryDays)
    return { success: true, data: organization }
  } catch (error) {
    console.error("Error creating organization:", error)
    return { success: false, error: "Failed to create organization" }
  }
}

export async function getOrganizations() {
  try {
    const organizations = await getAllOrganizations()
    return { success: true, data: organizations }
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return { success: false, error: "Failed to fetch organizations" }
  }
}
