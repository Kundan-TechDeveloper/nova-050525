"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchWorkspaceFiles } from "@/app/admin/workspaces/actions"
import { useRouter } from "next/navigation"

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceName: string
  currentPath: string
  workspaceId: string
  onFileUpload: (formData: FormData) => Promise<void>
}

interface WorkspaceFile {
  id: string
  workspaceId: string
  filepath: string
  fileType: "original" | "revision" | "amendment"
  originalFileId: string | null
  impactDate: Date | null
  createdAt: Date
}

// Add supported file types constant
const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls", ".csv", ".rtf"]
const SUPPORTED_MIME_TYPES =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/rtf"

interface UploadStatus {
  fileName: string
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function FileUploadDialog({
  isOpen,
  onClose,
  workspaceName,
  currentPath,
  workspaceId,
  onFileUpload,
}: FileUploadDialogProps) {
  const router = useRouter()
  const [files, setFiles] = useState<FileList | null>(null)
  const [fileType, setFileType] = useState<"original" | "revision" | "amendment">("original")
  const [originalFile, setOriginalFile] = useState<string>("")
  const [impactDate, setImpactDate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [openCombobox, setOpenCombobox] = useState(false)
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isFileTypeEnabled, setIsFileTypeEnabled] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [showUploadStatus, setShowUploadStatus] = useState(false)

  const BATCH_SIZE = 3 // Number of files to upload in parallel

  // Fetch workspace files
  const fetchFiles = async () => {
    if (!workspaceId) return

    try {
      setIsLoadingFiles(true)
      const { files, error } = await fetchWorkspaceFiles(workspaceId)

      if (error) {
        console.error("Error fetching files:", error)
        toast.error("Failed to load workspace files")
        return
      }

      if (files) {
        // Type assertion to ensure the files match our WorkspaceFile interface
        const typedFiles = files as WorkspaceFile[]
        setWorkspaceFiles(typedFiles)
      }
    } catch (error) {
      console.error("Error loading files:", error)
      toast.error("Failed to load workspace files")
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Load files when dialog opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchFiles()
    }
  }, [isOpen, workspaceId])

