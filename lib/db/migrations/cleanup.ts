import { sql } from "drizzle-orm"
import { db } from "../db"

export async function cleanDatabase() {
  console.log("\x1b[31m%s\x1b[0m", "WARNING: You are about to CLEAN ALL DATABASE OBJECTS!")
  console.log("\x1b[31m%s\x1b[0m", "This will permanently delete all your data!")
  console.log("\x1b[33m%s\x1b[0m", "You have 15 seconds to cancel (Ctrl+C)...")

  // Show countdown
  for (let i = 15; i >= 0; i--) {
    process.stdout.write(`\r${i}...`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  console.log("\n")

  // Drop all session data if exists
  await db.execute(sql`
    DO $$ 
    BEGIN
      -- Drop all sessions if they exist
      DROP TABLE IF EXISTS "Session" CASCADE;
      
      -- Clear connection pools
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid();
    END $$;
  `)

  // Drop all indexes
  await db.execute(sql`
    DO $$ 
    DECLARE 
      _index record;
    BEGIN
      -- Drop custom indexes
      DROP INDEX IF EXISTS "idx_document_organization";
      DROP INDEX IF EXISTS "idx_chat_organization";
      DROP INDEX IF EXISTS "idx_workspace_organization";
      DROP INDEX IF EXISTS "idx_organization_membership_org";
      DROP INDEX IF EXISTS "idx_organization_membership_user";
      
      -- Drop all remaining indexes except primary key constraints
      FOR _index IN (
        SELECT schemaname, tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT IN (
          SELECT conname 
          FROM pg_constraint 
          WHERE contype = 'p'
        )
      ) LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', _index.schemaname, _index.indexname);
      END LOOP;
    END $$;
  `)

  // Drop all functions and triggers
  await db.execute(sql`
    DO $$ 
    DECLARE 
      _func record;
      _trigger record;
    BEGIN
      -- Drop all triggers
      FOR _trigger IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
      ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', 
          _trigger.trigger_name, 
          _trigger.event_object_table);
      END LOOP;

      -- Drop all functions
      FOR _func IN (
        SELECT ns.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p 
        JOIN pg_namespace ns ON ns.oid = p.pronamespace
        WHERE ns.nspname = 'public'
      ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
          _func.nspname,
          _func.proname,
          _func.args);
      END LOOP;
    END $$;
  `)

  // Drop all tables in correct order
  await db.execute(sql`
    DROP TABLE IF EXISTS "Message" CASCADE;
    DROP TABLE IF EXISTS "Chat" CASCADE;
    DROP TABLE IF EXISTS "Document" CASCADE;
    DROP TABLE IF EXISTS "WorkspaceAccess" CASCADE;
    DROP TABLE IF EXISTS "Workspace" CASCADE;
    DROP TABLE IF EXISTS "OrganizationMembership" CASCADE;
    DROP TABLE IF EXISTS "User" CASCADE;
    DROP TABLE IF EXISTS "Organization" CASCADE;
  `)

  // Clean up any remaining objects and reset sequences
  await db.execute(sql`
    DO $$ 
    DECLARE 
      _seq record;
    BEGIN
      -- Drop all sequences
      FOR _seq IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      ) LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I CASCADE', _seq.sequence_name);
      END LOOP;

      -- Vacuum analyze to clean up space and update statistics
      VACUUM ANALYZE;
    END $$;
  `)

  console.log("\x1b[32m%s\x1b[0m", "Database cleaned successfully!")
}
