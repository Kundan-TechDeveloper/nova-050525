import { desc, eq, count, sql, and, not } from "drizzle-orm"
import { db } from "./db"
import {
  users,
  chats,
  messages,
  workspaces,
  documentTable,
  workspaceAccess,
  organizations,
  organizationMemberships,
  type Chat,
} from "./schema"
import { hashSync, genSaltSync } from "bcrypt-ts"
import { nanoid } from "nanoid"

export async function getUser(email: string) {
  return await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      firstname: users.firstname,
      lastname: users.lastname,
      role: users.role,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(eq(users.email, email))
}

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  organizationId?: string,
) {
  const salt = genSaltSync(10)
  const hash = hashSync(password, salt)

  return await db.insert(users).values({
    email,
    password: hash,
    firstname: firstName,
    lastname: lastName,
    role: "user",
    organizationId,
    createdAt: new Date(),
  })
}

export async function getChatsByUserId(userId: string, organizationId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const userChats = await db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, Number.parseInt(userId)), eq(chats.organizationId, organizationId)))
    .orderBy(desc(chats.createdAt))

  return {
    today: userChats.filter((c: Chat) => c.createdAt >= today),
    yesterday: userChats.filter((c: Chat) => c.createdAt >= yesterday && c.createdAt < today),
    lastWeek: userChats.filter((c: Chat) => c.createdAt >= lastWeek && c.createdAt < yesterday),
    older: userChats.filter((c: Chat) => c.createdAt < lastWeek),
  }
}

export async function createChat({
  userId,
  title,
  workspaceId,
  organizationId,
}: {
  userId: string
  title: string
  workspaceId: string
  organizationId: string
}) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  })

  const newChat = await db
    .insert(chats)
    .values({
      userId: Number.parseInt(userId),
      title,
      createdAt: new Date(),
      workspaceId,
      workspaceName: workspace?.name,
      organizationId,
    })
    .returning()
  return newChat[0]
}

export async function getChatById(id: string, organizationId: string) {
  const [foundChat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.organizationId, organizationId)))
  return foundChat
}

export async function saveMessage({
  chatId,
  content,
  role,
  sources,
}: {
  chatId: string
  content: string
  role: "user" | "assistant"
  sources?: { [key: string]: { filename: string; fileID: string; page_number?: number; page_content: string } }
}) {
  const newMessage = await db
    .insert(messages)
    .values({
      chatId,
      content: { role, content, sources },
      createdAt: new Date(),
    })
    .returning()
  return newMessage[0]
}

export async function getMessagesByChatId(chatId: string) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .then((messages) => messages.reverse())
}

export async function deleteChat(id: string) {
  await db.delete(messages).where(eq(messages.chatId, id))
  await db.delete(chats).where(eq(chats.id, id))
}

export async function getWorkspacesByUserId(userId: string, organizationId: string) {
  return await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      createdAt: workspaces.createdAt,
      accessLevel: workspaceAccess.accessLevel,
    })
    .from(workspaces)
    .innerJoin(workspaceAccess, eq(workspaces.id, workspaceAccess.workspaceId))
    .where(and(sql`${workspaceAccess.userId}::text = ${userId}::text`, eq(workspaces.organizationId, organizationId)))
    .orderBy(desc(workspaces.createdAt))
}

export async function getDocumentsByWorkspaceId(workspaceId: string, organizationId: string) {
  return await db
    .select()
    .from(documentTable)
    .where(and(eq(documentTable.workspaceId, workspaceId), eq(documentTable.organizationId, organizationId)))
    .orderBy(desc(documentTable.createdAt))
}

// Update the createWorkspace function
export async function createWorkspace({
  name,
  description,
  organizationId,
  config = null,
}: {
  name: string
  description?: string
  organizationId: string
  config?: any
}) {
  const newWorkspace = await db
    .insert(workspaces)
    .values({
      name,
      description,
      organizationId,
      createdAt: new Date(),
      config, // Add this line
    })
    .returning()
  return newWorkspace[0]
}

export async function createDocument({
  id,
  workspaceId,
  organizationId,
  filepath,
  fileType = "original",
  originalFileId,
  impactDate,
}: {
  id: string
  workspaceId: string
  organizationId: string
  filepath: string
  fileType?: "original" | "revision" | "amendment"
  originalFileId?: string
  impactDate?: Date
}) {
  return await db.insert(documentTable).values({
    id,
    workspaceId,
    organizationId,
    filepath,
    fileType,
    originalFileId,
    impactDate,
    createdAt: new Date(),
  })
}

