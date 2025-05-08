"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import WorkspaceList from "@/components/admin/workspace-list"
import FileRow from "@/components/admin/file-row"
import NewWorkspaceDialog from "@/components/admin/new-workspace-dialog"
import { FileUploadDialog } from "@/components/admin/file-upload-dialog"
import { fetchWorkspaces, fetchWorkspaceFiles } from "./actions"
import { FiPlus, FiUpload, FiFolderPlus, FiFolder } from "react-icons/fi"
import { toast } from "react-hot-toast"

interface FileStructure {
  name: string
  type: "folder" | "file"
  fileType?: string
  path: string
  children?: FileStructure[]
  createdAt: string
  id: string
}

interface WorkspaceData {
  id: string
  name: string
  description: string | null
  itemCount: number
  createdAt: Date
}

interface Workspace {
  id: string
  name: string
  description: string | null
  itemCount: number
  createdAt: string
}

function formatDateFull(dateStr: string) {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

function organizeFiles(files: any[]): FileStructure[] {
  const fileMap = new Map<string, FileStructure>()
  const rootItems: FileStructure[] = []

  files.forEach((file) => {
    const pathParts = file.filepath.split("/").filter(Boolean)
    // Skip the first three parts (Workspaces, org-slug, workspace name) and start from the fourth part
    const relevantParts = pathParts.slice(3)
    const basePath = pathParts.slice(0, 3).join("/") // Base path with Workspaces, org-slug, and workspace name
    let currentPath = basePath

    if (relevantParts.length === 0) {
      // If no parts left after skipping Workspaces, org-slug, and workspace name, this is a file in root
      const newItem: FileStructure = {
        name: pathParts[pathParts.length - 1],
        type: "file",
        path: file.filepath,
        createdAt: new Date(file.createdAt).toISOString(),
        id: file.id,
      }
      rootItems.push(newItem)
      return
    }

    relevantParts.forEach((part: string, index: number) => {
      const isLastPart = index === relevantParts.length - 1
      currentPath = `${currentPath}/${part}`

      if (!fileMap.has(currentPath)) {
        const newItem: FileStructure = {
          name: part,
          type: isLastPart ? "file" : "folder",
          path: currentPath,
          createdAt: new Date(file.createdAt).toISOString(),
          children: [],
          id: isLastPart ? file.id : undefined,
        }

        fileMap.set(currentPath, newItem)

        if (index === 0) {
          rootItems.push(newItem)
        } else {
          const parentPath = pathParts.slice(0, 3 + index).join("/")
          const parent = fileMap.get(parentPath)
          if (parent && parent.children) {
            parent.children.push(newItem)
          }
        }
      }
    })
  })

  return rootItems
}

// Add function to count items in a folder
const countItems = (folder: FileStructure): number => {
  let count = 0
  if (folder.children) {
    count += folder.children.length
    folder.children.forEach((child) => {
      if (child.type === "folder") {
        count += countItems(child)
      }
    })
  }
  return count
}

// Add function to find folder by path
const findFolderByPath = (path: string, items: FileStructure[]): FileStructure | null => {
  for (const item of items) {
    if (item.path === path) {
      return item
    }
    if (item.children) {
      const found = findFolderByPath(path, item.children)
      if (found) return found
    }
  }
  return null
}

export default function WorkspacesPage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [files, setFiles] = useState<FileStructure[] | null>(null)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [newFolderPath, setNewFolderPath] = useState<string | null>(null)
  const [tempFolders, setTempFolders] = useState<Record<string, FileStructure[]>>({})
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null)
  const [availableUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "user" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" },
    { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "user" },
  ])
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const fetchWorkspaceData = async () => {
    try {
      setWorkspaceError(null)
      const { workspaces: data, error } = await fetchWorkspaces()

      if (error) {
        console.error("Error fetching workspaces:", error)
        setWorkspaceError(error)
        return
      }

      if (data) {
        // Convert dates to strings
        const formattedWorkspaces: Workspace[] = (data as WorkspaceData[]).map((w) => ({
          ...w,
          createdAt: new Date(w.createdAt).toISOString(),
        }))
        setWorkspaces(formattedWorkspaces)
      } else {
        setWorkspaceError("No workspaces found")
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error)
      setWorkspaceError("Failed to fetch workspaces. Please try again.")
    }
  }

  const fetchFileData = async (workspaceId: string) => {
    try {
      const { files: data, error } = await fetchWorkspaceFiles(workspaceId)
      if (error) {
        setFilesError(error)
      } else if (data) {
        setFiles(organizeFiles(data))
        setFilesError(null)
      }
    } catch (error) {
      setFilesError("Failed to fetch files")
    }
  }

  const handleWorkspaceCreated = (workspaceId: string) => {
    // Refresh the workspaces list
    fetchWorkspaceData()
    // Auto-select the newly created workspace
    router.push(`/admin/workspaces?workspace=${workspaceId}`)
  }

  // Add helper function to get full path hierarchy
  const getFullPath = (parentPath: string, items: FileStructure[]): string[] => {
    const result: string[] = []
    const findPath = (path: string, currentItems: FileStructure[]) => {
      for (const item of currentItems) {
        if (item.path === path) {
          result.unshift(item.name)
          return true
        }
        if (item.children && findPath(path, item.children)) {
          result.unshift(item.name)
          return true
        }
      }
      return false
    }
    findPath(parentPath, items)
    return result
  }

  // Get the selected workspace from URL params or default to first one
  const selectedWorkspaceId = searchParams.workspace || workspaces[0]?.id
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId)

  // Combine regular files with temp folders for the current workspace only
  const fileStructure = [...(files || []), ...(selectedWorkspaceId ? tempFolders[selectedWorkspaceId] || [] : [])].sort(
    (a, b) => {
      // First sort by type (folders before files)
      if (a.type === "folder" && b.type === "file") return -1
      if (a.type === "file" && b.type === "folder") return 1
      // Then sort alphabetically within same type
      return a.name.localeCompare(b.name)
    },
  )

  // Update handleNewFolder to properly handle folder creation
  const handleNewFolder = () => {
    if (!selectedWorkspaceId) return

    const parentPath = selectedFolderPath || selectedWorkspaceId
    const uniqueId = Date.now().toString()
    const newPath = `${parentPath}/${uniqueId}`

    const newFolder: FileStructure = {
      name: "New Folder",
      type: "folder",
      path: newPath,
      createdAt: new Date().toISOString(),
      children: [],
      id: uniqueId,
    }

    if (selectedFolderPath) {
      // Add to existing folder's children
      setFiles((prev) => {
        if (!prev) return prev

        const updateFolderStructure = (items: FileStructure[]): FileStructure[] => {
          return items.map((item) => {
            if (item.path === parentPath) {
              return {
                ...item,
                children: [...(item.children || []), newFolder],
              }
            } else if (item.children) {
              return {
                ...item,
                children: updateFolderStructure(item.children),
              }
            }
            return item
          })
        }

        return updateFolderStructure(prev)
      })

      setTempFolders((prev) => {
        const currentWorkspaceFolders = prev[selectedWorkspaceId] || []
        const updateTempFolderStructure = (items: FileStructure[]): FileStructure[] => {
          return items.map((item) => {
            if (item.path === parentPath) {
              return {
                ...item,
                children: [...(item.children || []), newFolder],
              }
            } else if (item.children) {
              return {
                ...item,
                children: updateTempFolderStructure(item.children),
              }
            }
            return item
          })
        }

        return {
          ...prev,
          [selectedWorkspaceId]: updateTempFolderStructure(currentWorkspaceFolders),
        }
      })
    } else {
      // Add to root level
      setTempFolders((prev) => ({
        ...prev,
        [selectedWorkspaceId]: [...(prev[selectedWorkspaceId] || []), newFolder],
      }))
    }

    setNewFolderPath(newPath)
  }

  // Update handleCreateSubfolder similarly
  const handleCreateSubfolder = (parentPath: string) => {
    if (!selectedWorkspaceId) return

    const uniqueId = Date.now().toString()
    const newPath = `${parentPath}/${uniqueId}`

    const newFolder: FileStructure = {
      name: "New Folder",
      type: "folder",
      path: newPath,
      createdAt: new Date().toISOString(),
      children: [],
      id: uniqueId,
    }

    setFiles((prev) => {
      if (!prev) return prev

      const updateFolderStructure = (items: FileStructure[]): FileStructure[] => {
        return items.map((item) => {
          if (item.path === parentPath) {
            return {
              ...item,
              children: [...(item.children || []), newFolder],
            }
          } else if (item.children) {
            return {
              ...item,
              children: updateFolderStructure(item.children),
            }
          }
          return item
        })
      }

      const updatedFiles = updateFolderStructure(prev)
      const parentFound = JSON.stringify(updatedFiles) !== JSON.stringify(prev)
      return parentFound ? updatedFiles : prev
    })

    setTempFolders((prev) => {
      const currentWorkspaceFolders = prev[selectedWorkspaceId] || []
      const updateTempFolderStructure = (items: FileStructure[]): FileStructure[] => {
        return items.map((item) => {
          if (item.path === parentPath) {
            return {
              ...item,
              children: [...(item.children || []), newFolder],
            }
          } else if (item.children) {
            return {
              ...item,
              children: updateTempFolderStructure(item.children),
            }
          }
          return item
        })
      }

      const updatedTempFolders = updateTempFolderStructure(currentWorkspaceFolders)
      const parentFound = JSON.stringify(updatedTempFolders) !== JSON.stringify(currentWorkspaceFolders)

      const newWorkspaceFolders = parentFound ? updatedTempFolders : [...currentWorkspaceFolders, newFolder]

      return {
        ...prev,
        [selectedWorkspaceId]: newWorkspaceFolders,
      }
    })

    setNewFolderPath(newPath)
  }

  const handleFileUpload = (eOrPath?: React.MouseEvent | string) => {
    // If it's a MouseEvent, prevent propagation
    if (eOrPath && typeof eOrPath !== "string") {
      eOrPath.stopPropagation()
    }

    if (!selectedWorkspaceId) return
    setShowUploadDialog(true)
  }

  const handleFileUploadSubmit = async (formData: FormData) => {
    if (!selectedWorkspaceId || !selectedWorkspace) return

    try {
      formData.append("workspaceId", selectedWorkspaceId)

      // Get the filepath from the formData directly
      // The FileUploadDialog has already constructed the correct path
      const filepath = formData.get("filepath")
      console.log("Submitting file with path:", filepath)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      // Refresh the file list
      fetchFileData(selectedWorkspaceId)
      // toast.success('File uploaded successfully');
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
    }
  }

  const handleFolderRename = async (path: string, newName: string) => {
    if (!selectedWorkspaceId) return

    // Get the parent path and keep the unique ID
    const pathParts = path.split("/")
    const uniqueId = pathParts[pathParts.length - 1]
    const parentPath = pathParts.slice(0, -1).join("/")
    const newPath = `${parentPath}/${uniqueId}`

    // Check if this is a temp folder
    const isTempFolder = tempFolders[selectedWorkspaceId]?.some((f) => f.path === path)

    if (isTempFolder) {
      setTempFolders((prev) => ({
        ...prev,
        [selectedWorkspaceId]: (prev[selectedWorkspaceId] || []).map((folder) => {
          if (folder.path === path) {
            return {
              ...folder,
              name: newName,
              path: newPath,
            }
          }
          return folder
        }),
      }))
    } else {
      setFiles((prev) => {
        if (!prev) return null
        const updateFolderStructure = (items: FileStructure[]): FileStructure[] => {
          return items.map((item) => {
            if (item.path === path) {
              return {
                ...item,
                name: newName,
                path: newPath,
              }
            } else if (item.children) {
              return {
                ...item,
                children: updateFolderStructure(item.children),
              }
            }
            return item
          })
        }
        return updateFolderStructure(prev)
      })
    }

    setNewFolderPath(null)
  }

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/document/${documentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast.success("File deleted successfully")
      // Refresh file list
      if (selectedWorkspace) {
        await fetchFileData(selectedWorkspace.id)
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Failed to delete")
    }
  }

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/document/${documentId}/download`)
      if (!response.ok) {
        throw new Error("Failed to get download URL")
      }

      const data = await response.json()
      const a = document.createElement("a")
      a.href = data.url
      a.download = "" // This will force download instead of navigation
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading:", error)
      toast.error("Failed to download file")
    }
  }

  useEffect(() => {
    fetchWorkspaceData()
  }, [])

  useEffect(() => {
    const selectedWorkspaceId = searchParams.workspace || workspaces[0]?.id
    if (selectedWorkspaceId) {
      fetchFileData(selectedWorkspaceId)
    }
  }, [searchParams.workspace, workspaces])

  if (workspaceError) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200">{workspaceError}</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {workspaces.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <FiFolder className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">No Workspaces Available</h3>
            <p className="text-[15px] text-zinc-500 mb-6">Create your first workspace to get started</p>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center h-10 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm text-[15px]"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create Workspace
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex-none space-y-6 mb-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedFolderPath(null)
              }
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Workspaces</h1>
                <p className="text-sm text-zinc-600">Manage your workspaces and their contents here.</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center h-10 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm text-[15px]"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                New Workspace
              </button>
            </div>

            <div className="bg-zinc-50/80 border border-zinc-200 rounded-lg p-6">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <WorkspaceList
                  workspaces={workspaces}
                  selectedId={selectedWorkspaceId}
                  onWorkspaceUpdate={fetchWorkspaceData}
                />
              </Suspense>
            </div>
          </div>

          {selectedWorkspace && (
            <div
              className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-zinc-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-none px-6 py-4 border-b border-zinc-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <FiFolder className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-semibold text-zinc-900">
                          {selectedWorkspace.name}
                          {selectedFolderPath &&
                            (() => {
                              const pathParts = getFullPath(selectedFolderPath, fileStructure)
                              return pathParts.length > 0 ? ` > ${pathParts.join(" > ")}` : ""
                            })()}
                        </h2>
                        <p className="text-[13px] text-zinc-500">
                          {selectedWorkspace.itemCount || 0} items • Last updated{" "}
                          {formatDateFull(selectedWorkspace.createdAt)}
                          {selectedFolderPath &&
                            (() => {
                              const selectedFolder = findFolderByPath(selectedFolderPath, fileStructure)
                              const itemCount = selectedFolder ? countItems(selectedFolder) : 0
                              return ` • ${itemCount} items in current folder`
                            })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleNewFolder}
                      className="inline-flex items-center h-9 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm text-[13px]"
                    >
                      <FiFolderPlus className="w-4 h-4 mr-2" />
                      New Folder {selectedFolderPath ? "Here" : ""}
                    </button>
                    <button
                      onClick={(e) => handleFileUpload(e)}
                      className="inline-flex items-center h-9 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm text-[13px]"
                    >
                      <FiUpload className="w-4 h-4 mr-2" />
                      Upload Files {selectedFolderPath ? "Here" : ""}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 min-h-0 p-6 overflow-y-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedFolderPath(null)
                  }
                }}
              >
                {filesError ? (
                  <div className="text-center py-8">
                    <p className="text-[15px] text-red-500">{filesError}</p>
                  </div>
                ) : !files ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="max-h-[180px] overflow-y-auto workspace-scrollbar">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-left border-b border-zinc-200">
                          <th className="pb-3 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                          <th className="pb-3 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                          <th className="pb-3 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                          <th className="pb-3 text-[13px] font-medium text-zinc-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {fileStructure.map((item) => (
                          <FileRow
                            key={item.path}
                            item={item}
                            newFolderPath={newFolderPath}
                            isSelected={item.path === selectedFolderPath}
                            onSelect={setSelectedFolderPath}
                            onRename={handleFolderRename}
                            onCreateSubfolder={handleCreateSubfolder}
                            onUploadFiles={handleFileUpload}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <NewWorkspaceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />

      {/* File Upload Dialog */}
      {selectedWorkspace && (
        <FileUploadDialog
          isOpen={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false)
            // Refresh both workspace and file data when dialog closes
            if (selectedWorkspaceId) {
              Promise.all([fetchWorkspaceData(), fetchFileData(selectedWorkspaceId)])
            }
          }}
          workspaceName={selectedWorkspace.name}
          currentPath={
            selectedFolderPath
              ? (() => {
                  const pathParts = getFullPath(selectedFolderPath, fileStructure)
                  console.log("Path parts for upload:", pathParts.join("/"))
                  return pathParts.join("/")
                })()
              : ""
          }
          workspaceId={selectedWorkspace.id}
          onFileUpload={async (formData) => {
            await handleFileUploadSubmit(formData)
            // Refresh both workspace and file data after successful upload
            if (selectedWorkspaceId) {
              await Promise.all([fetchWorkspaceData(), fetchFileData(selectedWorkspaceId)])
            }
          }}
        />
      )}
    </div>
  )
}
