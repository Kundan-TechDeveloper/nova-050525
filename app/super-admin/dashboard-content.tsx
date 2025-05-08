"use client"

import { useEffect, useState } from "react"
import { FiUsers, FiActivity, FiArrowUp, FiBriefcase } from "react-icons/fi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SuperAdminStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { useTabStore } from "@/components/super-admin/header"
import { formatDistanceToNow } from "date-fns"

const PieChart = dynamic(() => import("@/components/charts/pie-chart"), { ssr: false })
const BarChart = dynamic(() => import("@/components/charts/bar-chart"), { ssr: false })

interface Activity {
  id: string
  type: "organization"
  action: string
  organization: string
  time: string
}

interface Organization {
  id: string
  name: string
  status: string | null
  createdAt: Date
  memberCount: number
}

export function SuperAdminDashboardContent() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { activeTab } = useTabStore()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/super-admin/stats")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stats")
        }

        console.log("Fetched stats:", data)
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch stats")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading stats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Sample data for organization-based user distribution
  const pieChartData =
    stats?.organizationDistribution.map((org) => ({
      name: org.name,
      value: org.userCount,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Generate random color for each org
    })) || []

  // Sample data for monthly user growth (keeping mock data as requested)
  const barChartData = [
    { name: "Jan", users: 100 },
    { name: "Feb", users: 150 },
    { name: "Mar", users: 180 },
    { name: "Apr", users: 220 },
    { name: "May", users: 280 },
    { name: "Jun", users: 350 },
  ]

  const recentActivities: Activity[] =
    stats?.recentOrganizations.map((org) => ({
      id: org.id,
      type: "organization",
      action: "created",
      organization: org.name,
      time: new Date(org.createdAt).toLocaleDateString(),
    })) || []

  return (
    <div className="w-full">
      {activeTab === "overview" && (
        <div className="flex-1 space-y-3 p-4">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Organizations</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <FiBriefcase className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalOrganizations || 0}</div>
                <div className="mt-1 flex items-center text-sm">
                  <FiArrowUp className="mr-1 text-green-500" />
                  <span className="text-green-500">{stats?.organizationGrowth}%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <FiUsers className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                <div className="mt-1 flex items-center text-sm">
                  <FiArrowUp className="mr-1 text-green-500" />
                  <span className="text-green-500">{stats?.userGrowth}%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Organizations</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <FiActivity className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.activeOrganizations || 0}</div>
                <div className="mt-1 flex items-center text-sm">
                  <FiArrowUp className="mr-1 text-green-500" />
                  <span className="text-green-500">{stats?.activeOrganizationGrowth}%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Users</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <FiUsers className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</div>
                <div className="mt-1 flex items-center text-sm">
                  <FiArrowUp className="mr-1 text-green-500" />
                  <span className="text-green-500">{stats?.activeUserGrowth}%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">Users by Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <PieChart data={pieChartData} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">Monthly User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <BarChart data={barChartData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "recent-activity" && (
        <div className="flex-1 space-y-3 p-4">
          <Card className="bg-white border-2 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <span className="text-sm font-medium text-blue-600">
                          {activity.organization[0]?.toUpperCase() || "O"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{activity.organization}</p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              activity.action === "created" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {activity.action}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => (window.location.href = `/super-admin/organizations/${activity.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SuperAdminDashboardContent
