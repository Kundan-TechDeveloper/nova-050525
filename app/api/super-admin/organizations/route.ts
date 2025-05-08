import { getAllOrganizations, createOrganization } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const organizations = await getAllOrganizations()
    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { name, expiryDays } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new NextResponse("Invalid organization name", { status: 400 })
    }

    // Check if organization with the same name already exists
    const existingOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.name, name.trim()))

    if (existingOrgs.length > 0) {
      return NextResponse.json({ message: `Organization name "${name}" already exists` }, { status: 409 })
    }

    const organization = await createOrganization(name, expiryDays)
    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error creating organization:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
