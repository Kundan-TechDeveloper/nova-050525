import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { users } from "@/lib/db/schema"

export async function GET(req: NextRequest) {
  try {
    // Perform database operations
    const result = await db.select().from(users)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Note: We don't need to manually close connections in API routes
// The connection pool will manage this automatically with the configuration
// we've set up in db.ts
