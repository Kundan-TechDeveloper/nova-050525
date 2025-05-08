import { NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { hashSync, genSaltSync } from "bcrypt-ts"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const organizationId = session.user.organizationId || ""

    const allUsers = await db.query.users.findMany({
      where: eq(users.organizationId, organizationId),
      orderBy: desc(users.id),
    })

    // Transform the data to match the expected format
    const formattedUsers = allUsers.map((user) => ({
      id: user.id.toString(),
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email || "",
      createdAt: user.createdAt.toISOString(),
      role: user.role || "user",
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { firstname, lastname, email, password } = body

    // Check if email is already taken
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return new NextResponse("Email already taken", { status: 400 })
    }

    // Hash password
    const salt = genSaltSync(10)
    const hashedPassword = hashSync(password, salt)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role: body.role || "user",
        organizationId: session.user.organizationId || "",
        createdAt: new Date(),
      })
      .returning()

    // Format the response
    const formattedUser = {
      ...newUser[0],
      id: newUser[0].id.toString(),
      createdAt: newUser[0].createdAt.toISOString(),
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("Error creating user:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
