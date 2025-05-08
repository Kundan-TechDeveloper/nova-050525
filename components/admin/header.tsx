"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiLogOut, FiUser, FiChevronRight, FiHome } from "react-icons/fi"
import { useState, useMemo } from "react"
import type { ReactNode } from "react"

interface BreadcrumbItem {
  label: ReactNode
  href: string
  current: boolean
}

export default function AdminHeader({ user }: { user: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Generate breadcrumb items based on current path
  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        label: (
          <div className="flex items-center text-zinc-500 hover:text-zinc-600">
            <FiHome className="w-4 h-4" />
          </div>
        ),
        href: "/admin",
        current: pathname === "/admin",
      },
    ]

    const pathSegments = pathname.split("/").filter(Boolean)
    let currentPath = ""

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      if (segment !== "admin") {
        // Format the segment for display (capitalize first letter, replace hyphens with spaces)
        const label = (() => {
          switch (segment) {
            case "workspaces":
              return "Workspaces"
            case "users":
              return "User Management"
            case "settings":
              return "System Settings"
            case "profile":
              return "Admin Profile"
            default:
              return segment
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
          }
        })()

        items.push({
          label,
          href: currentPath,
          current: index === pathSegments.length - 1,
        })
      }
    })

    return items
  }, [pathname])

  return (
    <header className="bg-white rounded-t-2xl">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {breadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && <FiChevronRight className="w-4 h-4 mx-2 text-zinc-400 flex-shrink-0" />}
                <Link
                  href={item.href}
                  className={`text-[15px] ${
                    item.current ? "text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-600"
                  } transition-colors whitespace-nowrap`}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 focus:outline-none">
                <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[15px] font-semibold shadow-sm">
                  {user?.name?.[0] || "A"}
                </div>
                <span className="text-[15px] text-zinc-900 font-semibold hidden sm:inline-block">
                  {user?.name || "Admin"}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 focus:outline-none">
                  <Link
                    href="/admin/profile"
                    className="flex px-4 py-2.5 text-[15px] text-zinc-700 hover:bg-zinc-50 transition-colors items-center"
                  >
                    <FiUser className="mr-3 h-4 w-4 text-zinc-400" />
                    View profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full px-4 py-2.5 text-[15px] text-red-600 hover:bg-red-50 transition-colors items-center border-t border-zinc-200 mt-1"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
