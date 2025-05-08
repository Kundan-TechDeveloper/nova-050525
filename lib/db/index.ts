import { db } from "./db"

// Export the db instance to ensure consistent usage
export { db }

// This file now re-exports the db instance from db.ts
// to ensure we're using a single connection pool throughout the application
