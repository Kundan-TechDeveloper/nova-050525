import { getSuperAdminStats } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { SuperAdminStats } from "@/lib/types"

// Mark this route as dynamic to allow headers usage
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // 1. Check session
    const session = await getServerSession(authOptions)
    console.log("Session:", session)

    if (!session?.user) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check role
    console.log("User role:", session.user.role)
    if (session.user.role !== "super_admin") {
      console.log("User is not super admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Get stats
    console.log("Fetching stats...")
    const stats = await getSuperAdminStats()
    console.log("Raw stats:", stats)

    if (!stats) {
      console.log("No stats returned")
      return NextResponse.json({ error: "No stats found" }, { status: 404 })
    }

    // 4. Transform response
    try {
      const response: SuperAdminStats = {
        totalOrganizations: Number(stats.totalOrganizations) || 0,
        totalUsers: Number(stats.totalUsers) || 0,
        activeOrganizations: Number(stats.activeOrganizations) || 0,
        activeUsers: Number(stats.activeUsers) || 0,
        organizationGrowth: Number(stats.organizationGrowth) || 0,
        userGrowth: Number(stats.userGrowth) || 0,
        activeOrganizationGrowth: Number(stats.activeOrganizationGrowth) || 0,
        activeUserGrowth: Number(stats.activeUserGrowth) || 0,
        recentOrganizations: Array.isArray(stats.recentOrganizations) ? stats.recentOrganizations : [],
        organizationDistribution: Array.isArray(stats.recentOrganizations)
          ? stats.recentOrganizations.map((org) => ({
              name: org.name || "Unknown",
              userCount: Number(org.memberCount) || 0,
            }))
          : [],
      }
      console.log("Transformed response:", response)
      return NextResponse.json(response)
    } catch (transformError) {
      console.error("Error transforming stats:", transformError)
      return NextResponse.json(
        {
          error: "Error transforming stats",
          details: transformError instanceof Error ? transformError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in /api/super-admin/stats:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
