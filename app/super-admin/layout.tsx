import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SidebarNav } from "@/components/super-admin/sidebar-nav"
import { Header } from "@/components/super-admin/header"
import { Building2, LayoutDashboard, Settings, Users, CreditCard } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "Super Admin Dashboard for managing organizations and system-wide settings",
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/super-admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "Organizations",
    href: "/super-admin/organizations",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    title: "System Users",
    href: "/super-admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Plans & Billing",
    href: "",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/super-admin/setting",
    icon: <Settings className="h-4 w-4" />,
  },
]

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            {/* <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Logo" width={32} height={32} />
              <span className="text-xl font-bold text-gray-900">Vorgez</span> */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Super Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-1 px-3 py-6">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Main Menu</h2>
            <SidebarNav items={sidebarNavItems} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pl-64">
        <div className="h-screen p-3">
          <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
