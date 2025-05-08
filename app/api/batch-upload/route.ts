import { type NextRequest, NextResponse } from "next/server"
import { createDocument } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import authOptions, { auth } from "@/lib/auth"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join, sep } from "path"
import { v4 as uuidv4 } from "uuid"
import { db } from "@/lib/db/db"
import { documentTable, organizations, workspaces } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls", ".csv", ".rtf"]

async function processFile(
  file: File,
  workspaceId: string,
  filepath: string,
  fileType: string,
  originalFileId?: string,
  impactDate?: string,
  parentName?: string,
) {
  let savedFilePath: string | null = null
  let fileID: string | null = null

  try {
    // Check file extension
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }

    // Generate a unique file ID
    fileID = uuidv4()

    // Create buffer from file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const organizationId = session.user.organizationId || ""

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new Error("Organization not found")
    }

    // Ensure filepath starts with Workspaces
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

    // Save file to disk
    await writeFile(fullPath, buffer)

    // Prepare Python API data
    const pythonApiFormData = new FormData()
    pythonApiFormData.append("key", process.env.API_KEY || "")
    pythonApiFormData.append("file", new Blob([buffer], { type: file.type })) // Send the actual file with correct mime type
    pythonApiFormData.append("filename", file.name)
    pythonApiFormData.append("fileID", fileID)
    pythonApiFormData.append("index", process.env.INDEX || "idbms")
    pythonApiFormData.append("workspace", workspaceId)
    pythonApiFormData.append("isOriginal", fileType === "original" ? "true" : "false")
    pythonApiFormData.append("isRevision", fileType === "revision" ? "true" : "false")
    pythonApiFormData.append("filepath", normalizedFilepath)
    pythonApiFormData.append("batch", "true") // Indicate this is part of a batch upload

    if (originalFileId) {
      pythonApiFormData.append("parentID", originalFileId)
    }
    if (parentName) {
      pythonApiFormData.append("parentName", parentName)
    }
    if (impactDate) {
      pythonApiFormData.append("revisionDate", new Date(impactDate).toISOString().split("T")[0])
    }

    console.log("Uploading file to Python API:\n", pythonApiFormData)

    // Call Python API
    const pythonApiResponse = await fetch(process.env.PYTHON_API_URL + "/api/upload/", {
      method: "POST",
      body: pythonApiFormData,
    })

    if (!pythonApiResponse.ok) {
      const errorText = await pythonApiResponse.text()
      console.error("Python API Error:", errorText)
      // Clean up the file since Python API failed
      if (savedFilePath) {
        await unlink(savedFilePath).catch(console.error)
      }
      throw new Error(`Failed to process file in Python API: ${errorText}`)
    }

    // Create database record
    const document = await createDocument({
      id: fileID,
      workspaceId,
      organizationId,
      filepath: normalizedFilepath,
      fileType: fileType as "original" | "revision" | "amendment",
      originalFileId: originalFileId || undefined,
      impactDate: impactDate ? new Date(impactDate) : undefined,
    })

    return { success: true, document }
  } catch (error) {
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

    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
      file: file.name,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const workspaceId = formData.get("workspaceId") as string
    const filepaths = formData.getAll("filepaths") as string[]
    const fileType = formData.get("fileType") as string
    const originalFileId = formData.get("originalFileId") as string
    const parentName = formData.get("parentName") as string
    const impactDate = formData.get("impactDate") as string

    if (!files.length || !workspaceId || !filepaths.length) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify workspace belongs to the organization
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.organizationId, organizationId)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found or access denied", { status: 404 })
    }

    console.log("Processing batch upload:", {
      fileCount: files.length,
      workspaceId,
      fileType,
    })

    // Process all files in parallel
    const results = await Promise.all(
      files.map((file, index) =>
        processFile(file, workspaceId, filepaths[index], fileType, originalFileId, impactDate, parentName),
      ),
    )

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length
    const failures = results.filter((r) => !r.success)

    console.log("Batch upload completed:", {
      total: files.length,
      successful: successCount,
      failed: failures.length,
      failedFiles: failures.map((f) => f.file),
    })

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: files.length,
        successful: successCount,
        failed: failures.length,
      },
    })
  } catch (error) {
    console.error("Error in batch upload:", error)
    return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", {
      status: 500,
    })
  }
}
