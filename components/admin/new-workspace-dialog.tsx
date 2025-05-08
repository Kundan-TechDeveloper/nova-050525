"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FiX, FiSearch, FiTrash2 } from "react-icons/fi"
import { createWorkspace, fetchUsers, getWorkspaceAccess, deleteWorkspace } from "@/app/admin/workspaces/actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: number
  name: string | null
  email: string | null
  role: string | null
}

interface SelectedUser {
  id: number
  accessLevel: "view"
}

interface NewWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceCreated?: (workspaceId: string) => void
  mode?: "create" | "edit"
  workspace?: {
    id: string
    name: string
    description: string | null
  }
}

export default function NewWorkspaceDialog({
  isOpen,
  onClose,
  onWorkspaceCreated,
  mode = "create",
  workspace,
}: NewWorkspaceDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workspaceConfig, setWorkspaceConfig] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      const { users, error } = await fetchUsers()
      if (error) {
        toast.error("Failed to load users")
        return
      }

      if (users) {
        // Only show regular users (non-admin)
        const regularUsers = users.filter((user) => user.role !== "org_admin")
        setAvailableUsers(regularUsers)
      }
      setIsLoading(false)
    }

    if (isOpen) {
      if (mode === "edit" && workspace) {
        setName(workspace.name)
        setDescription(workspace.description || "")
        // Load workspace access info
        loadWorkspaceAccess(workspace.id)
      } else {
        setName("")
        setDescription("")
        setSelectedUsers([])
      }
      loadUsers()
    }
  }, [isOpen, mode, workspace])

  const loadWorkspaceAccess = async (workspaceId: string) => {
    const { access, error } = await getWorkspaceAccess(workspaceId)
    if (error) {
      toast.error("Failed to load workspace access")
      return
    }

    if (access) {
      // Only set regular users (non-admin) as selected
      const regularUsers = access
        .filter((a) => a.user.role !== "org_admin")
        .map((a) => ({
          id: a.user.id,
          accessLevel: "view" as const,
        }))
      setSelectedUsers(regularUsers)
    }
  }

  if (!isOpen) return null

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false,
  )

  const isValidJSON = (str: string) => {
    if (!str.trim()) return true
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    if (workspaceConfig && !isValidJSON(workspaceConfig)) {
      setError("Invalid JSON configuration")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Parse config if provided
      const config = workspaceConfig ? JSON.parse(workspaceConfig) : null
      console.log("config", config)

      const response = await createWorkspace({
        name,
        description,
        users: selectedUsers.map((user) => ({ id: user.id, accessLevel: "view" })),
        config, // Add this line
      })

      if (!response.success) {
        setError(response.error || "Failed to create workspace")
        setIsSubmitting(false)
        return
      }

      onClose()
      toast.success("Workspace created successfully")
    } catch (error) {
      console.error("Error creating workspace:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === userId)
      if (exists) {
        return prev.filter((u) => u.id !== userId)
      }
      return [...prev, { id: userId, accessLevel: "view" }]
    })
  }

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      const newSelectedUsers = filteredUsers.map((user) => ({
        id: user.id,
        accessLevel: "view" as const,
      }))
      setSelectedUsers(newSelectedUsers)
    }
  }

  const handleDelete = async () => {
    if (!workspace) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!workspace) return

    setIsDeleting(true)
    try {
      const result = await deleteWorkspace(workspace.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Workspace deleted successfully")
        if (onWorkspaceCreated) {
          onWorkspaceCreated(workspace.id)
        }
        onClose()
      }
    } catch (error) {
      toast.error("Failed to delete workspace")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
        style={{ margin: 0 }}
      >
        <div className="bg-white w-full max-w-2xl rounded-xl border border-zinc-200 shadow-2xl">
          <div className="px-6 py-4 border-b border-zinc-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  {mode === "create" ? "Create New Workspace" : "Edit Workspace"}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {mode === "create" ? "Set up a new collaborative workspace" : "Update workspace settings"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-700 transition-colors p-1.5 hover:bg-zinc-100 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder-zinc-400 text-zinc-900"
                  placeholder="Enter a descriptive name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder-zinc-400 text-zinc-900 min-h-[100px] resize-none"
                  placeholder="What is this workspace for?"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-zinc-700">Add Team Members</label>
                  <button
                    type="button"
                    onClick={toggleAllUsers}
                    className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder-zinc-400 text-zinc-900"
                    placeholder="Search by name or email..."
                  />
                </div>

                <div className="mt-3 max-h-[160px] overflow-y-auto workspace-scrollbar space-y-1 rounded-lg bg-white border border-zinc-200 p-1">
                  {isLoading ? (
                    <div className="px-3 py-2 text-sm text-zinc-500">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-zinc-500">No users found</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUsers.find((u) => u.id === user.id)
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-zinc-100 to-zinc-200 flex items-center justify-center text-zinc-700 font-medium shadow-sm">
                              {(user.name || user.email || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{user.name || "Unnamed User"}</p>
                              <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
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
            </div>

            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="config">
                  Workspace Configuration (JSON)
                </label>
                <Textarea
                  id="config"
                  placeholder='{"workspace": "name", "fields": [{"name": "field1", "type": "text"}]}'
                  value={workspaceConfig}
                  onChange={(e) => setWorkspaceConfig(e.target.value)}
                  className="min-h-[100px] w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder-zinc-400 text-zinc-900 resize-none"
                />
                <p className="text-sm text-zinc-500">Optional. Configure dynamic fields for this workspace.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-zinc-200">
              {mode === "edit" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Workspace"
                  )}
                </button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {mode === "create" ? "Creating..." : "Saving..."}
                    </>
                  ) : mode === "create" ? (
                    "Create Workspace"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white border border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Are you sure you want to delete this workspace? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
