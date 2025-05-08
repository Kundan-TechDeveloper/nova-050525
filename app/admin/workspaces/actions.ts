"use server"

import {
  createWorkspace as dbCreateWorkspace,
  createWorkspaceAccess,
  getWorkspaces,
  getWorkspaceFiles,
  updateWorkspace as dbUpdateWorkspace,
  getWorkspaceAccess as dbGetWorkspaceAccess,
  deleteWorkspace as dbDeleteWorkspace,
} from "@/lib/db/queries"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getAllUsers } from "@/lib/db/queries"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db/db"
import { workspaceAccess, workspaces, documentTable, type Workspace, organizations } from "@/lib/db/schema"
import { unlink, rmdir, rename } from "fs/promises"
import { join } from "path"
import { access } from "fs/promises"

export async function fetchWorkspaces() {
  try {
    const session = await auth()
    const organizationId = session?.user?.organizationId || ""
    const workspaces = await getWorkspaces(organizationId)
    return { workspaces, error: null }
  } catch (error) {
    return { workspaces: null, error: "Failed to fetch workspaces" }
  }
}

export async function fetchWorkspaceFiles(workspaceId: string) {
  try {
    const session = await auth()
    const organizationId = session?.user?.organizationId || ""
    const files = await getWorkspaceFiles(workspaceId, organizationId)
    return { files, error: null }
  } catch (error) {
    return { files: null, error: "Failed to fetch workspace files" }
  }
}

interface User {
  id: number
  email: string | null
  name: string | null
  role: string | null
}

export async function createWorkspace(formData: {
  name: string
  description: string
  users: { id: number; accessLevel: "view" }[]
  config?: any // Add this line to accept workspace configuration
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if workspace name already exists
    const existingWorkspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.name, formData.name), eq(workspaces.organizationId, session.user.organizationId || "")),
    })
    console.log("existingWorkspace", existingWorkspace)

    if (existingWorkspace) {
      return { success: false, error: "A workspace with this name already exists" }
    }

    // Create the workspace
    const workspace = await dbCreateWorkspace({
      name: formData.name,
      description: formData.description,
      organizationId: session.user.organizationId || "",
      config: formData.config || null, // Add this line
    })
    console.log("workspace", workspace)
    // Get all admin users
    const allUsers = await getAllUsers(session.user.organizationId || "")
    const adminUsers = allUsers.filter((user) => user.role === "org_admin")
    console.log("adminUsers", adminUsers)
    // Prepare access entries for both admin users and selected regular users
    const accessEntries = [
      // Admin users get admin access
      ...adminUsers.map((admin: User) => ({
        id: admin.id,
        accessLevel: "admin" as const,
      })),
      // Regular selected users get view access
      ...formData.users,
    ]

    // Create a Set of unique user IDs to handle any potential duplicates
    const uniqueUsers = new Set(
      accessEntries.map((user) => JSON.stringify({ id: user.id, accessLevel: user.accessLevel })),
    )

    // Add access for all users without duplicates
    await Promise.all(
      Array.from(uniqueUsers).map((userStr) => {
        const user = JSON.parse(userStr)
        return createWorkspaceAccess(workspace.id, user.id, user.accessLevel)
      }),
    )
    console.log("workspaceAccess", workspaceAccess)
    // Revalidate both the workspaces list and the specific workspace page
    revalidatePath("/admin/workspaces")
    revalidatePath(`/admin/workspaces/${workspace.id}`)

    return { success: true, error: null, workspace }
  } catch (error: any) {
    console.error("Failed to create workspace:", error)
    // Check for unique constraint violation
    if (error?.code === "23505") {
      return { success: false, error: "Some users already have access to this workspace" }
    }
    return { success: false, error: "Failed to create workspace" }
  }
}

export async function deleteWorkspace(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get workspace details first
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, id), eq(workspaces.organizationId, session.user.organizationId || "")),
    })

    if (!workspace) {
      return { success: false, error: "Workspace not found" }
    }

    // Get all documents in the workspace
    const documents = await db.query.documentTable.findMany({
      where: and(
        eq(documentTable.workspaceId, id),
        eq(documentTable.organizationId, session.user.organizationId || ""),
      ),
    })

    // Only call Python API if there are documents in the workspace
    if (documents.length > 0) {
      // Call Python API to delete workspace from vector store
      const formData = new FormData()
      formData.append("key", process.env.API_KEY || "")
      formData.append("index", process.env.INDEX || "idbms")
      formData.append("workspace", id)
      formData.append("deleteWorkspace", "true")

      console.log("Deleting workspace api request body: \n", formData)
      const pythonApiResponse = await fetch(process.env.PYTHON_API_URL + "/api/delete/", {
        method: "POST",
        body: formData,
      })

      if (!pythonApiResponse.ok) {
        console.error("Python API Error:", await pythonApiResponse.text())
        throw new Error("Failed to delete workspace from vector store")
      }

      // Delete files from the filesystem
      for (const doc of documents) {
        try {
          const filePath = join(process.cwd(), "public", doc.filepath)
          await unlink(filePath)
        } catch (error) {
          console.error(`Failed to delete file ${doc.filepath}:`, error)
        }
      }
    }

    // Try to remove workspace directory
    try {
      const workspacePath = join(process.cwd(), "public", "workspaces", workspace.name)
      await rmdir(workspacePath, { recursive: true })
    } catch (error) {
      console.error("Failed to remove workspace directory:", error)
    }

    await dbDeleteWorkspace(id, session.user.organizationId || "")

    // Revalidate the workspaces list
    revalidatePath("/admin/workspaces")

    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to delete workspace:", error)
    return { success: false, error: "Failed to delete workspace" }
  }
}