export async function getWorkspaceById(workspaceId: string, organizationId?: string) {
  if (organizationId) {
    const [foundWorkspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.organizationId, organizationId)))
    return foundWorkspace
  }

  const [foundWorkspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
  return foundWorkspace
}

export async function getDocumentById(id: string, organizationId?: string) {
  if (organizationId) {
    const [foundDocument] = await db
      .select()
      .from(documentTable)
      .where(and(eq(documentTable.id, id), eq(documentTable.organizationId, organizationId)))
    return foundDocument
  }

  const [foundDocument] = await db.select().from(documentTable).where(eq(documentTable.id, id))
  return foundDocument
}

// Admin Queries
export async function getAdminStats(organizationId: string) {
  const [{ value: totalUsers }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.organizationId, organizationId))

  const [{ value: totalWorkspaces }] = await db
    .select({ value: count() })
    .from(workspaces)
    .where(eq(workspaces.organizationId, organizationId))

  const [{ value: totalDocuments }] = await db
    .select({ value: count() })
    .from(documentTable)
    .where(eq(documentTable.organizationId, organizationId))

  const recentActivities = await db
    .select({
      id: workspaceAccess.id,
      action: workspaceAccess.accessLevel,
      createdAt: workspaceAccess.createdAt,
      user: {
        id: users.id,
        name: users.firstname,
      },
    })
    .from(workspaceAccess)
    .innerJoin(users, eq(workspaceAccess.userId, users.id))
    .innerJoin(workspaces, eq(workspaceAccess.workspaceId, workspaces.id))
    .where(eq(workspaces.organizationId, organizationId))
    .orderBy(desc(workspaceAccess.createdAt))
    .limit(5)

  return {
    totalUsers,
    totalWorkspaces,
    totalDocuments,
    recentActivities,
  }
}

export async function getAllUsers(organizationId?: string) {
  const baseQuery = db
    .select({
      id: users.id,
      email: users.email,
      name: users.firstname,
      role: users.role,
      organizationId: users.organizationId,
    })
    .from(users)

  // If organizationId is provided, filter by it
  if (organizationId) {
    return await baseQuery.where(eq(users.organizationId, organizationId))
  }

  return await baseQuery
}

export async function updateUserRole(userId: number, role: string) {
  return await db.update(users).set({ role }).where(eq(users.id, userId)).returning()
}

export async function deleteUser(userId: number) {
  // First delete all related records
  await db.delete(workspaceAccess).where(eq(workspaceAccess.userId, userId))
  await db.delete(chats).where(eq(chats.userId, userId))
  return await db.delete(users).where(eq(users.id, userId))
}

export async function getWorkspaces(organizationId?: string) {
  try {
    const query = db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        createdAt: workspaces.createdAt,
        organizationId: workspaces.organizationId,
        itemCount: sql<number>`count(${documentTable.id})`,
      })
      .from(workspaces)
      .leftJoin(documentTable, eq(documentTable.workspaceId, workspaces.id))

    // Build the complete query based on whether organizationId is provided
    if (organizationId) {
      return await query
        .where(eq(workspaces.organizationId, organizationId))
        .groupBy(workspaces.id)
        .orderBy(desc(workspaces.createdAt))
    } else {
      return await query.groupBy(workspaces.id).orderBy(desc(workspaces.createdAt))
    }
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    throw error
  }
}

export async function getWorkspaceFiles(workspaceId: string, organizationId?: string) {
  if (organizationId) {
    return await db
      .select()
      .from(documentTable)
      .where(and(eq(documentTable.workspaceId, workspaceId), eq(documentTable.organizationId, organizationId)))
      .orderBy(desc(documentTable.createdAt))
  }

  return await db
    .select()
    .from(documentTable)
    .where(eq(documentTable.workspaceId, workspaceId))
    .orderBy(desc(documentTable.createdAt))
}

export async function createWorkspaceAccess(workspaceId: string, userId: number, accessLevel = "view") {
  return await db
    .insert(workspaceAccess)
    .values({
      workspaceId,
      userId,
      accessLevel,
      createdAt: new Date(),
    })
    .returning()
}

