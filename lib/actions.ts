"use server"

import { createUser, getUser } from "@/lib/db/queries"
import { compare } from "bcrypt-ts"

export async function validateCredentials(email: string, password: string) {
  try {
    const users = await getUser(email)
    if (users.length === 0) {
      return { error: "Invalid email or password" }
    }

    const user = users[0]
    if (!user.password) {
      return { error: "Invalid email or password" }
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return { error: "Invalid email or password" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error validating credentials:", error)
    return { error: "Failed to validate credentials" }
  }
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  organizationId?: string,
) {
  try {
    // Check if user already exists
    const existingUsers = await getUser(email)
    if (existingUsers.length > 0) {
      return { error: "User already exists" }
    }

    // Create new user
    await createUser(email, password, firstName, lastName, organizationId)
    return { success: true }
  } catch (error) {
    console.error("Error registering user:", error)
    return { error: "Failed to create account" }
  }
}
