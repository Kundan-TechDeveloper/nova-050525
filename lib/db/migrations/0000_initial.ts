import { sql } from "drizzle-orm"

export const createTables = sql`
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(64) UNIQUE,
  password VARCHAR(64),
  firstname VARCHAR(64),
  lastname VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Chat" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  title TEXT NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "Message" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat"(id),
  content JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Workspace" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  filepath TEXT NOT NULL,
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id),
  "fileType" TEXT NOT NULL,
  "originalFileId" UUID,
  "impactDate" TIMESTAMP
);
`
