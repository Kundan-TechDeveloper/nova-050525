import { getOrganizationById, updateOrganization, deleteOrganization } from "@/lib/db/queries"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { organizations } from "@/lib/db/schema"
import { eq, and, not } from "drizzle-orm"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const organization = await getOrganizationById(params.id)

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error fetching organization:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { name, slug, expiresAt } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new NextResponse("Invalid organization name", { status: 400 })
    }

    // Check if organization with the same name already exists (excluding current org)
    const existingOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.name, name.trim()), not(eq(organizations.id, params.id))))

    if (existingOrgs.length > 0) {
      return NextResponse.json({ message: `Organization name "${name}" already exists` }, { status: 409 })
    }

    // Create update object with all fields
    const updateData: {
      name: string
      slug?: string
      expiresAt?: Date
    } = {
      name: name.trim(),
    }

    // Add optional fields if provided
    if (slug) {
      updateData.slug = slug.trim()
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : undefined
    }

    const organization = await updateOrganization(params.id, updateData)

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error updating organization:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore - role is added to the session
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const organization = await getOrganizationById(params.id)
    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 })
    }

    const result = await deleteOrganization(params.id)
    if (!result) {
      return NextResponse.json({ message: "Failed to delete organization" }, { status: 500 })
    }

    return NextResponse.json({ message: "Organization deleted successfully" })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
