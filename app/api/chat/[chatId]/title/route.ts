import { getServerSession } from "next-auth"
import { getChatById, updateChatTitle } from "@/lib/db/queries"
import authOptions from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { chatId: string } }) {
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

    const { title } = await request.json()

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new Response("Invalid title", { status: 400 })
    }

    await updateChatTitle(params.chatId, title.trim(), organizationId)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Error updating chat title:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