export async function getWorkspaceAccess(workspaceId: string, organizationId?: string) {
  if (organizationId) {
    return await db
      .select({
        userId: workspaceAccess.userId,
        accessLevel: workspaceAccess.accessLevel,
        user: {
          id: users.id,
          email: users.email,
          name: users.firstname,
          role: users.role,
          organizationId: users.organizationId,
        },
      })
      .from(workspaceAccess)
      .innerJoin(users, eq(workspaceAccess.userId, users.id))
      .where(and(eq(workspaceAccess.workspaceId, workspaceId), eq(users.organizationId, organizationId)))
  }

  return await db
    .select({
      userId: workspaceAccess.userId,
      accessLevel: workspaceAccess.accessLevel,
      user: {
        id: users.id,
        email: users.email,
        name: users.firstname,
        role: users.role,
        organizationId: users.organizationId,
      },
    })
    .from(workspaceAccess)
    .innerJoin(users, eq(workspaceAccess.userId, users.id))
    .where(eq(workspaceAccess.workspaceId, workspaceId))
}

// Update the updateWorkspace function
export async function updateWorkspace(
  id: string,
  { name, description, config }: { name: string; description?: string; config?: any },
  organizationId?: string,
) {
  const query = db.update(workspaces).set({
    name,
    description,
    config, // Add this line
  })

  // If organizationId is provided, add it to the where clause for validation
  if (organizationId) {
    return await query.where(and(eq(workspaces.id, id), eq(workspaces.organizationId, organizationId))).returning()
  }

  const updatedWorkspace = await query.where(eq(workspaces.id, id)).returning()
  return updatedWorkspace[0]
}

export async function deleteWorkspace(id: string, organizationId?: string) {
  try {
    // Get workspace name first
    let workspaceQuery = db.query.workspaces.findFirst({
      where: eq(workspaces.id, id),
    })

    // If organizationId is provided, add it to the where clause
    if (organizationId) {
      workspaceQuery = db.query.workspaces.findFirst({
        where: and(eq(workspaces.id, id), eq(workspaces.organizationId, organizationId)),
      })
    }

    const workspace = await workspaceQuery
    if (!workspace) throw new Error("Workspace not found")

    // Update all chats to set workspaceId to null but preserve the name
    await db
      .update(chats)
      .set({
        workspaceId: null,
        // Only set workspaceName if it's not already set
        workspaceName: sql`COALESCE(${chats.workspaceName}, ${workspace.name})`,
      })
      .where(eq(chats.workspaceId, id))

    // Then delete the workspace access entries
    await db.delete(workspaceAccess).where(eq(workspaceAccess.workspaceId, id))

    // Then delete the documents
    await db.delete(documentTable).where(eq(documentTable.workspaceId, id))

    // Finally delete the workspace
    let deleteQuery = db.delete(workspaces).where(eq(workspaces.id, id))

    // If organizationId is provided, add it to the where clause
    if (organizationId) {
      deleteQuery = db
        .delete(workspaces)
        .where(and(eq(workspaces.id, id), eq(workspaces.organizationId, organizationId)))
    }

    const [deletedWorkspace] = await deleteQuery.returning()

    return deletedWorkspace
  } catch (error) {
    console.error("Error deleting workspace:", error)
    throw error
  }
}

export async function updateChatTitle(chatId: string, title: string, organizationId?: string) {
  if (organizationId) {
    return await db
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, chatId), eq(chats.organizationId, organizationId)))
  }

  return await db.update(chats).set({ title }).where(eq(chats.id, chatId))
}

// Super Admin Queries
export async function getSuperAdminStats() {
  try {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    // Current counts
    const [{ value: totalOrganizations }] = await db.select({ value: count() }).from(organizations)

    const [{ value: totalUsers }] = await db.select({ value: count() }).from(users)

    const [{ value: activeOrganizations }] = await db
      .select({ value: count() })
      .from(organizations)
      .where(sql`"expiresAt" > NOW() AND status = 'active'`)

    const [{ value: activeUsers }] = await db
      .select({ value: count() })
      .from(users)
      .where(sql`"organizationId" IS NOT NULL`)

    // Last month counts
    const [{ value: lastMonthOrganizations }] = await db
      .select({ value: count() })
      .from(organizations)
      .where(sql`"createdAt" < ${lastMonth}`)

    const [{ value: lastMonthUsers }] = await db
      .select({ value: count() })
      .from(users)
      .where(sql`"createdAt" < ${lastMonth}`)

    const [{ value: lastMonthActiveOrgs }] = await db
      .select({ value: count() })
      .from(organizations)
      .where(sql`"expiresAt" > ${lastMonth} AND status = 'active' AND "createdAt" < ${lastMonth}`)

    const [{ value: lastMonthActiveUsers }] = await db
      .select({ value: count() })
      .from(users)
      .where(sql`"organizationId" IS NOT NULL AND "createdAt" < ${lastMonth}`)

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // Get organizations with user counts
    const recentOrganizations = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        status: organizations.status,
        createdAt: organizations.createdAt,
        memberCount: sql<number>`
          (
            SELECT COUNT(DISTINCT u.id)
            FROM "User" u
            WHERE u."organizationId" = "Organization".id
          )::int
        `,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(5)

    const response = {
      totalOrganizations: Number(totalOrganizations),
      totalUsers: Number(totalUsers),
      activeOrganizations: Number(activeOrganizations),
      activeUsers: Number(activeUsers),
      organizationGrowth: calculateGrowth(Number(totalOrganizations), Number(lastMonthOrganizations)),
      userGrowth: calculateGrowth(Number(totalUsers), Number(lastMonthUsers)),
      activeOrganizationGrowth: calculateGrowth(Number(activeOrganizations), Number(lastMonthActiveOrgs)),
      activeUserGrowth: calculateGrowth(Number(activeUsers), Number(lastMonthActiveUsers)),
      recentOrganizations: recentOrganizations.map((org) => ({
        ...org,
        memberCount: Number(org.memberCount) || 0,
      })),
    }

    console.log("Generated stats:", response)
    return response
  } catch (error) {
    console.error("Error in getSuperAdminStats:", error)
    throw error
  }
}

