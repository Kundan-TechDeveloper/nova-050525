"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Building2, LayoutDashboard, Settings, Users } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const icons = {
    Dashboard: <LayoutDashboard className="mr-2 h-4 w-4" />,
    Organizations: <Building2 className="mr-2 h-4 w-4" />,
    "System Users": <Users className="mr-2 h-4 w-4" />,
    Settings: <Settings className="mr-2 h-4 w-4" />,
  }

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            "justify-start",
          )}
        >
          {icons[item.title as keyof typeof icons]}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