export async function fetchUsers() {
  try {
    const session = await auth()
    const organizationId = session?.user?.organizationId || ""
    const users = await getAllUsers(organizationId)
    return { users, error: null }
  } catch (error) {
    return { users: null, error: "Failed to fetch users" }
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { currentUser: null, error: "Not authenticated" }
    }

    return { currentUser: session.user, error: null }
  } catch (error) {
    return { currentUser: null, error: "Failed to get current user" }
  }
}

export async function updateWorkspace(
  id: string,
  formData: {
    name: string
    description: string
    users: { id: number; accessLevel: "view" }[]
    config?: any // Add this line
  },
): Promise<{
  success: boolean
  error: string | null
  workspace?: Workspace
}> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get the current workspace details
    const currentWorkspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, id), eq(workspaces.organizationId, session.user.organizationId || "")),
    })

    if (!currentWorkspace) {
      return { success: false, error: "Workspace not found" }
    }

    // Check if name is being changed
    if (formData.name !== currentWorkspace.name) {
      // Check if the new name already exists
      const existingWorkspace = await db.query.workspaces.findFirst({
        where: and(
          eq(workspaces.name, formData.name),
          eq(workspaces.organizationId, session.user.organizationId || ""),
        ),
      })

      if (existingWorkspace) {
        return { success: false, error: "A workspace with this name already exists" }
      }

      // Get all documents in the workspace to update their paths
      const documents = await db.query.documentTable.findMany({
        where: and(
          eq(documentTable.workspaceId, id),
          eq(documentTable.organizationId, session.user.organizationId || ""),
        ),
      })

      // Get the organization name
      const org = await db.query.organizations.findFirst({
        where: and(eq(organizations.id, session.user.organizationId || "")),
      })

      if (!org) {
        return { success: false, error: "Organization not found" }
      }

      // Update folder name in the filesystem
      const oldPath = join(process.cwd(), "public", "workspaces", org.slug, currentWorkspace.name)
      const newPath = join(process.cwd(), "public", "workspaces", org.slug, formData.name)

      try {
        // Rename the workspace directory if it exists
        const oldPathExists = await access(oldPath)
          .then(() => true)
          .catch(() => false)
        if (oldPathExists) {
          await rename(oldPath, newPath)
        }

        // Update file paths in the database
        for (const doc of documents) {
          const updatedFilepath = doc.filepath.replace(
            `Workspaces/${org.slug}/${currentWorkspace.name}/`,
            `Workspaces/${org.slug}/${formData.name}/`,
          )

          await db
            .update(documentTable)
            .set({ filepath: updatedFilepath })
            .where(
              and(eq(documentTable.id, doc.id), eq(documentTable.organizationId, session.user.organizationId || "")),
            )
        }
      } catch (error) {
        console.error("Error updating workspace paths:", error)
        return { success: false, error: "Failed to update workspace paths" }
      }
    }

    // Update the workspace
    const workspace = await dbUpdateWorkspace(
      id,
      {
        name: formData.name,
        description: formData.description,
        config: formData.config, // Add this line
      },
      session.user.organizationId || "",
    )

    // Get all admin users
    const allUsers = await getAllUsers(session.user.organizationId || "")
    const adminUsers = allUsers.filter((user) => user.role === "org_admin")

    // Prepare access entries for both admin users and selected regular users
    const accessEntries = [
      // Admin users get admin access
      ...adminUsers.map((admin: User) => ({
        id: admin.id,
        accessLevel: "admin" as const,
      })),
      // Regular selected users get view access
      ...formData.users,
    ]

    // Create a Set of unique user IDs to handle any potential duplicates
    const uniqueUsers = new Set(
      accessEntries.map((user) => JSON.stringify({ id: user.id, accessLevel: user.accessLevel })),
    )

    // Remove existing access entries
    await db.delete(workspaceAccess).where(eq(workspaceAccess.workspaceId, id))

    // Add new access entries
    await Promise.all(
      Array.from(uniqueUsers).map((userStr) => {
        const user = JSON.parse(userStr)
        return createWorkspaceAccess(id, user.id, user.accessLevel)
      }),
    )

    // Revalidate both the workspaces list and the specific workspace page
    revalidatePath("/admin/workspaces")
    revalidatePath(`/admin/workspaces/${id}`)

    return { success: true, error: null, workspace: workspace as Workspace }
  } catch (error: any) {
    console.error("Failed to update workspace:", error)
    // Check for unique constraint violation
    if (error?.code === "23505") {
      return { success: false, error: "Some users already have access to this workspace" }
    }
    return { success: false, error: "Failed to update workspace" }
  }
}

interface WorkspaceAccess {
  userId: number
  accessLevel: string
  user: {
    id: number
    email: string | null
    name: string | null
    role: string | null
  }
}

export async function getWorkspaceAccess(workspaceId: string): Promise<{
  access: WorkspaceAccess[] | null
  error: string | null
}> {
  try {
    const session = await auth()
    const organizationId = session?.user?.organizationId || ""
    const access = await dbGetWorkspaceAccess(workspaceId, organizationId)
    return { access, error: null }
  } catch (error) {
    return { access: null, error: "Failed to fetch workspace access" }
  }
}

export async function createDocument({
  workspaceId,
  filepath,
  fileType = "original",
  originalFileId,
  impactDate,
}: {
  workspaceId: string
  filepath: string
  fileType?: "original" | "revision" | "amendment"
  originalFileId?: string
  impactDate?: Date
}) {
  const session = await auth()
  const organizationId = session?.user?.organizationId || ""

  const newDocument = await db
    .insert(documentTable)
    .values({
      workspaceId,
      filepath,
      fileType,
      originalFileId,
      impactDate,
      createdAt: new Date(),
      organizationId,
    })
    .returning()
  return newDocument[0]
}
