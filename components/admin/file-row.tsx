"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { FiDownload, FiTrash2, FiFolder, FiChevronRight, FiChevronDown } from "react-icons/fi"
import { FileViewerDialog } from "../file-viewer-dialog"
import { DocumentIcon } from "../icons"

interface FileStructure {
  name: string
  type: "folder" | "file"
  fileType?: string
  path: string
  children?: FileStructure[]
  createdAt: string
  id: string
}

interface FileData {
  id: string
  filepath: string
  content: string
  url: string
  createdAt: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

interface FileRowProps {
  item: FileStructure
  depth?: number
  isRenaming?: boolean
  newFolderPath?: string | null
  isSelected?: boolean
  onSelect?: (path: string) => void
  onRename?: (path: string, newName: string) => void
  onCreateSubfolder?: (parentPath: string) => void
  onUploadFiles?: (parentPath: string) => void
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
}

export default function FileRow({
  item,
  depth = 0,
  isRenaming = false,
  newFolderPath = null,
  isSelected = false,
  onSelect,
  onRename,
  onCreateSubfolder,
  onUploadFiles,
  onDelete,
  onDownload,
}: FileRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [showActions, setShowActions] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasChildren = item.children && item.children.length > 0

  useEffect(() => {
    if ((isRenaming || item.path === newFolderPath) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming, newFolderPath, item.path])

  useEffect(() => {
    if (hasChildren && item.children?.some((child) => child.name === "New Folder")) {
      setIsExpanded(true)
    }
  }, [hasChildren, item.children])

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onRename) {
      onRename(item.path, editName)
    } else if (e.key === "Escape") {
      setEditName(item.name)
      onRename?.(item.path, item.name)
    }
  }

  const handleCreateSubfolder = () => {
    setIsExpanded(true)
    onCreateSubfolder?.(item.path)
  }

  const handleFileView = async () => {
    if (item.type !== "file") return

    setFileLoading(true)
    setFileError(null)
    try {
      const response = await fetch(`/api/document/${item.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch file")
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

  const handleRowClick = () => {
    if (item.type === "folder") {
      setIsExpanded(!isExpanded)
      onSelect?.(item.path)
    } else {
      handleFileView()
    }
  }

  const getFileType = (filepath: string) => {
    const ext = filepath.split(".").pop()?.toLowerCase()

    // Text files
    if (["txt", "json", "js", "ts", "css", "html", "md"].includes(ext || "")) return "text"

    // PDF files
    if (ext === "pdf") return "pdf"

    // Document files (Office)
    const docExtensions = ["doc", "docx"]
    if (ext && docExtensions.includes(ext)) return "doc"

    // Spreadsheet files
    const spreadsheetExtensions = ["xlsx", "xls", "csv"]
    if (ext && spreadsheetExtensions.includes(ext)) return "spreadsheet"

    // Default to text for other types
    return "text"
  }

  const getFileIcon = (filepath: string): string | undefined => {
    const ext = filepath.split(".").pop()?.toLowerCase()

    // Spreadsheet files
    if (ext === "xlsx" || ext === "xls") {
      return "/images/xls-svg.svg"
    }
    if (ext === "csv") {
      return "/images/csv-svg.svg"
    }

    return undefined
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete?.(item.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <tr
        className={`group hover:bg-gray-50 transition-colors ${depth > 0 ? "bg-gray-50/50" : ""} ${isSelected ? "bg-blue-50" : ""} cursor-pointer`}
        onClick={handleRowClick}
      >
        <td className="py-3 flex items-center">
          <div style={{ width: `${depth * 2}rem` }} className="flex-shrink-0" />
          {item.type === "folder" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-1 hover:bg-gray-100 rounded-full mr-1 transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {item.type === "folder" ? (
            <FiFolder className={`w-4 h-4 ${hasChildren ? "text-yellow-500" : "text-gray-400"} mr-2`} />
          ) : (
            <div className={`flex items-center`}>
              <div className="w-6"></div>
              {getFileIcon(item.name) ? (
                <img src={getFileIcon(item.name)} alt={`${item.name} icon`} className="w-4 h-4" />
              ) : (
                <DocumentIcon
                  size={16}
                  fileType={getFileType(item.name)}
                  className="text-blue-500 transition-colors duration-150"
                />
              )}
              <div className="w-2"></div>
            </div>
          )}
          {isRenaming || item.path === newFolderPath ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleRename}
              onBlur={() => onRename?.(item.path, editName)}
              className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-center">
              <span className="text-gray-900 max-w-[300px] truncate" title={item.name}>
                {item.name}
              </span>
            </div>
          )}
        </td>
        <td className="py-3 text-sm text-gray-500">{item.type}</td>
        <td className="py-3 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
        <td className="py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload?.(item.id)
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiDownload className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiTrash2 className="w-4 h-4 text-red-500" />
              )}
            </button>
          </div>
        </td>
      </tr>

      <FileViewerDialog
        file={selectedFile}
        isLoading={fileLoading}
        error={fileError}
        onClose={() => {
          setSelectedFile(null)
          setFileError(null)
        }}
      />

      {isExpanded && item.children && (
        <>
          {[...item.children]
            .sort((a, b) => {
              // First sort by type (folders before files)
              if (a.type === "folder" && b.type === "file") return -1
              if (a.type === "file" && b.type === "folder") return 1
              // Then sort alphabetically within same type
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <FileRow
                key={child.path}
                item={child}
                depth={depth + 1}
                isRenaming={isRenaming}
                newFolderPath={newFolderPath}
                isSelected={isSelected}
                onSelect={onSelect}
                onRename={onRename}
                onCreateSubfolder={onCreateSubfolder}
                onUploadFiles={onUploadFiles}
                onDelete={onDelete}
                onDownload={onDownload}
              />
            ))}
        </>
      )}
    </>
  )
}
