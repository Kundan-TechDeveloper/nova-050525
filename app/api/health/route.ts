import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Simple query to check database connectivity
    const result = await db.execute(sql`SELECT 1 as health`)

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
