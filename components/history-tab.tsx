"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"
// import { MessageCircle, MoreVertical,MoreHorizontalIcon, ShareIcon, Pencil, Trash } from "lucide-react";
import { MoreHorizontalIcon, PencilEditIcon, TrashIcon } from "./icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface Chat {
  id: string
  title: string
  createdAt: string
}

interface GroupedChats {
  today: Chat[]
  yesterday: Chat[]
  lastWeek: Chat[]
  older: Chat[]
}

interface HistoryTabProps {
  isSearching?: boolean
  searchQuery?: string
}

export function HistoryTab({ isSearching, searchQuery }: HistoryTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentChatId = searchParams.get("chatId")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [history, setHistory] = useState<GroupedChats>({
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  // Add effect to refresh history when chatId changes
  useEffect(() => {
    // Refresh history when a new chat is created or when switching chats
    fetchHistory()
  }, [currentChatId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/chat/history", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.status === 401) {
        window.location.href = "/login"
        return
      }
      if (!response.ok) throw new Error("Failed to fetch history")
      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent chat selection
    setActiveDropdownId(null) // Close dropdown
    setChatToDelete(chatId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!chatToDelete) return

    // Close all UI elements immediately
    setShowDeleteDialog(false)
    setActiveDropdownId(null)

    const deleteToast = toast.loading("Deleting chat...")
    try {
      const response = await fetch(`/api/chat/${chatToDelete}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      })

      if (response.status === 401) {
        toast.error("Unauthorized. Please login again.", { id: deleteToast })
        window.location.href = "/login"
        return
      }

      if (!response.ok) throw new Error("Failed to delete chat")

      // Remove chat from state
      setHistory((prev) => ({
        today: prev.today.filter((c) => c.id !== chatToDelete),
        yesterday: prev.yesterday.filter((c) => c.id !== chatToDelete),
        lastWeek: prev.lastWeek.filter((c) => c.id !== chatToDelete),
        older: prev.older.filter((c) => c.id !== chatToDelete),
      }))

      // If the deleted chat was the current one, redirect to /chat
      if (chatToDelete === currentChatId) {
        router.push("/chat")
      }

      toast.success("Chat deleted successfully", { id: deleteToast })
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast.error("Failed to delete chat", { id: deleteToast })
    } finally {
      // Clean up all states
      setChatToDelete(null)
      setActiveDropdownId(null)
    }
  }

  const handleChatClick = (chatId: string) => {
    router.replace(`/chat?chatId=${chatId}`)
  }

  const handleStartEditing = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent chat selection when clicking to edit
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value)
  }

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      await handleSaveTitle(chatId)
    } else if (e.key === "Escape") {
      setEditingChatId(null)
      setEditingTitle("")
    }
  }

  const handleTitleBlur = async (chatId: string) => {
    await handleSaveTitle(chatId)
  }

  const handleSaveTitle = async (chatId: string) => {
    if (!editingTitle.trim() || editingTitle.trim() === findChatTitle(chatId)) {
      setEditingChatId(null)
      setEditingTitle("")
      return
    }

    const newTitle = editingTitle.trim()

    // Immediately update UI
    setHistory((prev) => ({
      today: prev.today.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)),
      yesterday: prev.yesterday.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)),
      lastWeek: prev.lastWeek.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)),
      older: prev.older.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)),
    }))

    // Clear edit state immediately for better UX
    setEditingChatId(null)
    setEditingTitle("")

    // Update in background
    try {
      const response = await fetch(`/api/chat/${chatId}/title`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      if (!response.ok) {
        throw new Error("Failed to rename chat")
      }
    } catch (error) {
      console.error("Error renaming chat:", error)
      // Revert the title change in case of error
      setHistory((prev) => ({
        today: prev.today.map((c) => (c.id === chatId ? { ...c, title: findChatTitle(chatId) } : c)),
        yesterday: prev.yesterday.map((c) => (c.id === chatId ? { ...c, title: findChatTitle(chatId) } : c)),
        lastWeek: prev.lastWeek.map((c) => (c.id === chatId ? { ...c, title: findChatTitle(chatId) } : c)),
        older: prev.older.map((c) => (c.id === chatId ? { ...c, title: findChatTitle(chatId) } : c)),
      }))
      toast.error("Failed to rename chat")
    }
  }

  const findChatTitle = (chatId: string) => {
    const chat = [...history.today, ...history.yesterday, ...history.lastWeek, ...history.older].find(
      (c) => c.id === chatId,
    )
    return chat?.title || ""
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-zinc-500"></div>
      </div>
    )
  }

  const renderChatList = (chats: Chat[], title: string) => {
    if (chats.length === 0) return null

    // Filter chats based on search query
    const filteredChats = searchQuery
      ? chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : chats

    if (filteredChats.length === 0) return null

    return (
      <div className="relative">
        <div className="sticky top-0 z-10 bg-zinc-900">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-zinc-400">{title}</h3>
          </div>
        </div>
        <div className="space-y-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group flex items-center relative rounded-md mx-2",
                chat.id === currentChatId ? "bg-zinc-800 hover:bg-zinc-800" : "hover:bg-zinc-800/50",
              )}
              onClick={() => !editingChatId && handleChatClick(chat.id)}
            >
              <div className="flex-1 flex items-center gap-3 px-3 h-9 relative">
                {editingChatId === chat.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={handleTitleChange}
                      onKeyDown={(e) => handleTitleKeyDown(e, chat.id)}
                      onBlur={() => handleTitleBlur(chat.id)}
                      className={cn(
                        "w-full bg-transparent border rounded px-2",
                        "text-sm font-normal focus:outline-none",
                        "border-blue-500 focus:border-blue-500",
                        "transition-all duration-150",
                        "text-zinc-200",
                      )}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                    />
                  </>
                ) : (
                  <>
                    {/* <div className="text-zinc-500">
                      <MessageIcon size={16} />
                    </div> */}
                    <span
                      className={cn(
                        "truncate flex-1 text-sm font-normal px-2 -ml-2 rounded text-white",
                        "transition-colors duration-150 cursor-pointer",
                        // chat.id === currentChatId ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-200",
                        editingChatId === null && "hover:bg-zinc-800/30",
                      )}
                    >
                      {chat.title}
                    </span>
                  </>
                )}
              </div>

              <DropdownMenu
                open={activeDropdownId === chat.id}
                onOpenChange={(open) => setActiveDropdownId(open ? chat.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-opacity absolute right-2",
                      chat.id === currentChatId ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      editingChatId === chat.id && "hidden", // Hide when editing
                    )}
                    title="Options"
                    onClick={(e) => e.stopPropagation()} // Prevent chat selection when clicking dropdown
                  >
                    <div className="text-zinc-400">
                      <MoreHorizontalIcon size={16} />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 py-2 bg-zinc-900 border border-zinc-800"
                  onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus issues
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-zinc-400 hover:text-white focus:text-white focus:bg-zinc-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveDropdownId(null)
                      handleStartEditing(chat, e)
                    }}
                  >
                    <PencilEditIcon size={16} />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                    onClick={(e) => handleDelete(chat.id, e)}
                  >
                    <TrashIcon size={16} />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="space-y-6">
          {renderChatList(history.today, "Today")}
          {renderChatList(history.yesterday, "Yesterday")}
          {renderChatList(history.lastWeek, "Previous 30 Days")}
          {renderChatList(history.older, "Older")}
          {Object.values(history).every((arr) => arr.length === 0) && (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm py-4">No chat history</div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-400">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