  // Filter original files from the current workspace
  const originalFiles = workspaceFiles.filter((doc) => {
    // console.log('Filtering file:', doc);  // Debug log
    return doc.fileType === "original"
  })
  const hasOriginalFiles = originalFiles.length > 0

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, workspaceId:", workspaceId)
      setFiles(null)
      setFileType("original")
      setOriginalFile("")
      setImpactDate("")
      setSearchQuery("")
      setOpenCombobox(false)
      setIsFileTypeEnabled(false)
      fetchFiles()
    }
  }, [isOpen, workspaceId])

  // Reset original file selection when file type changes
  useEffect(() => {
    if (fileType === "original") {
      setOriginalFile("")
      setImpactDate("")
    }
  }, [fileType])

  // Check if multiple files are selected
  const hasMultipleFiles = files && files.length > 1

  // Validate file extension
  const isValidFileType = (filename: string) => {
    const ext = "." + filename.split(".").pop()?.toLowerCase()
    return SUPPORTED_FILE_TYPES.includes(ext)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    setFiles(selectedFiles)
    // Enable file type selection only for single valid file
    setIsFileTypeEnabled(selectedFiles.length === 1)

    // Reset file type to original when files change
    setFileType("original")
  }

  const handleFileTypeChange = (value: "original" | "revision" | "amendment") => {
    console.log("File type changed to:", value, "Has original files:", hasOriginalFiles) // Debug log
    setFileType(value)
    if ((value === "revision" || value === "amendment") && !hasOriginalFiles) {
      toast.error("No original files available. Please upload an original file first.")
      return
    }
  }

  // Format file path for display
  const formatFilePath = (filepath: string): string => {
    if (!filepath) return ""
    const parts = filepath.split("/")
    return parts[parts.length - 1]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) return

    try {
      setIsLoading(true)
      setShowUploadStatus(true)

      // Initialize upload statuses
      const initialStatuses: UploadStatus[] = Array.from(files).map((file) => ({
        fileName: file.name,
        status: "pending",
      }))
      setUploadStatuses(initialStatuses)

      const fileArray = Array.from(files)
      let successCount = 0
      let failureCount = 0

      if (fileArray.length === 1) {
        // Single file upload logic remains the same
        const formData = new FormData()
        const file = fileArray[0]

        formData.append("file", file)
        formData.append("workspaceId", workspaceId)

        // Create filepath
        let filepath = workspaceName
        if (currentPath && currentPath.trim()) {
          const folderPath = currentPath.trim()
          filepath = `${filepath}/${folderPath}`
        }
        filepath = `${filepath}/${file.name}`
        formData.append("filepath", filepath)

        formData.append("fileType", fileType)

        if (fileType !== "original") {
          if (!originalFile) {
            throw new Error("Please select the original file")
          }
          const selectedOriginalFile = originalFiles.find((f) => f.id === originalFile)
          if (!selectedOriginalFile) {
            throw new Error("Original file not found")
          }
          formData.append("originalFileId", originalFile)
          formData.append("parentName", selectedOriginalFile.filepath.split("/").pop() || "")
          if (impactDate) {
            formData.append("impactDate", impactDate)
          }
        }

        // Update status to uploading
        setUploadStatuses((prev) => prev.map((status, i) => (i === 0 ? { ...status, status: "uploading" } : status)))

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error || "Upload failed")
        }

        const result = await response.json()

        setUploadStatuses((prev) =>
          prev.map((status, i) =>
            i === 0
              ? {
                  ...status,
                  status: "success",
                }
              : status,
          ),
        )

        toast.success("File uploaded successfully")
      } else {
        // Multiple files - use batch upload with immediate status updates
        const uploadPromises = fileArray.map(async (file, index) => {
          try {
            // Update status to uploading for this file
            setUploadStatuses((prev) =>
              prev.map((status, i) => (i === index ? { ...status, status: "uploading" } : status)),
            )

            const formData = new FormData()
            formData.append("file", file)
            formData.append("workspaceId", workspaceId)

            // Create filepath
            let filepath = workspaceName
            if (currentPath && currentPath.trim()) {
              const folderPath = currentPath.trim()
              filepath = `${filepath}/${folderPath}`
            }
            filepath = `${filepath}/${file.name}`
            formData.append("filepath", filepath)
            formData.append("fileType", fileType)

            // Send individual file request
            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error((await response.text()) || "Upload failed")
            }

            const result = await response.json()

            // Immediately update this file's status to success
            setUploadStatuses((prev) =>
              prev.map((status, i) =>
                i === index
                  ? {
                      ...status,
                      status: "success",
                    }
                  : status,
              ),
            )

            successCount++
            toast.success(`${file.name} uploaded successfully`)
            return { success: true, file: file.name }
          } catch (error) {
            // Immediately update this file's status to error
            setUploadStatuses((prev) =>
              prev.map((status, i) =>
                i === index
                  ? {
                      ...status,
                      status: "error",
                      error: error instanceof Error ? error.message : "Upload failed",
                    }
                  : status,
              ),
            )

            failureCount++
            toast.error(`Failed to upload ${file.name}`)
            return { success: false, file: file.name, error }
          }
        })

        // Wait for all uploads to complete but status updates happen in real-time
        await Promise.all(uploadPromises)

        // Show final summary only after all files are done
        if (failureCount === 0) {
          toast.success(`All ${successCount} files uploaded successfully`)
        } else {
          toast.error(`${successCount} file(s) uploaded, ${failureCount} file(s) failed`)
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      // Update all pending files to error status
      setUploadStatuses((prev) =>
        prev.map((status) =>
          status.status === "pending"
            ? {
                ...status,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : status,
        ),
      )
      toast.error("Failed to upload files")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseUploadDialog = () => {
    setShowUploadStatus(false)
    onClose()
    router.refresh()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white border border-zinc-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-900">Upload Files</DialogTitle>
            <DialogDescription className="text-[15px] text-zinc-600">
              Upload one or multiple files to the workspace
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-[13px] font-medium text-zinc-800 mb-1.5 block">
                Files
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                multiple
                accept={SUPPORTED_MIME_TYPES}
                className="bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors file:bg-zinc-100 file:text-zinc-700 file:border-0 file:hover:bg-zinc-200 file:transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Supported file types: PDF, Word, Text, CSV, Excel, RTF</p>
            </div>

            <div>
              <Label htmlFor="fileType" className="text-[13px] font-medium text-zinc-800 mb-1.5 block">
                File Type
              </Label>
              <Select value={fileType} onValueChange={handleFileTypeChange} disabled={!isFileTypeEnabled}>
                <SelectTrigger
                  className={cn(
                    "w-full h-10 bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors",
                    !isFileTypeEnabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <SelectValue placeholder="Select file type" className="text-zinc-600 placeholder:text-zinc-400" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-md">
                  <SelectItem
                    value="original"
                    className="text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                  >
                    Original
                  </SelectItem>
                  {hasOriginalFiles && (
                    <>
                      <SelectItem
                        value="revision"
                        className="text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                      >
                        Revision
                      </SelectItem>
                      <SelectItem
                        value="amendment"
                        className="text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                      >
                        Amendment
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {!isFileTypeEnabled && files && files.length > 1 && (
                <p className="text-sm text-zinc-500 mt-1.5">File type selection is disabled for multiple files</p>
              )}
              {!hasOriginalFiles && fileType !== "original" && (
                <p className="text-sm text-amber-600 mt-1.5">
                  No original files available in this workspace. Please upload an original file first to enable revision
                  and amendment options.
                </p>
              )}
            </div>

            {fileType !== "original" && !hasMultipleFiles && hasOriginalFiles && (
              <>
                <div className="relative">
                  <Label htmlFor="originalFile" className="text-[13px] font-medium text-zinc-800 mb-1.5 block">
                    Original File
                  </Label>
                  <Popover modal={true} open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-10 justify-between bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors"
                        disabled={isLoadingFiles}
                        onClick={() => setOpenCombobox(true)}
                      >
                        {isLoadingFiles
                          ? "Loading files..."
                          : originalFile
                            ? formatFilePath(originalFiles.find((file) => file.id === originalFile)?.filepath || "")
                            : "Select original file..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[465px] p-0 bg-white border border-zinc-200 shadow-md" align="start">
                      <Command className="bg-transparent">
                        <CommandInput
                          placeholder={isLoadingFiles ? "Loading..." : "Search files..."}
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          className="h-10 border-0 focus:ring-0 text-zinc-700 placeholder:text-zinc-400"
                        />
                        <CommandList className="max-h-[200px] overflow-y-auto workspace-scrollbar">
                          <CommandEmpty className="py-6 text-center text-[13px] text-zinc-600">
                            No files found.
                          </CommandEmpty>
                          <CommandGroup className="overflow-visible">
                            {isLoadingFiles ? (
                              <div className="py-6 text-center text-[13px] text-zinc-600">Loading files...</div>
                            ) : originalFiles.length === 0 ? (
                              <div className="py-6 text-center text-[13px] text-zinc-600">No files available</div>
                            ) : (
                              originalFiles
                                .filter((file) => {
                                  const filename = formatFilePath(file.filepath).toLowerCase()
                                  const search = searchQuery.toLowerCase()
                                  return filename.includes(search)
                                })
                                .map((file) => (
                                  <CommandItem
                                    key={file.id}
                                    value={formatFilePath(file.filepath)}
                                    onSelect={() => {
                                      setOriginalFile(file.id)
                                      setOpenCombobox(false)
                                    }}
                                    className={cn(
                                      "cursor-pointer py-2 px-2 text-zinc-900 flex items-center relative w-full transition-colors",
                                      originalFile === file.id
                                        ? "bg-blue-50 text-blue-900 hover:bg-blue-100"
                                        : "hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900",
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        originalFile === file.id ? "opacity-100 text-blue-600" : "opacity-0",
                                      )}
                                    />
                                    <span className="truncate block w-full text-zinc-900 hover:text-zinc-900 hover:bg-zinc-50">
                                      {formatFilePath(file.filepath)}
                                    </span>
                                  </CommandItem>
                                ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="impactDate" className="text-[13px] font-medium text-zinc-800 mb-1.5 block">
                    Impact Date
                  </Label>
                  <Input
                    id="impactDate"
                    type="date"
                    value={impactDate}
                    onChange={(e) => setImpactDate(e.target.value)}
                    className="h-10 bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:bg-zinc-500 [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2 pt-6 border-t border-zinc-200">
              <Button
                variant="outline"
                onClick={onClose}
                type="button"
                className="h-10 bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400 active:bg-zinc-200 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !files ||
                  isLoading ||
                  isLoadingFiles ||
                  (fileType !== "original" && !hasMultipleFiles && !originalFile)
                }
                className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadStatus} onOpenChange={setShowUploadStatus}>
        <DialogContent className="bg-white border border-zinc-200 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-900">Upload Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-hide">
            {uploadStatuses.map((status, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{status.fileName}</p>
                  {status.error && <p className="text-xs text-red-600 mt-0.5 truncate">{status.error}</p>}
                </div>
                <div className="ml-4 flex-shrink-0">
                  {status.status === "pending" && <span className="text-zinc-500">Pending</span>}
                  {status.status === "uploading" && (
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  )}
                  {status.status === "success" && <Check className="w-5 h-5 text-green-500" />}
                  {status.status === "error" && <span className="text-red-600">Failed</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <Button
              onClick={handleCloseUploadDialog}
              className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
