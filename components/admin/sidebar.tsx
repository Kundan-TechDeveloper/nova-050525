"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiUsers, FiGrid, FiFolder, FiSettings, FiBell, FiMessageSquare } from "react-icons/fi"

export default function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 bg-white border-r border-zinc-200 h-screen flex flex-col">
      {/* <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" fill="currentColor" className="text-white" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-zinc-900">Document Management</div>
            <div className="text-[13px] text-zinc-500">Admin Portal</div>
          </div>
        </div>
      </div> */}

      <div className="p-6 text-2xl font-bold text-black">Admin Portal</div>

      <div className="flex-1 overflow-y-auto workspace-scrollbar">
        <div className="px-4 py-3 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">General</div>

        <nav className="px-2">
          <div className="space-y-1">
            <Link
              href="/admin"
              className={`flex items-center px-3 py-2 text-[15px] transition-colors rounded-md ${
                isActive("/admin")
                  ? "bg-blue-50 text-black font-semibold"
                  : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
              }`}
            >
              <FiGrid className="w-5 h-5 mr-3" />
              Dashboard
            </Link>

            <Link
              href="/admin/workspaces"
              className={`flex items-center px-3 py-2 text-[15px] transition-colors rounded-md ${
                isActive("/admin/workspaces")
                  ? "bg-blue-50 text-black font-semibold"
                  : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
              }`}
            >
              <FiFolder className="w-5 h-5 mr-3" />
              Workspaces
            </Link>

            <Link
              href="/admin/users"
              className={`flex items-center px-3 py-2 text-[15px] transition-colors rounded-md ${
                isActive("/admin/users")
                  ? "bg-blue-50 text-black font-semibold"
                  : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
              }`}
            >
              <FiUsers className="w-5 h-5 mr-3" />
              User Management
            </Link>
          </div>

          <div className="mt-6">
            <div className="px-2 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">Settings & Alerts</div>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin/notifications"
                className={`flex items-center px-3 py-2 text-[15px] transition-colors rounded-md ${
                  isActive("/admin/notifications")
                    ? "bg-blue-50 text-black font-semibold"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                }`}
              >
                <FiBell className="w-5 h-5 mr-3" />
                <div className="flex justify-between items-center w-full">
                  Notifications
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">4</span>
                </div>
              </Link>

              <Link
                href="/admin/settings"
                className={`flex items-center px-3 py-2 text-[15px] transition-colors rounded-md ${
                  isActive("/admin/settings")
                    ? "bg-blue-50 text-black font-semibold"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                }`}
              >
                <FiSettings className="w-5 h-5 mr-3" />
                System Settings
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 bg-white">
        <Link
          href="/chat"
          className="flex items-center px-3 py-2 text-[15px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors rounded-md font-medium"
        >
          <FiMessageSquare className="w-5 h-5 mr-3" />
          Back to chat
        </Link>
      </div>
    </div>
  )
}
