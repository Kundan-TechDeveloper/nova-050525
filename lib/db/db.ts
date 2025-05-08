import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import "dotenv/config"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Configure connection pool with improved settings
const client = postgres(process.env.DATABASE_URL, {
  max: 20, // Maximum number of connections in the pool
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 15, // Increased connection timeout
})

export const db = drizzle(client, { schema })

// Helper function to close the database connection
export const closeConnection = async () => {
  await client.end()
}
