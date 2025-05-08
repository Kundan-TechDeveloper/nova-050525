"use client"

import { FiUsers, FiFolder, FiFile, FiActivity } from "react-icons/fi"

interface Activity {
  id: string
  action: string
  createdAt: Date
  user: {
    id: number
    name: string | null
  }
}

interface AdminStats {
  totalUsers: number
  totalWorkspaces: number
  totalDocuments: number
  recentActivities: Activity[]
}

interface DashboardContentProps {
  stats: AdminStats | null
  error?: string | null
}

export default function AdminDashboardContent({ stats, error }: DashboardContentProps) {
  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
  }

  if (!stats) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  const activeUsers = new Set(stats.recentActivities.map((a) => a.user.id)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FiFolder className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Workspaces</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalWorkspaces}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiFile className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Documents</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiActivity className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
              <p className="text-2xl font-semibold text-gray-900">{activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {activity.user.name?.[0] || "U"}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{activity.user.name}</p>
                  <p className="text-sm text-gray-500">
                    {activity.action} - {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
