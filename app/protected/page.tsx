import { auth } from "@/lib/auth"

export default async function ProtectedPage() {
  const session = await auth()

  return (
    <div className="flex h-screen bg-black">
      <div className="w-screen h-screen flex flex-col space-y-5 justify-center items-center text-white">
        You are logged in as {session?.user?.email}
        <form action="/api/auth/signout" method="POST">
          <button type="submit">Sign out</button>
        </form>
      </div>
    </div>
  )
}
