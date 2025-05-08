import { getServerSession } from "next-auth"
import { createChat, saveMessage, getChatById } from "@/lib/db/queries"
import { NextResponse } from "next/server"
import authOptions from "@/lib/auth"

function generateTitle(message: string): string {
  // Remove special characters and limit to first few words
  const cleanMessage = message.replace(/[^\w\s]/gi, "").trim()
  const words = cleanMessage.split(/\s+/)
  const titleWords = words.slice(0, 4)
  return titleWords.join(" ") + (words.length > 4 ? "..." : "")
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const organizationId = session.user.organizationId || ""
  const { chatId, isNewChat, conversation, workspace, fields } = await request.json()

  try {
    let currentChatId = chatId

    if (isNewChat) {
      // Generate title from the user's message
      const userMessage = conversation.new_question
      const title = generateTitle(userMessage)
      const newChat = await createChat({
        userId: session.user.id,
        title,
        workspaceId: workspace,
        organizationId: organizationId,
      })
      currentChatId = newChat.id
    } else {
      // Verify the chat belongs to the current workspace
      const chat = await getChatById(currentChatId, organizationId)
      if (chat.workspaceId !== workspace) {
        return NextResponse.json(
          {
            error: "Cannot continue chat in different workspace. Please start a new chat.",
            requireNewChat: true,
          },
          { status: 400 },
        )
      }
    }

    // Save user message
    await saveMessage({
      chatId: currentChatId,
      content: conversation.new_question,
      role: "user",
    })

    console.log(
      "Query api data:\n",
      "key: ",
      process.env.API_KEY,
      "\n",
      "conversation: ",
      conversation,
      "\n",
      "workspace: ",
      workspace,
      "\n",
      "fields: ",
      fields,
      "\n",
      "index: ",
      process.env.INDEX,
      "\n",
      "model: ",
      process.env.MODEL,
    )

    // Prepare the API request with fields if provided
    const apiRequestBody = {
      key: process.env.API_KEY,
      conversation,
      index: process.env.INDEX,
      workspace: workspace,
      model: process.env.MODEL,
    }

    // Add fields to the request if they exist
    if (fields && fields.length > 0) {
      apiRequestBody.fields = fields
    }

    // Make API call to get AI response
    const apiResponse = await fetch(process.env.PYTHON_API_URL + "/api/query/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })

    if (!apiResponse.ok) {
      throw new Error("Failed to get AI response")
    }

    const { answer, sources } = await apiResponse.json()

    // Save AI response with sources
    await saveMessage({
      chatId: currentChatId,
      content: answer,
      role: "assistant",
      sources,
    })

    return NextResponse.json({
      id: currentChatId,
      answer,
      sources,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const organizationId = session.user.organizationId || ""
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get("chatId")

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 })
  }

  try {
    const chat = await getChatById(chatId, organizationId)
    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
