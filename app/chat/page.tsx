import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { ChatInterface } from "@/components/chat-interface"
import authOptions from "@/lib/auth"

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <ChatLayout>
      <ChatInterface />
    </ChatLayout>
  )
}
