import authOptions from "@/lib/auth"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
// import { authConfig } from "./auth.config"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  redirect("/chat")
}
