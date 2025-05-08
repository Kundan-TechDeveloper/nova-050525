import { sql } from "drizzle-orm"

export const addWorkspaceToChat = sql`
ALTER TABLE "Chat"
ADD COLUMN "workspaceId" UUID REFERENCES "Workspace"(id),
ADD COLUMN "workspaceName" TEXT;
`
