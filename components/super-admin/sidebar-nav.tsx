"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarNavProps {
  items: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive =
          item.href === "/super-admin/organizations"
            ? pathname === item.href || pathname.startsWith("/super-admin/organizations/")
            : pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isActive ? "bg-blue-50 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
