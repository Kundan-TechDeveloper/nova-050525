import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "org_admin")) {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen p-6">
        <div className="flex-1 flex flex-col bg-white rounded-2xl">
          <AdminHeader user={session.user} />
          <main className="flex-1 overflow-y-auto pt-4 pl-8 pr-8 pb-8">
            <div className="max-w-[1400px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
