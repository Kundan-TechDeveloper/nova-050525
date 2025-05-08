"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FileIcon } from "./icons"
import { Download } from "lucide-react"
import { Button } from "./ui/button"

interface FileData {
  id: string
  filepath: string
  content: string
  url: string
  createdAt: string
}

interface FileViewerDialogProps {
  file: FileData | null
  isLoading: boolean
  error: string | null
  onClose: () => void
}

export function FileViewerDialog({ file, isLoading, error, onClose }: FileViewerDialogProps) {
  // Get file type from extension
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

  // Render file content based on type
  const renderFileContent = () => {
    if (!file) return null

    const fileType = getFileType(file.filepath)
    const fileName = file.filepath.split(/[/\\]/).pop()

    switch (fileType) {
      case "text":
        return (
          <div className="h-full w-full flex flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileIcon size={16} />
                <span className="text-sm font-medium text-zinc-300">{fileName}</span>
              </div>
              <div className="flex items-center gap-6 mr-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-zinc-300 hover:text-white"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <Download size={16} />
                  <span>Download</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="relative min-h-full">
                <div className="absolute inset-0">
                  <div className="h-full w-full">
                    <div className="p-6 min-h-full">
                      <pre
                        className="font-mono text-[15px] leading-[1.6] text-black"
                        style={{
                          tabSize: 2,
                          WebkitFontSmoothing: "antialiased",
                        }}
                      >
                        {file.content || "No content available"}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "pdf":
        return (
          <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileIcon size={16} />
                <span className="text-sm font-medium text-zinc-300">{fileName}</span>
              </div>
              <div className="flex items-center gap-6 mr-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-zinc-300 hover:text-white"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <Download size={16} />
                  <span>Open in New Tab</span>
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <iframe src={file.url} className="w-full h-full bg-white" style={{ border: "none" }} />
            </div>
          </div>
        )

      case "doc":
      case "spreadsheet":
        return (
          <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileIcon size={16} />
                <span className="text-sm font-medium text-zinc-300">{fileName}</span>
              </div>
              <div className="flex items-center gap-6 mr-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-zinc-300 hover:text-white"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <Download size={16} />
                  <span>Download File</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-12">
              <div className="flex flex-col items-center gap-6 max-w-md text-center">
                <div className="p-4 rounded-full bg-zinc-800/50">
                  <FileIcon size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-2">
                    {fileType === "spreadsheet"
                      ? "Spreadsheet Preview Not Available"
                      : "Document Preview Not Available"}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    This file type cannot be previewed directly in the browser. Please download it to view its contents.
                  </p>
                  <Button variant="outline" size="lg" className="gap-2" onClick={() => window.open(file.url, "_blank")}>
                    <Download size={16} />
                    <span>Download File</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileIcon size={16} />
                <span className="text-sm font-medium text-zinc-300">{fileName}</span>
              </div>
              <div className="flex items-center gap-2 mr-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-zinc-300 hover:text-white"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <Download size={16} />
                  <span>Download</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-zinc-900 p-12">
              <div className="flex flex-col items-center gap-4 max-w-md text-center">
                <div className="p-4 rounded-full bg-zinc-800/50">
                  <FileIcon size={32} />
                </div>
                <h3 className="text-lg font-medium text-zinc-200">Preview not available</h3>
                <p className="text-sm text-zinc-400">This file type is not supported for preview.</p>
                <Button variant="outline" size="lg" className="gap-2" onClick={() => window.open(file.url, "_blank")}>
                  <Download size={16} />
                  <span>Download File</span>
                </Button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog
      open={file !== null || error !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col bg-zinc-900 border-zinc-800">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-500 border-t-zinc-200"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="p-4 rounded-full bg-red-500/10 text-red-400">
                <FileIcon size={32} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Error Loading File</h3>
                <p className="text-sm text-zinc-400">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">{renderFileContent()}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
