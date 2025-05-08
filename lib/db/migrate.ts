import { db } from "./db"
import { createTables } from "./migrations/0000_initial"
import { alterTables } from "./migrations/0001_workspace_access"
import { addWorkspaceToChat } from "./migrations/0002_chat_workspace"
import { addOrganizations } from "./migrations/0003_add_organizations"

async function migrate() {
  try {
    console.log("Running migrations...")

    // Run migrations in try-catch blocks to handle already existing tables/columns
    console.log("Creating/updating tables...")

    try {
      await db.execute(createTables)
      console.log("✓ Initial tables created")
    } catch (error: any) {
      if (error.code === "42P07") {
        // Table already exists
        console.log("ℹ Initial tables already exist, skipping...")
      } else {
        throw error
      }
    }

    try {
      await db.execute(alterTables)
      console.log("✓ Workspace access tables updated")
    } catch (error: any) {
      if (error.code === "42701" || error.code === "42P07") {
        // Column/table already exists
        console.log("ℹ Workspace access tables already updated, skipping...")
      } else {
        throw error
      }
    }

    try {
      await db.execute(addWorkspaceToChat)
      console.log("✓ Chat workspace relation added")
    } catch (error: any) {
      if (error.code === "42701") {
        // Column already exists
        console.log("ℹ Chat workspace relation already exists, skipping...")
      } else {
        throw error
      }
    }

    try {
      await db.execute(addOrganizations)
      console.log("✓ Organization tables and relations created")
    } catch (error: any) {
      if (error.code === "42P07" || error.code === "42701") {
        // Table/Column already exists
        console.log("ℹ Organization tables already exist, skipping...")
      } else {
        throw error
      }
    }

    console.log("\x1b[32m%s\x1b[0m", "All migrations completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "Error running migrations:", error)
    process.exit(1)
  }
}

migrate()
