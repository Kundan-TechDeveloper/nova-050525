"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocumentIcon } from "./icons"
import { cn } from "@/lib/utils"
import type { Document } from "@/lib/types"
import { FileViewerDialog } from "./file-viewer-dialog"

interface FileData extends Document {
  content: string
  url: string
}

interface DocumentsTabProps {
  isSearching: boolean
  searchQuery?: string
}

type FileType = "code" | "text" | "pdf" | "doc" | "unknown"

export function DocumentsTab({ isSearching, searchQuery }: DocumentsTabProps) {
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspaceId")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments()
    } else {
      setDocuments([])
    }
  }, [workspaceId])

  const fetchDocuments = async () => {
    if (!workspaceId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/documents`)
      if (!response.ok) throw new Error("Failed to fetch documents")
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileClick = async (documentId: string) => {
    setFileLoading(true)
    setFileError(null)
    try {
      const response = await fetch(`/api/document/${documentId}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch file")
      }

      const data = await response.json()
      setSelectedFile(data)
    } catch (error) {
      console.error("Error fetching file:", error)
      setFileError(error instanceof Error ? error.message : "Failed to load file")
    } finally {
      setFileLoading(false)
    }
  }

  // Get file type from extension
  const getFileType = (filepath: string): FileType => {
    const ext = filepath.split(".").pop()?.toLowerCase()

    // Text files
    if (ext === "txt") return "text"

    // PDF files
    if (ext === "pdf") return "pdf"

    // Document files (Office)
    const docExtensions = ["doc", "docx"]
    if (ext && docExtensions.includes(ext)) return "doc"

    // Default to text for other types
    return "text"
  }

  if (!workspaceId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="rounded-full bg-zinc-800/50 p-3 w-fit mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-400">
              <path
                d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Select a workspace</h3>
          <p className="text-sm text-zinc-400">Choose a workspace to view its documents</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <div className="text-center p-8 max-w-md">
                <div className="rounded-full bg-zinc-800/50 p-3 w-fit mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-400">
                    <path
                      d="M13 7L11.8845 4.76892C11.5634 4.1268 10.9344 3.71429 10.2309 3.71429H5.38095C4.34899 3.71429 3.5 4.56328 3.5 5.59524V18.4048C3.5 19.4367 4.34899 20.2857 5.38095 20.2857H18.619C19.651 20.2857 20.5 19.4367 20.5 18.4048V9.59524C20.5 8.56328 19.651 7.71429 18.619 7.71429H13.5309C13.1925 7.71429 12.8784 7.51288 12.7309 7.19524L13 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">No documents found</h3>
                <p className="text-sm text-zinc-400">This workspace doesn't have any documents yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-0.5">
              {documents
                .filter((doc) => !searchQuery || doc.filepath.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group",
                      "hover:bg-zinc-800/50 transition-colors duration-150",
                    )}
                    onClick={() => handleFileClick(doc.id)}
                  >
                    <DocumentIcon
                      size={14}
                      fileType={getFileType(doc.filepath)}
                      className={cn("text-zinc-400 transition-colors duration-150", "group-hover:text-zinc-300")}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{doc.filepath.split("/").pop()}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <FileViewerDialog
        file={selectedFile}
        isLoading={fileLoading}
        error={fileError}
        onClose={() => {
          setSelectedFile(null)
          setFileError(null)
        }}
      />
    </>
  )
}
