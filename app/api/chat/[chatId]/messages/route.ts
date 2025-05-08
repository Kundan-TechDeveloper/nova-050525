import { auth } from "@/lib/auth"
import { getChatById, getMessagesByChatId } from "@/lib/db/queries"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { chatId: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const chat = await getChatById(params.chatId, organizationId)

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const messages = await getMessagesByChatId(params.chatId)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
