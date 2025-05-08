"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { ChatHeader } from "./chat-header"
import { cn } from "@/lib/utils"
import { Toaster } from "react-hot-toast"
import { useCitationStore } from "./message"
import { CitationPanel } from "./citation-panel"

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isOpen: citationOpen, sources, toggle } = useCitationStore()

  const handleToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen relative bg-background">
      <Toaster position="top-center" />
      <div
        className={cn(
          "fixed left-0 top-0 h-full z-20 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onToggle={handleToggle} />
      </div>

      <main
        className={cn(
          "flex-1 flex flex-col h-screen transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-0",
          citationOpen ? "mr-[320px]" : "mr-0",
        )}
      >
        <div
          className="fixed top-0 right-0 left-0 z-10 transition-all duration-300"
          style={{
            left: sidebarOpen ? "256px" : "0",
            right: citationOpen ? "320px" : "0",
          }}
        >
          <ChatHeader sidebarOpen={sidebarOpen} onToggle={handleToggle} />
        </div>
        <div className="flex-1 overflow-hidden mt-16">{children}</div>
      </main>

      <CitationPanel isOpen={citationOpen} onClose={() => toggle()} sources={sources} />
    </div>
  )
}
