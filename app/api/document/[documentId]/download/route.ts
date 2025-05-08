import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { and, eq } from "drizzle-orm"
import { documentTable } from "@/lib/db/schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { documentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""

    const document = await db.query.documentTable.findFirst({
      where: and(eq(documentTable.id, params.documentId), eq(documentTable.organizationId, organizationId)),
    })

    if (!document) {
      return new NextResponse("Document not found", { status: 404 })
    }

    // Get the base URL from the request
    const baseUrl = process.env.NEXTAUTH_URL
    const fileUrl = `${baseUrl}/${document.filepath}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Error getting download URL:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
