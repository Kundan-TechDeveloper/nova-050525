import { auth } from "@/lib/auth"
import { getDocumentById } from "@/lib/db/queries"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { db } from "@/lib/db/db"
import { and, eq } from "drizzle-orm"
import { documentTable } from "@/lib/db/schema"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fsPromises from "fs/promises"

export async function GET(request: Request, { params }: { params: { documentId: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const organizationId = session.user.organizationId || ""
    const document = await getDocumentById(params.documentId, organizationId)

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get the base URL from the request
    const baseUrl = process.env.NEXTAUTH_URL

    // Ensure the filepath starts with Workspaces/
    // const normalizedPath = document.filepath.startsWith('Workspaces/')
    //   ? document.filepath.replace('Workspaces/', `Workspaces/${org.slug}/`)
    //   : `Workspaces/${org.slug}/${document.filepath}`;

    // Remove any 'public/' prefix if it exists
    const filePath = document.filepath.replace(/^public\//, "")

    // Construct the full URL to the file
    const fileUrl = `${baseUrl}/${filePath}`

    // For text files, read the content
    let content = ""
    if (document.filepath.toLowerCase().endsWith(".txt")) {
      try {
        const absolutePath = path.join(process.cwd(), "public", filePath)
        content = fs.readFileSync(absolutePath, "utf-8")
      } catch (error) {
        console.error("Error reading text file:", error)
        content = "Unable to read file content"
      }
    }

    return NextResponse.json({
      id: document.id,
      filepath: document.filepath,
      url: fileUrl,
      content,
      createdAt: document.createdAt,
    })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { documentId: string } }) {
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

    // Call Python API to delete document from vector store
    const formData = new FormData()
    formData.append("key", process.env.API_KEY || "")
    formData.append("index", process.env.INDEX || "idbms")
    formData.append("workspace", document.workspaceId)
    formData.append("deleteWorkspace", "false")
    formData.append("fileID", document.id)
    if (document.originalFileId) {
      formData.append("parentID", document.originalFileId)
    }

    console.log("Deleting document api request body: \n", formData)
    const pythonApiResponse = await fetch(process.env.PYTHON_API_URL + "/api/delete/", {
      method: "POST",
      body: formData,
    })

    if (!pythonApiResponse.ok) {
      console.error("Python API Error:", await pythonApiResponse.text())
      throw new Error("Failed to delete document from vector store")
    }

    // Delete the file from the filesystem
    const filePath = path.join(process.cwd(), "public", document.filepath)
    await fsPromises.unlink(filePath)

    // Delete from database
    await db.delete(documentTable).where(eq(documentTable.id, params.documentId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