// Organization Queries
export async function getAllOrganizations() {
  // First, get the organizations with user counts
  const orgsWithUserCounts = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      expiresAt: organizations.expiresAt,
      createdAt: organizations.createdAt,
      userCount: sql<number>`COUNT(DISTINCT ${users.id})::int`,
    })
    .from(organizations)
    .leftJoin(users, sql`${users.organizationId}::text = ${organizations.id}::text`)
    .groupBy(organizations.id)
    .orderBy(desc(organizations.createdAt))

  // Then, get the membership counts for each organization
  const orgMembershipCounts = await db
    .select({
      orgId: organizationMemberships.organizationId,
      membershipCount: sql<number>`COUNT(DISTINCT ${organizationMemberships.userId})::int`,
    })
    .from(organizationMemberships)
    .groupBy(organizationMemberships.organizationId)

  // Create a map of organization ID to membership count
  const membershipCountMap = new Map()
  for (const org of orgMembershipCounts) {
    membershipCountMap.set(org.orgId, org.membershipCount)
  }

  // Combine the counts
  return orgsWithUserCounts.map((org) => ({
    ...org,
    memberCount: (org.userCount || 0) + (membershipCountMap.get(org.id) || 0),
  }))
}

export async function createOrganization(name: string, expiryDays = 30) {
  // Calculate expiry date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  // Generate a base slug from the name
  const baseSlug = name.toLowerCase().replace(/\s+/g, "-")

  // Check if the slug already exists
  const existingOrgs = await db
    .select({ id: organizations.id, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, baseSlug))

  // If slug exists, append a random string
  let slug = baseSlug
  if (existingOrgs.length > 0) {
    slug = `${baseSlug}-${nanoid(6)}`
  }

  const [organization] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      status: "active",
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return organization
}

export async function getOrganizationById(id: string) {
  // Get organization with user count
  const [orgWithUserCount] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      expiresAt: organizations.expiresAt,
      createdAt: organizations.createdAt,
      userCount: sql<number>`COUNT(DISTINCT ${users.id})::int`,
    })
    .from(organizations)
    .leftJoin(users, sql`${users.organizationId}::text = ${organizations.id}::text`)
    .where(eq(organizations.id, id))
    .groupBy(organizations.id)

  if (!orgWithUserCount) {
    return null
  }

  // Get membership count using a simpler approach
  const [{ value: membershipCount }] = await db
    .select({ value: count() })
    .from(organizationMemberships)
    .where(sql`CAST(${organizationMemberships.organizationId} AS TEXT) = CAST(${id} AS TEXT)`)

  // Combine the counts
  return {
    ...orgWithUserCount,
    memberCount: (orgWithUserCount.userCount || 0) + (Number(membershipCount) || 0),
  }
}

export async function updateOrganization(
  id: string,
  updates: {
    name?: string
    slug?: string
    status?: string
    expiresAt?: Date | undefined
  },
) {
  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
    // Convert null to undefined for the database
    expiresAt: updates.expiresAt === null ? undefined : updates.expiresAt,
  }

  // If name is updated but slug is not provided, generate a new slug
  if (updates.name && !updates.slug) {
    const baseSlug = updates.name.toLowerCase().replace(/\s+/g, "-")

    // Check if the slug already exists (excluding current organization)
    const existingOrgs = await db
      .select({ id: organizations.id, slug: organizations.slug })
      .from(organizations)
      .where(and(eq(organizations.slug, baseSlug), not(eq(organizations.id, id))))

    // If slug exists, append a random string
    if (existingOrgs.length > 0) {
      updateData.slug = `${baseSlug}-${nanoid(6)}`
    } else {
      updateData.slug = baseSlug
    }
  }

  const [organization] = await db.update(organizations).set(updateData).where(eq(organizations.id, id)).returning()
  return organization
}

