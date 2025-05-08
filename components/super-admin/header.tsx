"use client"

import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import { create } from "zustand"

interface TabStore {
  activeTab: string
  setActiveTab: (tab: string) => void
}

interface BreadcrumbStore {
  organizationName: string
  setOrganizationName: (name: string) => void
}

export const useTabStore = create<TabStore>((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
}))

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  organizationName: "",
  setOrganizationName: (name) => set({ organizationName: name }),
}))

export function Header() {
  const pathname = usePathname()
  const isDashboard = pathname === "/super-admin"
  const { activeTab, setActiveTab } = useTabStore()
  const { organizationName } = useBreadcrumbStore()

  if (!isDashboard) {
    return (
      <header className="sticky top-0 z-40 bg-white">
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/super-admin" className="hover:text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
            <span className="mx-2">/</span>
            {pathname.startsWith("/super-admin/organizations/") && pathname !== "/super-admin/organizations" ? (
              <Link
                href="/super-admin/organizations"
                className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
              >
                Organizations
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">
                {pathname
                  .split("/")
                  .pop()
                  ?.split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </span>
            )}
            {pathname.startsWith("/super-admin/organizations/") &&
              pathname !== "/super-admin/organizations" &&
              organizationName && (
                <>
                  <span className="mx-2">/</span>
                  <span className="font-semibold text-gray-900">{organizationName}</span>
                </>
              )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/super-admin/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  4
                </span>
              </Button>
            </Link>
            <UserNav />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <div className="flex items-center gap-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="relative">
            <TabsList className="w-full justify-start gap-6 border-b-0 bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-2 py-1.5 font-medium text-gray-600 hover:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="recent-activity"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-2 py-1.5 font-medium text-gray-600 hover:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900"
              >
                Recent Activity
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/super-admin/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                4
              </span>
            </Button>
          </Link>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
