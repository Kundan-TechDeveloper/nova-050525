"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { User } from "@/lib/types"
import { FolderKey } from "lucide-react"
import { fetchWorkspaces } from "@/app/admin/workspaces/actions"

interface Workspace {
  id: string
  name: string
  description: string | null
}

interface WorkspaceAccess {
  workspaceId: string
  userId: string
  accessLevel: "view"
}

interface WorkspaceAccessDialogProps {
  open: boolean
  onClose: () => void
  user: User
}

export function WorkspaceAccessDialog({ open, onClose, user }: WorkspaceAccessDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [initialAccess, setInitialAccess] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadWorkspacesAndAccess()
    }

    // Cleanup function to reset state when dialog closes
    return () => {
      if (!open) {
        setWorkspaces([])
        setSelectedWorkspaces([])
        setInitialAccess([])
        setHasChanges(false)
        setError(null)
      }
    }
  }, [open, user.id])

  const loadWorkspacesAndAccess = async () => {
    try {
      setIsLoading(true)
      setHasChanges(false)
      setError(null)

      // First fetch workspaces to check if any exist
      const { workspaces: workspacesData, error: workspacesError } = await fetchWorkspaces()

      if (workspacesError) {
        setError("Failed to load workspaces")
        toast.error("Failed to load workspaces")
        return
      }

      if (!workspacesData || workspacesData.length === 0) {
        // No workspaces exist, so we can skip fetching access
        setWorkspaces([])
        setSelectedWorkspaces([])
        setInitialAccess([])
        return
      }

      // Only fetch access if we have workspaces
      setWorkspaces(workspacesData)

      try {
        const accessResponse = await fetch(`/api/users/${user.id}/workspaces`)

        if (!accessResponse.ok) {
          throw new Error("Failed to fetch user workspace access")
        }

        const accessData = await accessResponse.json()

        // Set selected workspaces based on current access
        const currentAccessIds = accessData
          .filter((workspace: { hasAccess: boolean; id: string }) => workspace.hasAccess)
          .map((workspace: { id: string }) => workspace.id)

        setSelectedWorkspaces(currentAccessIds)
        setInitialAccess(currentAccessIds) // Store initial state for comparison
      } catch (accessError) {
        console.error("Error loading workspace access:", accessError)
        toast.error("Failed to load workspace access")
        setError("Failed to load workspace access")
      }
    } catch (error) {
      console.error("Error loading workspaces and access:", error)
      toast.error("Failed to load workspace access")
      setError("Failed to load workspace data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user.id || !hasChanges) return

    try {
      setIsSaving(true)

      // Find workspaces to add and remove
      const workspacesToAdd = selectedWorkspaces.filter((id) => !initialAccess.includes(id))
      const workspacesToRemove = initialAccess.filter((id) => !selectedWorkspaces.includes(id))

      // Send batch update
      const response = await fetch(`/api/users/${user.id}/workspaces/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          add: workspacesToAdd,
          remove: workspacesToRemove,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update workspace access")
      }

      toast.success("Workspace access updated successfully")
      setInitialAccess(selectedWorkspaces)
      setHasChanges(false)
      onClose()
    } catch (error) {
      console.error("Error updating workspace access:", error)
      toast.error("Failed to update workspace access")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaces((prev) => {
      const newSelection = prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId]

      // Check if there are any changes compared to initial state
      const hasChanges = JSON.stringify(newSelection.sort()) !== JSON.stringify(initialAccess.sort())
      setHasChanges(hasChanges)

      return newSelection
    })
  }

  const toggleAllWorkspaces = () => {
    const newSelection = selectedWorkspaces.length === workspaces.length ? [] : workspaces.map((w) => w.id)

    setSelectedWorkspaces(newSelection)
    // Check if there are any changes compared to initial state
    const hasChanges = JSON.stringify(newSelection.sort()) !== JSON.stringify(initialAccess.sort())
    setHasChanges(hasChanges)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
              <FolderKey className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-zinc-900">Workspace Access</DialogTitle>
              <DialogDescription className="text-[15px] text-zinc-500">
                Manage workspace access for {user.firstname} {user.lastname}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-900">Available Workspaces</h3>
            {workspaces.length > 0 && (
              <button
                onClick={toggleAllWorkspaces}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                disabled={isLoading}
              >
                {selectedWorkspaces.length === workspaces.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto workspace-scrollbar space-y-2 rounded-lg bg-white border border-zinc-200 p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500 text-center">{error}</div>
            ) : workspaces.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 text-center">No workspaces available</div>
            ) : (
              workspaces.map((workspace) => {
                const isSelected = selectedWorkspaces.includes(workspace.id)
                return (
                  <div
                    key={workspace.id}
                    onClick={() => toggleWorkspace(workspace.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{workspace.name}</p>
                      {workspace.description && <p className="text-xs text-zinc-500 mt-0.5">{workspace.description}</p>}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-500" : "border-zinc-300"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="h-10 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="h-10 px-5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-colors"
            disabled={isSaving || isLoading || !hasChanges || workspaces.length === 0}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
