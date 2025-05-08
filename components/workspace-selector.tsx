"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
}

interface WorkspaceSelectorProps {
  onWorkspaceChange?: (workspace: Workspace | null) => void
}

export function WorkspaceSelector({ onWorkspaceChange }: WorkspaceSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWorkspaceId = searchParams.get("workspaceId")
  const chatId = searchParams.get("chatId")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [showWorkspaceWarning, setShowWorkspaceWarning] = useState(false)
  const [pendingWorkspace, setPendingWorkspace] = useState<Workspace | null>(null)
  const [deletedWorkspaceName, setDeletedWorkspaceName] = useState<string | null>(null)

  // Separate effect for fetching workspaces
  useEffect(() => {
    fetchWorkspaces()
  }, [])

  // Separate effect for fetching chat workspace details
  useEffect(() => {
    if (chatId) {
      fetchChatWorkspace()
    } else {
      setDeletedWorkspaceName(null)
    }
  }, [chatId])

  // Effect for handling workspace selection after data is loaded
  useEffect(() => {
    if (!loading && workspaces.length > 0 && !deletedWorkspaceName) {
      if (currentWorkspaceId) {
        const workspace = workspaces.find((w) => w.id === currentWorkspaceId)
        if (workspace) {
          setSelectedWorkspace(workspace)
          onWorkspaceChange?.(workspace)
        } else {
          // If current workspace is not in the list (was deleted), select the first available
          const defaultWorkspace = workspaces[0]
          setSelectedWorkspace(defaultWorkspace)
          onWorkspaceChange?.(defaultWorkspace)
          // Update URL with first workspace
          const newUrl = `/chat${chatId ? `?chatId=${chatId}&` : "?"}workspaceId=${defaultWorkspace.id}`
          router.replace(newUrl)
        }
      } else if (!chatId) {
        // Only auto-select if not viewing a chat
        // Auto-select first workspace if none selected
        const workspace = workspaces[0]
        setSelectedWorkspace(workspace)
        onWorkspaceChange?.(workspace)
        // Update URL with first workspace
        router.replace(`/chat?workspaceId=${workspace.id}`)
      }
    }
  }, [currentWorkspaceId, workspaces, loading, deletedWorkspaceName, chatId, onWorkspaceChange])

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspace", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.status === 401) {
        window.location.href = "/login"
        return
      }
      if (!response.ok) throw new Error("Failed to fetch workspaces")
      const data = await response.json()
      setWorkspaces(data)
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatWorkspace = async () => {
    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (!response.ok) return

      const chat = await response.json()
      console.log("Fetched chat:", chat)

      if (!chat.workspaceId && chat.workspaceName) {
        console.log("Setting deleted workspace name:", chat.workspaceName)
        setDeletedWorkspaceName(chat.workspaceName)
        setSelectedWorkspace(null) // Clear selected workspace when showing deleted workspace
      } else {
        console.log("Clearing deleted workspace name")
        setDeletedWorkspaceName(null)
      }
    } catch (error) {
      console.error("Error fetching chat workspace:", error)
    }
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    // Only skip if selecting the deleted workspace option again
    if (workspaceId === "deleted" && deletedWorkspaceName) return

    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (!workspace) return

    if (chatId) {
      // Show warning dialog when switching workspace with active chat
      setPendingWorkspace(workspace)
      setShowWorkspaceWarning(true)
    } else {
      // Direct switch if no active chat
      setSelectedWorkspace(workspace)
      onWorkspaceChange?.(workspace)
      router.replace(`/chat?workspaceId=${workspaceId}`)
    }
  }

  const WarningDialog = () => {
    if (!showWorkspaceWarning) return null

    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center top-0  z-[9999]">
        <div
          className="bg-zinc-900 p-6 rounded-lg shadow-2xl w-[500px] border border-zinc-800"
          style={{
            animation: "dialogSlideIn 0.15s ease-out",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Switch Workspace?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You cannot continue this chat in a different workspace. Would you like to start a new chat in the selected
              workspace?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowWorkspaceWarning(false)
                // Reset to previous workspace
                if (selectedWorkspace) {
                  setSelectedWorkspace(selectedWorkspace)
                }
              }}
              className="px-3 py-1.5 text-sm rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowWorkspaceWarning(false)
                if (pendingWorkspace) {
                  setSelectedWorkspace(pendingWorkspace)
                  router.push(`/chat?workspaceId=${pendingWorkspace.id}`)
                }
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200"
            >
              Start New Chat
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading workspaces..." />
        </SelectTrigger>
      </Select>
    )
  }

  // Only show deleted workspace name if we're viewing that specific chat
  if (chatId && deletedWorkspaceName && !currentWorkspaceId) {
    return (
      <>
        <Select value="deleted" onValueChange={handleWorkspaceChange}>
          <SelectTrigger className="w-[200px] border-zinc-600">
            <SelectValue>
              <span className="flex items-center gap-2 text-gray-400">
                <span className="truncate">{deletedWorkspaceName}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[280px] bg-black">
            <SelectItem value="deleted">
              <span className="flex items-center gap-2 text-white">
                <span className="truncate">{deletedWorkspaceName}</span>
              </span>
            </SelectItem>
            {workspaces.map((workspace) => (
              <SelectItem
                key={workspace.id}
                value={workspace.id}
                className="py-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 data-[highlighted]:bg-zinc-800"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="font-medium text-sm">{workspace.name}</div>
                  {workspace.description && (
                    <div className="text-xs text-zinc-500 max-w-[260px] truncate">{workspace.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <WarningDialog />
      </>
    )
  }

  return (
    <>
      <Select value={selectedWorkspace?.id} onValueChange={handleWorkspaceChange} defaultValue={workspaces[0]?.id}>
        <SelectTrigger className="w-[200px] border-zinc-600">
          <SelectValue placeholder="Select workspace">{selectedWorkspace?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[280px] bg-black/90 border border-zinc-500">
          {workspaces.map((workspace) => (
            <SelectItem
              key={workspace.id}
              value={workspace.id}
              className="py-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 data-[highlighted]:bg-zinc-800"
            >
              <div className="flex flex-col gap-0.5">
                <div className="font-medium text-sm">{workspace.name}</div>
                {/* {workspace.description && (
                  <div className="text-xs text-zinc-500 max-w-[260px] truncate">
                    {workspace.description}
                  </div>
                )} */}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <WarningDialog />
    </>
  )
}
