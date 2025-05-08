"use client"

import { useState, useRef, useEffect } from "react"
import { Message } from "./message"
import { MessageInput } from "./message-input"
import { Welcome } from "./welcome"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { useCitationStore } from "./message"
import { WorkspaceFields } from "./workspace-fields"

interface ChatMessage {
  id: string
  content: {
    role: "user" | "assistant"
    content: string
    sources?: {
      [key: string]: {
        filename: string
        fileID: string
        page_number?: number
        page_content: string
      }
    }
  }
  createdAt: string
}

interface Document {
  id: string
  filepath: string
  createdAt: string
}

interface Workspace {
  id: string
  name: string
}

interface WorkspaceField {
  name: string
  type: "text" | "textarea" | "dropdown" | "multi-line"
  options?: string[]
  default?: string
}

interface WorkspaceConfig {
  workspace: string
  fields: WorkspaceField[]
}

export function ChatInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get("chatId")
  const workspaceId = searchParams.get("workspaceId")
  const setOpen = useCitationStore((state) => state.setOpen)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState("")
  const [isDeletedWorkspace, setIsDeletedWorkspace] = useState(false)
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  const scrollToBottomImmediate = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (streamedResponse) {
      scrollToBottom()
    }
  }, [streamedResponse])

  useEffect(() => {
    if (chatId) {
      fetchMessages()
      fetchChatDetails()
      // Close citation panel when switching chats
      setOpen(false)
    } else {
      setMessages([])
      // Also close citation panel when clearing chat
      setOpen(false)
      // Reset deleted workspace state when starting a new chat
      setIsDeletedWorkspace(false)
    }
  }, [chatId])

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments()
      fetchWorkspaceConfig()
    } else {
      setDocuments([])
      setWorkspaceConfig(null)
      setFieldValues({})
    }
  }, [workspaceId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        credentials: "include",
        cache: "no-store",
      })
      if (response.status === 401) {
        // Session expired, redirect to login
        window.location.href = "/login?error=Session%20expired"
        return
      }
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      if (data.length > 0) {
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/documents`, {
        credentials: "include",
        cache: "no-store",
      })
      if (response.status === 401) {
        // Session expired, redirect to login
        window.location.href = "/login?error=Session%20expired"
        return
      }
      if (!response.ok) throw new Error("Failed to fetch documents")
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const fetchWorkspaceConfig = async () => {
    try {
      const response = await fetch(`/api/workspace-config?workspaceId=${workspaceId}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (response.status === 401) {
        // Session expired, redirect to login
        window.location.href = "/login?error=Session%20expired"
        return
      }
      if (!response.ok) throw new Error("Failed to fetch workspace configuration")
      const data = await response.json()
      setWorkspaceConfig(data)

      // Initialize field values with defaults
      if (data && data.fields) {
        const initialValues: Record<string, string> = {}
        data.fields.forEach((field: WorkspaceField) => {
          initialValues[field.name] = field.default || ""
        })
        setFieldValues(initialValues)
      }
    } catch (error) {
      console.error("Error fetching workspace configuration:", error)
    }
  }

  const fetchChatDetails = async () => {
    if (!chatId) {
      setIsDeletedWorkspace(false)
      return
    }

    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) throw new Error("Failed to fetch chat details")

      const chat = await response.json()

      // Set isDeletedWorkspace based on whether the chat has a workspaceId
      setIsDeletedWorkspace(!chat.workspaceId)

      // If chat has a workspace, update the URL
      if (chat.workspaceId && chat.workspaceId !== workspaceId) {
        router.replace(`/chat?chatId=${chatId}&workspaceId=${chat.workspaceId}`)
      }
    } catch (error) {
      console.error("Error fetching chat details:", error)
      // Reset deleted workspace state on error
      setIsDeletedWorkspace(false)
    }
  }

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    if (isLoading) {
      toast.error("Please wait for the current response to complete")
      return
    }

    // Check if workspace is selected
    if (!workspaceId && !chatId) {
      toast(
        <div className="flex items-start gap-2 -mt-1">
          <div className="shrink-0 rounded-full p-2 bg-red-500/10">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-red-500"
            >
              <path
                d="M8 1.33333C4.31333 1.33333 1.33333 4.31333 1.33333 8C1.33333 11.6867 4.31333 14.6667 8 14.6667C11.6867 14.6667 14.6667 11.6867 14.6667 8C14.6667 4.31333 11.6867 1.33333 8 1.33333ZM8.66667 11.3333H7.33333V10H8.66667V11.3333ZM8.66667 8.66667H7.33333V4.66667H8.66667V8.66667Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-red-500">No workspace available</p>
            <p className="text-sm text-zinc-400">Please contact an admin to get access to a workspace.</p>
          </div>
        </div>,
        {
          duration: 4000,
          className: "!bg-zinc-900 !border !border-red-500/20 !p-4 !rounded-lg !shadow-xl",
          position: "top-center",
        },
      )
      return
    }

    // Reset deleted workspace state when starting a new chat
    if (!chatId) {
      setIsDeletedWorkspace(false)
    }

    // Add optimistic update
    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      content: {
        role: "user",
        content: message,
      },
      createdAt: new Date().toISOString(),
    }

    // Update messages optimistically and scroll immediately
    setMessages((prev) => [...prev, tempMessage])
    scrollToBottomImmediate()

    setIsLoading(true)
    setStreamedResponse("")

    try {
      // Prepare fields array for API request
      const fields = workspaceConfig?.fields
        ? Object.entries(fieldValues).map(([fieldname, fieldvalue]) => ({
            fieldname,
            fieldvalue,
          }))
        : []
      console.log(fields);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          isNewChat: !chatId,
          conversation: {
            prev_question: messages.length > 0 ? messages[messages.length - 2]?.content.content : "",
            prev_answer: messages.length > 0 ? messages[messages.length - 1]?.content.content : "",
            new_question: message,
          },
          workspace: workspaceId,
          fields: fields.length > 0 ? fields : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.requireNewChat) {
          return
        }
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      // Simulate streaming by splitting the response into chunks
      const chunks = data.answer.split(" ")
      let streamedText = ""

      for (const word of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        streamedText += word + " "
        setStreamedResponse(streamedText.trim())
      }

      // After streaming is complete, add the full message
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
        createdAt: new Date().toISOString(),
      }

      // Clear streamed response before adding the final message
      setStreamedResponse("")
      setMessages((prev) => [...prev, aiMessage])

      // Only update URL after successful message save
      if (!chatId) {
        const newChatId = data.id
        router.replace(`/chat?chatId=${newChatId}${workspaceId ? `&workspaceId=${workspaceId}` : ""}`)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {isDeletedWorkspace && chatId && (
        <div className="max-w-3xl mx-auto w-full px-4">
          <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-500">Workspace No Longer Available</h3>
                {/* <div className="mt-1 text-sm text-yellow-500/80">
                  This chat belongs to a workspace that has been deleted. You can view the chat history, but you cannot continue the conversation.
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row h-full">
        {workspaceConfig && workspaceConfig.fields && workspaceConfig.fields.length > 0 && (
          <div className="w-full md:w-1/3 border-r border-zinc-800 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Dynamic Structured Fields</h3>
              <WorkspaceFields fields={workspaceConfig.fields} values={fieldValues} onChange={handleFieldChange} />
            </div>
          </div>
        )}

        <div className={`flex-1 flex flex-col ${workspaceConfig?.fields?.length ? "md:w-2/3" : "w-full"}`}>
          {messages.length === 0 ? (
            <Welcome onSendMessage={handleSendMessage} />
          ) : (
            <>
              <div className="flex-1 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden message-scrollbar">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <Message
                      key={message.id}
                      text={message.content.content}
                      isUser={message.content.role === "user"}
                      sources={message.content.sources}
                      isDeletedWorkspace={isDeletedWorkspace}
                    />
                  ))}
                  {isLoading && (
                    <Message
                      text={streamedResponse}
                      isUser={false}
                      isStreaming={true}
                      isDeletedWorkspace={isDeletedWorkspace}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent">
                <MessageInput
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  disabled={isDeletedWorkspace}
                  placeholder={
                    isDeletedWorkspace
                      ? "This chat's workspace has been deleted. You cannot send new messages."
                      : !workspaceId && !chatId
                        ? "No workspace available. Contact an admin to get access."
                        : undefined
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
