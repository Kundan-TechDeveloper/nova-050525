import { getServerSession } from "next-auth"
import { deleteChat, getChatById } from "@/lib/db/queries"
import authOptions from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { chatId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const chat = await getChatById(params.chatId, organizationId)

    if (!chat) {
      return new Response("Chat not found", { status: 404 })
    }

    if (chat.userId !== Number.parseInt(session.user.id)) {
      return new Response("Unauthorized", { status: 401 })
    }

    await deleteChat(params.chatId)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