export async function getOrganizationUsers(organizationId: string) {
  return await db
    .select({
      id: users.id,
      name: sql<string>`TRIM(CONCAT(COALESCE(${users.firstname}, ''), ' ', COALESCE(${users.lastname}, '')))`.as(
        "name",
      ),
      email: users.email,
      role: users.role,
      created_at: users.createdAt,
    })
    .from(users)
    .where(sql`CAST(${users.organizationId} AS TEXT) = CAST(${organizationId} AS TEXT)`)
    .orderBy(desc(users.createdAt))
}

export async function createOrganizationUser(
  organizationId: string,
  email: string,
  role: string,
  hashedPassword: string,
  firstname?: string,
  lastname?: string,
) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      role,
      organizationId,
      firstname,
      lastname,
      createdAt: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      role: users.role,
      createdAt: users.createdAt,
    })
  return user
}

// Add a new function to check organization expiration
export async function checkOrganizationExpiry(organizationId: string) {
  const [organization] = await db
    .select({
      id: organizations.id,
      expiresAt: organizations.expiresAt,
      status: organizations.status,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))

  if (!organization) {
    return false
  }

  const isExpired = new Date() > new Date(organization.expiresAt)

  // If expired but status is still active, update it
  if (isExpired && organization.status === "active") {
    await db
      .update(organizations)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
  }

  return !isExpired && organization.status === "active"
}

export async function getSuperAdminUsers() {
  return await db
    .select({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "super_admin"))
    .orderBy(desc(users.createdAt))
}

export async function updateOrganizationUser(
  userId: number,
  updates: {
    email?: string
    role?: string
    firstname?: string
    lastname?: string
  },
) {
  try {
    // Filter out undefined values
    const validUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))

    if (Object.keys(validUpdates).length === 0) {
      return null
    }

    const [user] = await db.update(users).set(validUpdates).where(eq(users.id, userId)).returning({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      role: users.role,
      createdAt: users.createdAt,
    })

    return user
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

export async function deleteOrganizationUser(userId: number) {
  try {
    // 1. Delete user's messages through chats
    const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, userId))

    for (const chat of userChats) {
      await db.delete(messages).where(eq(messages.chatId, chat.id))
    }

    // 2. Delete user's chats
    await db.delete(chats).where(eq(chats.userId, userId))

    // 3. Delete user's workspace access
    await db.delete(workspaceAccess).where(eq(workspaceAccess.userId, userId))

    // 4. Delete user's organization memberships
    await db.delete(organizationMemberships).where(eq(organizationMemberships.userId, userId))

    // 5. Finally delete the user
    await db.delete(users).where(eq(users.id, userId))

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

export async function deleteOrganization(id: string) {
  try {
    // 1. Delete all organization memberships
    await db.delete(organizationMemberships).where(eq(organizationMemberships.organizationId, id))

    // 2. Get all users in the organization
    const orgUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`CAST(${users.organizationId} AS TEXT) = CAST(${id} AS TEXT)`)

    // 3. For each user, delete their chats and messages
    for (const user of orgUsers) {
      // Delete user's messages through chats
      const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, user.id))

      for (const chat of userChats) {
        await db.delete(messages).where(eq(messages.chatId, chat.id))
      }

      // Delete user's chats
      await db.delete(chats).where(eq(chats.userId, user.id))

      // Delete user's workspace access
      await db.delete(workspaceAccess).where(eq(workspaceAccess.userId, user.id))
    }

    // 4. Delete all users in the organization
    await db.delete(users).where(sql`CAST(${users.organizationId} AS TEXT) = CAST(${id} AS TEXT)`)

    // 5. Delete all documents in the organization's workspaces
    await db.delete(documentTable).where(eq(documentTable.organizationId, id))

    // 6. Delete all workspaces in the organization
    await db.delete(workspaces).where(eq(workspaces.organizationId, id))

    // 7. Finally delete the organization itself
    const result = await db.delete(organizations).where(eq(organizations.id, id)).returning()

    return result[0]
  } catch (error) {
    console.error("Error deleting organization:", error)
    return null
  }
}
