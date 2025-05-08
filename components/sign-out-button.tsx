"use client"

import { signOut } from "next-auth/react"
import toast from "react-hot-toast"

export function SignOutButton() {
  const handleSignOut = async () => {
    const loadingToast = toast.loading("Signing out...")
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      })
      toast.success("Signed out successfully", { id: loadingToast })
    } catch (error) {
      toast.error("Failed to sign out", { id: loadingToast })
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Sign Out
    </button>
  )
}
