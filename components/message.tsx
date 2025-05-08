"use client"

import { cn } from "@/lib/utils"
import { SparklesIcon, CopyIcon } from "./icons"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import type { Components } from "react-markdown"
import { create } from "zustand"

interface Source {
  filename: string
  fileID: string
  page_number?: number
  page_content: string
}

interface MessageProps {
  text: string
  isUser: boolean
  isStreaming?: boolean
  sources?: {
    [key: string]: Source
  }
  isDeletedWorkspace?: boolean
}

interface CitationStore {
  isOpen: boolean
  sources: { [key: string]: Source } | undefined
  setOpen: (isOpen: boolean, sources?: { [key: string]: Source }) => void
  toggle: (sources?: { [key: string]: Source }) => void
}

export const useCitationStore = create<CitationStore>((set) => ({
  isOpen: false,
  sources: undefined,
  setOpen: (isOpen: boolean, sources?: { [key: string]: Source }) => set({ isOpen, sources }),
  toggle: (sources?: { [key: string]: Source }) =>
    set((state: CitationStore) => {
      // If we're providing new sources, check if they're the same as current sources
      if (sources) {
        // If panel is open and same sources, close it
        if (state.isOpen && JSON.stringify(state.sources) === JSON.stringify(sources)) {
          return { isOpen: false, sources: undefined }
        }
        // Otherwise, open/keep open with new sources
        return { isOpen: true, sources }
      }
      // If no sources provided, just toggle the panel state
      return { isOpen: !state.isOpen, sources: state.sources }
    }),
}))

const components: Components = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "")
    return !inline && match ? (
      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0 }}>
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code {...props} className={className}>
        {children}
      </code>
    )
  },
}

export function Message({ text, isUser, isStreaming = false, sources, isDeletedWorkspace = false }: MessageProps) {
  const router = useRouter()
  const [isCopied, setIsCopied] = useState(false)
  const toggle = useCitationStore((state: CitationStore) => state.toggle)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <div className={cn("group relative py-4", isUser ? "bg-transparent" : "bg-transparent")}>
      <div className="mx-auto max-w-3xl flex gap-4 px-4">
        {!isUser && (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "size-8 flex items-center rounded-full justify-center shrink-0 border border-zinc-700 bg-background p-2",
                isStreaming && "animate-pulse",
              )}
            >
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex-1", isUser && "flex justify-end")}>
          <div className={cn("flex flex-col gap-2", isUser && "max-w-[70%]")}>
            <div
              className={cn(
                "max-w-fit",
                isUser && "bg-zinc-800/50 rounded-2xl border border-zinc-700/50 px-4 py-2",
                !isUser &&
                  "w-full prose prose-invert prose-pre:bg-zinc-800/50 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-lg max-w-none",
              )}
            >
              {isUser ? text : <ReactMarkdown components={components}>{text}</ReactMarkdown>}
              {isStreaming && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                  className="inline-block ml-1"
                >
                  ...
                </motion.span>
              )}
            </div>

            {/* Message Actions */}
            {!isStreaming && (
              <div className={cn("flex items-center gap-2 opacity-100 transition-opacity", isUser && "justify-end")}>
                {!isUser && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
                          onClick={handleCopy}
                        >
                          <CopyIcon size={14} />
                          <span className="sr-only">Copy message</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{isCopied ? "Copied!" : "Copy message"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {!isUser && sources && Object.keys(sources).length > 0 && !isDeletedWorkspace && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                          onClick={() => {
                            toggle(sources)
                          }}
                        >
                          {Object.keys(sources).length} citation{Object.keys(sources).length > 1 ? "s" : ""}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>View citations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
