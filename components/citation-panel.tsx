"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronDown, FileText, Eye } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { FileViewerDialog } from "./file-viewer-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Source {
  filename: string
  fileID: string
  page_number?: number
  page_content: string
}

interface CitationPanelProps {
  isOpen: boolean
  onClose: () => void
  sources: { [key: string]: Source } | undefined
}

export function CitationPanel({ isOpen, onClose, sources }: CitationPanelProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{
    id: string
    filepath: string
    content: string
    url: string
    createdAt: string
  } | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  if (!sources || Object.keys(sources).length === 0) return null

  const handleSourceClick = (sourceKey: string) => {
    setExpandedSource(expandedSource === sourceKey ? null : sourceKey)
  }

  const handleFileClick = async (source: Source) => {
    setFileLoading(true)
    setFileError(null)
    try {
      const response = await fetch(`/api/document/${source.fileID}`, {
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
      console.log("citation panel data", data)
    } catch (error) {
      console.error("Error fetching file:", error)
      setFileError(error instanceof Error ? error.message : "Failed to load file")
    } finally {
      setFileLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.2 }}
          className="fixed right-0 top-0 h-screen w-[320px] bg-zinc-900/95 backdrop-blur-sm z-50 border-l border-zinc-800/50"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium text-zinc-200">Citations</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <div className="divide-y divide-zinc-800/50">
                {Object.entries(sources).map(([key, source]) => (
                  <div key={key} className="transition-colors">
                    <button
                      onClick={() => handleSourceClick(key)}
                      className="w-full text-left p-4 hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileClick(source)
                            }}
                            className="group flex items-center gap-2 hover:text-zinc-100"
                          >
                            <FileText size={14} className="text-zinc-400 group-hover:text-zinc-100 shrink-0" />
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <h3 className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 truncate max-w-[200px]">
                                    {source.filename}
                                  </h3>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                                  {source.filename}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </button>
                          {source.page_number && (
                            <span className="text-xs text-zinc-500 shrink-0 mt-0.5">Page {source.page_number}</span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm text-zinc-400 transition-all",
                            expandedSource === key ? "" : "line-clamp-2",
                          )}
                        >
                          {source.page_content}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSourceClick(key)
                          }}
                          className="mt-2 h-7 text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          {expandedSource === key ? "Show less" : "Show more"}
                        </Button>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-zinc-400 transition-transform mt-1",
                          expandedSource === key ? "rotate-180" : "",
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSource === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 bg-zinc-800/30"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <FileViewerDialog
        file={selectedFile}
        isLoading={fileLoading}
        error={fileError}
        onClose={() => {
          setSelectedFile(null)
          setFileError(null)
        }}
      />
    </AnimatePresence>
  )
}
