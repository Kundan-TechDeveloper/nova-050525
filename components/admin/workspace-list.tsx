"use client"

import { useState, useRef } from "react"
import { FiEdit, FiFolder, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import Link from "next/link"
import NewWorkspaceDialog from "./new-workspace-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
  description: string | null
  itemCount: number
  createdAt: string
}

interface WorkspaceListProps {
  workspaces: Workspace[]
  selectedId?: string
  onWorkspaceUpdate?: () => void
}

export default function WorkspaceList({ workspaces, selectedId, onWorkspaceUpdate }: WorkspaceListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null)

  const handleWorkspaceUpdated = async (workspaceId: string) => {
    // Call parent's update handler if provided
    if (onWorkspaceUpdate) {
      onWorkspaceUpdate()
    }

    // Close the edit dialog
    setEditWorkspace(null)
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth)
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = scrollContainerRef.current.clientWidth
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative w-full">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          aria-label="Scroll left"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          aria-label="Scroll right"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Workspace Grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative w-full overflow-x-auto scrollbar-hide"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <div
          className="flex gap-4 pb-2 pr-10 pl-1 pt-1 max-w-[1150px]"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/admin/workspaces?workspace=${workspace.id}`}
              className={`block min-w-[300px] max-w-[300px] w-[300px] flex-shrink-0 flex-grow-0 bg-white p-5 rounded-lg transition-all duration-200 ${
                workspace.id === selectedId
                  ? "ring-2 ring-blue-600 shadow-lg"
                  : "border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FiFolder
                      className={`w-4 h-4 flex-shrink-0 ${
                        workspace.id === selectedId ? "text-blue-600" : "text-zinc-400"
                      }`}
                    />
                    <h3 className="text-[15px] font-medium text-zinc-900 truncate" title={workspace.name}>
                      {workspace.name}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <span className="text-[13px] text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/80 whitespace-nowrap">
                      {workspace.itemCount} items
                    </span>
                    <span className="text-zinc-300 flex-shrink-0">•</span>
                    <span className="text-[13px] text-zinc-500 truncate">
                      Updated {new Date(workspace.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-2 rounded-lg hover:bg-zinc-50 flex-shrink-0 ${
                        workspace.id === selectedId ? "text-blue-600" : "text-zinc-400"
                      }`}
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/workspaces/${workspace.id}/config`}>
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Configure
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setEditWorkspace(workspace)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Edit Workspace Dialog */}
      <NewWorkspaceDialog
        isOpen={!!editWorkspace}
        onClose={() => setEditWorkspace(null)}
        mode="edit"
        workspace={editWorkspace || undefined}
        onWorkspaceCreated={handleWorkspaceUpdated}
      />
    </div>
  )
}
