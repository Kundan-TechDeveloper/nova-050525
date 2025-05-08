"use client"

import { Button } from "./ui/button"
import { Plus, History, FileText, Search, Settings, X } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SidebarLeftIcon } from "./icons"
import { HistoryTab } from "./history-tab"
import { DocumentsTab } from "./documents-tab"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface SidebarProps {
  onToggle: () => void
}

export function Sidebar({ onToggle }: SidebarProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"history" | "documents">("history")
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleNewChat = () => {
    // Clear the URL parameters to show welcome screen
    router.replace("/chat")
  }

  const handleSearch = () => {
    setIsSearching(true)
    // Focus the input after expanding
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchClose = () => {
    setIsSearching(false)
    setSearchValue("")
  }

  return (
    <div className="w-[16rem] h-full bg-zinc-900 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hover:bg-zinc-800 border border-zinc-700"
                  onClick={onToggle}
                >
                  <SidebarLeftIcon size={16} />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-900 border border-zinc-700">
                <p>Toggle Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="w-[140px] relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded-lg pl-2 pr-8 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <button
                onClick={handleSearchClose}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-800 border border-zinc-700"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search {activeTab}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-zinc-900 border border-zinc-700">
                  <p>Search {activeTab}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hover:bg-zinc-800 border border-zinc-700"
                  onClick={handleNewChat}
                >
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">New Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-900 border border-zinc-700">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="px-2 py-2">
        <div className="flex gap-1 bg-zinc-800/30 p-1 rounded-lg">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-8 text-xs font-medium transition-all duration-200 rounded-md gap-1.5",
              activeTab === "history"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50",
            )}
            onClick={() => setActiveTab("history")}
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-8 text-xs font-medium transition-all duration-200 rounded-md gap-1.5",
              activeTab === "documents"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50",
            )}
            onClick={() => setActiveTab("documents")}
          >
            <FileText className="h-3.5 w-3.5" />
            Documents
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === "history" ? (
          <HistoryTab isSearching={isSearching} searchQuery={searchValue} />
        ) : (
          <DocumentsTab isSearching={isSearching} searchQuery={searchValue} />
        )}
      </div>

      {/* Admin link - only shown for admin users */}
      {(session?.user?.role === "admin" || session?.user?.role === "org_admin") && (
        <div className="p-4 border-t border-zinc-800">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Settings className="mr-2 h-5 w-5" />
              Admin Dashboard
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
