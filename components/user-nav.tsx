"use client"

import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, User } from "lucide-react"

export function UserNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isSuperAdmin = pathname.startsWith("/super-admin")

  if (!session?.user) {
    return null
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session.user.email?.[0].toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatars/01.png" alt="@user" />
            <AvatarFallback className="bg-gray-200 text-gray-800">{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">{session.user.name || "User"}</p>
            <p className="text-xs leading-none text-gray-500">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
        >
          <Link href="/super-admin/profile">
            <User className="h-4 w-4 mr-2 text-zinc-600" />
            Profile
          </Link>
        </DropdownMenuItem>
        {/* <DropdownMenuSeparator className=""/> */}
        <DropdownMenuItem
          className="text-zinc-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:text-red-600 outline-none"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-2 text-zinc-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 outline-none" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
