"use server"

import { getAdminStats, getAllUsers, updateUserRole, deleteUser } from "@/lib/db/queries"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>

export async function fetchAdminStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { stats: null, error: "Not authorized" }
    }

    // Use a default organization ID if not available
    const organizationId = session.user.organizationId || ""
    const stats = await getAdminStats(organizationId)

    return { stats, error: null }
  } catch (error) {
    return { stats: null, error: "Failed to fetch admin stats" }
  }
}

export async function fetchAllUsers() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { users: null, error: "Not authorized" }
    }

    // Use a default organization ID if not available
    const organizationId = session.user.organizationId || ""
    const users = await getAllUsers(organizationId)

    return { users, error: null }
  } catch (error) {
    return { users: null, error: "Failed to fetch users" }
  }
}

export async function updateUserRoleAction(userId: number, role: string) {
  try {
    await updateUserRole(userId, role)
    revalidatePath("/admin/users")
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: "Failed to update user role" }
  }
}

export async function deleteUserAction(userId: number) {
  try {
    await deleteUser(userId)
    revalidatePath("/admin/users")
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: "Failed to delete user" }
  }
}
