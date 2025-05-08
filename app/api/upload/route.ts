import { type NextRequest, NextResponse } from "next/server"
import { createDocument } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join, sep } from "path"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db/db"
import { documentTable, organizations, workspaces } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".csv", ".rtf"]

export async function POST(request: NextRequest) {
  let fileID: string | null = null
  let savedFilePath: string | null = null

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""
    const formData = await request.formData()
    const file = formData.get("file") as File
    const workspaceId = formData.get("workspaceId") as string
    const filepath = formData.get("filepath") as string
    const fileType = formData.get("fileType") as string
    const originalFileId = formData.get("originalFileId") as string
    const originalFileName = formData.get("originalFileName") as string
    const impactDate = formData.get("impactDate") as string

    if (!file || !workspaceId || !filepath) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify workspace belongs to the organization
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.organizationId, organizationId)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found or access denied", { status: 404 })
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    // Check file extension
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      return new NextResponse("Unsupported file type", { status: 400 })
    }

    // Generate a unique file ID
    fileID = uuidv4()

    // Ensure filepath starts with Workspaces (capital W) for consistency
    const normalizedFilepath = filepath.startsWith("Workspaces/")
      ? filepath.replace("Workspaces/", `Workspaces/${org.slug}/`)
      : `Workspaces/${org.slug}/${filepath}`

    // Create the full path for the file
    const publicDir = join(process.cwd(), "public")
    const fullPath = join(publicDir, normalizedFilepath)
    savedFilePath = fullPath

    // Ensure the directories exist
    const fileDir = fullPath.substring(0, fullPath.lastIndexOf(sep))
    await mkdir(fileDir, { recursive: true })

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(fullPath, buffer)

    // Create a new FormData instance for Python API
    const pythonApiFormData = new FormData()
    pythonApiFormData.append("key", process.env.API_KEY || "")
    pythonApiFormData.append("file", new Blob([buffer], { type: file.type }))
    pythonApiFormData.append("filename", file.name)
    pythonApiFormData.append("fileID", fileID)
    pythonApiFormData.append("index", process.env.INDEX || "idbms")
    pythonApiFormData.append("workspace", workspaceId)
    pythonApiFormData.append("isOriginal", fileType === "original" ? "true" : "false")
    pythonApiFormData.append("isRevision", fileType === "revision" ? "true" : "false")
    pythonApiFormData.append("filepath", normalizedFilepath)

    if (originalFileId) {
      pythonApiFormData.append("parentID", originalFileId)
    }
    const parentName = formData.get("parentName") as string
    if (parentName) {
      pythonApiFormData.append("parentName", parentName)
    }
    if (impactDate) {
      pythonApiFormData.append("revisionDate", new Date(impactDate).toISOString().split("T")[0])
    }

    console.log("uploading file to python api", pythonApiFormData)

    // Call Python API Processing
    const pythonApiResponse = await fetch(process.env.PYTHON_API_URL + "/api/upload/", {
      method: "POST",
      body: pythonApiFormData,
    })

    if (!pythonApiResponse.ok) {
      console.error("Python API Error:", await pythonApiResponse.text())
      // Clean up the file since Python API failed
      if (savedFilePath) {
        await unlink(savedFilePath).catch(console.error)
      }
      throw new Error("Failed to process file in Python API")
    }

    // Create database record after Python API succeeds
    const document = await createDocument({
      id: fileID,
      workspaceId,
      organizationId,
      filepath: normalizedFilepath,
      fileType: fileType as "original" | "revision" | "amendment",
      originalFileId: originalFileId || undefined,
      impactDate: impactDate ? new Date(impactDate) : undefined,
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error in upload:", error)

    // Clean up on error
    try {
      if (savedFilePath) {
        await unlink(savedFilePath).catch(console.error)
      }
      if (fileID) {
        await db.delete(documentTable).where(eq(documentTable.id, fileID)).execute()
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError)
    }

    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", {
      status: 500,
    })
  }
}
