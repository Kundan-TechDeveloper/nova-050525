import { sql } from "drizzle-orm"

export const alterTables = sql`
-- Add role column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create WorkspaceAccess table for managing workspace permissions
CREATE TABLE IF NOT EXISTS "WorkspaceAccess" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER NOT NULL REFERENCES "User"(id),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id),
  "accessLevel" VARCHAR(20) NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "workspaceId")
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_access_user ON "WorkspaceAccess"("userId");
CREATE INDEX IF NOT EXISTS idx_workspace_access_workspace ON "WorkspaceAccess"("workspaceId");
`
