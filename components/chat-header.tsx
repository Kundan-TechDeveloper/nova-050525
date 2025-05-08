"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { LogOut, Plus, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SidebarLeftIcon } from "./icons"
import { signOut } from "next-auth/react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ProfileDialog } from "./profile-dialog"

interface ChatHeaderProps {
  sidebarOpen: boolean
  onToggle: () => void
}

export function ChatHeader({ sidebarOpen, onToggle }: ChatHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const firstName = session?.user?.firstname || ""
  const lastName = session?.user?.lastname || ""
  const email = session?.user?.email || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  const handleNewChat = () => {
    router.push("/chat")
  }

  const handleSignOut = async () => {
    const loadingToast = toast.loading("Signing out...")
    try {
      await signOut({ redirect: true, callbackUrl: "/login" })
      toast.success("Signed out successfully!", { id: loadingToast })
    } catch (error) {
      toast.error("Failed to sign out", { id: loadingToast })
    }
  }

  const handleProfileClick = () => {
    setShowProfileDialog(true)
    setDropdownOpen(false)
  }

  const handleProfileDialogChange = (open: boolean) => {
    setShowProfileDialog(open)
  }

  return (
    <header className="sticky top-0 z-10 backdrop-blur-sm bg-background/50">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-800 border border-zinc-600"
              onClick={onToggle}
            >
              <SidebarLeftIcon size={16} />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}

          {!sidebarOpen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-800 border border-zinc-600"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4 text-zinc-300" />
                    <span className="sr-only">New Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-zinc-800 text-zinc-100 border border-zinc-600">
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <WorkspaceSelector />
        </div>

        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors bg-purple-500"
            >
              <span className="text-sm font-medium text-white">{initials || "U"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-black border border-zinc-800 text-white p-2">
            <div className="flex items-center gap-3 p-2">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{initials || "U"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {firstName && lastName ? `${firstName} ${lastName}` : "User"}
                </span>
                <span className="text-xs text-zinc-400">{email || "No email"}</span>
              </div>
            </div>
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-zinc-800 cursor-pointer text-zinc-400 hover:text-white transition-colors"
              onClick={handleProfileClick}
            >
              <User size={16} />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-zinc-800 cursor-pointer text-zinc-400 hover:text-white transition-colors"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog open={showProfileDialog} onOpenChange={handleProfileDialogChange} />
    </header>
  )
}
