"use client"

import { useState } from "react"
import {
  FiUsers,
  FiFolder,
  FiActivity,
  FiClock,
  FiArrowUp,
  FiArrowDown,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  totalWorkspaces: number
  totalDocuments: number
}

interface DashboardContentProps {
  initialStats: DashboardStats
}

export default function DashboardContent({ initialStats }: DashboardContentProps) {
  const [recentActivities] = useState([
    {
      id: 1,
      type: "upload",
      user: "Moh Amir",
      action: "uploaded",
      target: "financial-report-2024.pdf",
      workspace: "Financial Documents",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "revision",
      user: "Mihir Srivastava",
      action: "created a revision for",
      target: "contract-v2.docx",
      workspace: "Legal Documents",
      time: "3 hours ago",
    },
  ])

  // Calculate growth percentages (you can adjust these calculations or fetch from API)
  const userGrowth = 12
  const workspaceGrowth = 8
  const documentGrowth = -3
  const activeGrowth = 24

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-zinc-600">
          Monitor your document management system's performance and recent activities.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600">Total Users</p>
                <p className="text-2xl font-semibold text-zinc-900">{initialStats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
              <FiArrowUp className="w-3 h-3" />
              {userGrowth}%
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FiFolder className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600">Workspaces</p>
                <p className="text-2xl font-semibold text-zinc-900">{initialStats.totalWorkspaces.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
              <FiArrowUp className="w-3 h-3" />
              {workspaceGrowth}%
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600">Documents</p>
                <p className="text-2xl font-semibold text-zinc-900">{initialStats.totalDocuments.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
              <FiArrowDown className="w-3 h-3" />
              {Math.abs(documentGrowth)}%
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600">Active Now</p>
                <p className="text-2xl font-semibold text-zinc-900">{Math.ceil(initialStats.totalUsers * 0.1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
              <FiArrowUp className="w-3 h-3" />
              {activeGrowth}%
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-zinc-900">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-zinc-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FiClock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                    <span className="font-medium">{activity.target}</span> in{" "}
                    <span className="font-medium">{activity.workspace}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{activity.time}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    <FiCheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/workspaces"
          className="group bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FiFolder className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 group-hover:text-zinc-800">Manage Workspaces</h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-600">Create and organize document workspaces</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <FiUsers className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 group-hover:text-zinc-800">User Management</h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-600">Add and manage system users</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group bg-white p-6 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <FiActivity className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 group-hover:text-zinc-800">System Settings</h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-600">Configure system preferences</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
