import { sql } from "drizzle-orm"

export const addOrganizations = sql.raw(`
  -- Create Organizations table
  CREATE TABLE IF NOT EXISTS "Organization" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',
    "settings" JSONB,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- Create Organization Memberships table
  CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id"),
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "role" VARCHAR(20) DEFAULT 'member',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- Add organization_id to Users table
  ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"("id");

  -- Add organization_id to Workspaces table
  ALTER TABLE "Workspace"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"("id");

  -- Add organization_id to Chats table
  ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"("id");

  -- Add organization_id to Documents table
  ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID REFERENCES "Organization"("id");

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS "idx_organization_membership_user" ON "OrganizationMembership"("userId");
  CREATE INDEX IF NOT EXISTS "idx_organization_membership_org" ON "OrganizationMembership"("organizationId");
  CREATE INDEX IF NOT EXISTS "idx_workspace_organization" ON "Workspace"("organizationId");
  CREATE INDEX IF NOT EXISTS "idx_chat_organization" ON "Chat"("organizationId");
  CREATE INDEX IF NOT EXISTS "idx_document_organization" ON "Document"("organizationId");
`)
