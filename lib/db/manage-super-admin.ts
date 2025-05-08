import { db } from "./db"
import { sql } from "drizzle-orm"
import { hashSync, genSaltSync } from "bcrypt-ts"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function validatePassword(password: string): Promise<boolean> {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

async function createSuperAdmin() {
  console.log("\n📝 Super Admin Creation")
  console.log("------------------------")

  let email: string
  do {
    email = (await question("Enter super admin email: ")).trim()
    if (!(await validateEmail(email))) {
      console.log("❌ Invalid email format. Please try again.")
    }
  } while (!(await validateEmail(email)))

  let password: string
  do {
    password = (
      await question("Enter password (min 8 chars, must include uppercase, lowercase, number, special char): ")
    ).trim()
    if (!(await validatePassword(password))) {
      console.log("❌ Password does not meet requirements. Please try again.")
    }
  } while (!(await validatePassword(password)))

  const firstName = (await question("Enter first name: ")).trim()
  const lastName = (await question("Enter last name: ")).trim()

  const salt = genSaltSync(10)
  const hashedPassword = hashSync(password, salt)

  try {
    const result = await db.execute(sql`
      INSERT INTO "User" (email, password, firstname, lastname, role, "createdAt")
      VALUES (
        ${email}, 
        ${hashedPassword}, 
        ${firstName}, 
        ${lastName}, 
        'super_admin',
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        role = 'super_admin',
        password = ${hashedPassword},
        firstname = ${firstName},
        lastname = ${lastName}
      RETURNING id, email;
    `)

    console.log("\n✅ Super admin created/updated successfully!")
    return result
  } catch (error) {
    console.error("\n❌ Error creating super admin:", error)
    throw error
  }
}

async function listSuperAdmins() {
  try {
    const result = await db.execute<{
      email: string
      firstname: string
      lastname: string
      createdAt: Date
    }>(sql`
      SELECT email, firstname, lastname, "createdAt"
      FROM "User"
      WHERE role = 'super_admin'
      ORDER BY "createdAt";
    `)

    console.log("\n📋 Super Admin List")
    console.log("------------------")

    if (!result || result.length === 0) {
      console.log("No super admins found.")
      return
    }

    result.forEach((admin) => {
      console.log(`
Email: ${admin.email}
Name: ${admin.firstname} ${admin.lastname}
Created: ${new Date(admin.createdAt).toLocaleString()}
------------------`)
    })
  } catch (error) {
    console.error("\n❌ Error listing super admins:", error)
    throw error
  }
}

async function removeSuperAdmin() {
  try {
    const result = await db.execute<{
      id: number
      email: string
      firstname: string
      lastname: string
    }>(sql`
      SELECT id, email, firstname, lastname
      FROM "User"
      WHERE role = 'super_admin'
      ORDER BY email;
    `)

    if (!result || result.length === 0) {
      console.log("\n❌ No super admins found to remove.")
      return
    }

    console.log("\n🗑️  Remove Super Admin")
    console.log("--------------------")
    console.log("Available super admins:")

    result.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.firstname} ${admin.lastname})`)
    })

    const selection = Number.parseInt(await question("\nEnter the number of the admin to remove (or 0 to cancel): "))
    if (selection === 0) {
      console.log("\n❌ Operation cancelled.")
      return
    }

    if (selection < 1 || selection > result.length) {
      console.log("\n❌ Invalid selection.")
      return
    }

    const adminToRemove = result[selection - 1]
    const confirm = await question(`\n⚠️  Are you sure you want to remove ${adminToRemove.email}? (yes/no): `)

    if (confirm.toLowerCase() === "yes") {
      await db.execute(sql`
        DELETE FROM "User"
        WHERE id = ${adminToRemove.id};
      `)
      console.log("\n✅ Super admin role removed successfully.")
    } else {
      console.log("\n❌ Operation cancelled.")
    }
  } catch (error) {
    console.error("\n❌ Error removing super admin:", error)
    throw error
  }
}

async function showMenu() {
  console.clear() // Clear the screen for better readability
  console.log("🔧 Super Admin Management")
  console.log("------------------------")
  console.log("1. Create super admin")
  console.log("2. List super admins")
  console.log("3. Remove super admin")
  console.log("0. Exit")
}

async function main() {
  try {
    while (true) {
      await showMenu()
      const choice = await question("\nEnter your choice (0-3): ")

      switch (choice) {
        case "1":
          await createSuperAdmin()
          break
        case "2":
          await listSuperAdmins()
          break
        case "3":
          await removeSuperAdmin()
          break
        case "0":
          console.log("\n👋 Goodbye!")
          rl.close()
          process.exit(0)
        default:
          console.log("\n❌ Invalid choice.")
      }

      // Ask to continue
      const continue_ = await question('\nPress Enter to continue or type "exit" to quit: ')
      if (continue_.toLowerCase() === "exit") {
        console.log("\n👋 Goodbye!")
        rl.close()
        process.exit(0)
      }
    }
  } catch (error) {
    console.error("\n❌ Operation failed:", error)
    rl.close()
    process.exit(1)
  }
}

main()
