import { cleanDatabase } from "./migrations/cleanup"
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

async function main() {
  console.log("\x1b[31m%s\x1b[0m", "⚠️  WARNING: You are about to CLEAN ALL DATABASE OBJECTS!")
  console.log("\x1b[31m%s\x1b[0m", "⚠️  This will permanently delete all your data!")
  console.log("\x1b[33m%s\x1b[0m", "⚠️  This action cannot be undone!\n")

  const answer = await question('Please type "CLEAN DATABASE" to confirm: ')

  if (answer.trim() === "CLEAN DATABASE") {
    console.log("\nStarting database cleanup...\n")
    try {
      await cleanDatabase()
      console.log("\n✅ Database cleanup completed successfully!")
      console.log("\nℹ️  To create a super admin, use: npm run manage-admin")
      rl.close()
      process.exit(0)
    } catch (error) {
      console.error("\n❌ Error during cleanup:", error)
      rl.close()
      process.exit(1)
    }
  } else {
    console.log("\n❌ Cleanup cancelled. Your database is safe.")
    rl.close()
    process.exit(0)
  }
}

main()
