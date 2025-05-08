import { auth } from "@/lib/auth"
import { getChatsByUserId } from "@/lib/db/queries"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const chats = await getChatsByUserId(session.user.id, organizationId)
    return NextResponse.json(chats)
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
