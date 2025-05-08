import { pgTable, varchar, timestamp, json, uuid, text, serial, integer } from "drizzle-orm/pg-core"

// Organizations Table
export const organizations = pgTable("Organization", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  settings: json("settings"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

// Organization Memberships Table
export const organizationMemberships = pgTable("OrganizationMembership", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),
  userId: integer("userId")
    .references(() => users.id)
    .notNull(),
  role: varchar("role", { length: 20 }).default("member"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 64 }).unique(),
  password: varchar("password", { length: 64 }),
  firstname: varchar("firstname", { length: 64 }),
  lastname: varchar("lastname", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user"),
  organizationId: uuid("organizationId").references(() => organizations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const workspaces = pgTable("Workspace", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("createdAt").notNull(),
  config: json("config"), // Add this line to store workspace configuration
})

export const workspaceAccess = pgTable("WorkspaceAccess", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("userId")
    .references(() => users.id)
    .notNull(),
  workspaceId: uuid("workspaceId")
    .references(() => workspaces.id)
    .notNull(),
  accessLevel: varchar("accessLevel", { length: 20 }).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const chats = pgTable("Chat", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: integer("userId")
    .references(() => users.id)
    .notNull(),
  workspaceId: uuid("workspaceId").references(() => workspaces.id, { onDelete: "set null" }),
  workspaceName: text("workspaceName"),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),
})

export const messages = pgTable("Message", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chatId")
    .references(() => chats.id)
    .notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
})

export const documentTable = pgTable("Document", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspaceId")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),
  filepath: text("filepath").notNull(),
  fileType: text("fileType", { enum: ["original", "revision", "amendment"] })
    .default("original")
    .notNull(),
  originalFileId: uuid("originalFileId"),
  impactDate: timestamp("impactDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// Type Inference
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert

export type OrganizationMembership = typeof organizationMemberships.$inferSelect
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export type WorkspaceAccess = typeof workspaceAccess.$inferSelect
export type NewWorkspaceAccess = typeof workspaceAccess.$inferInsert

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Document = typeof documentTable.$inferSelect
export type NewDocument = typeof documentTable.$inferInsert
