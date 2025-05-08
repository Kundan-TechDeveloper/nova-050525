"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FiMail, FiUser, FiLock, FiEdit2, FiCalendar, FiLoader } from "react-icons/fi"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstname: session?.user?.firstname || "",
    lastname: session?.user?.lastname || "",
    email: session?.user?.email || "",
    password: "",
  })

  // Reset all state when dialog opens
  useEffect(() => {
    if (open) {
      setIsEditing(false)
      setFormData({
        firstname: session?.user?.firstname || "",
        lastname: session?.user?.lastname || "",
        email: session?.user?.email || "",
        password: "",
      })
    }
  }, [open, session?.user])

  const handleOpenChange = (newOpen: boolean) => {
    setIsEditing(false)
    if (!newOpen) {
      // Reset form data when closing
      setFormData({
        firstname: session?.user?.firstname || "",
        lastname: session?.user?.lastname || "",
        email: session?.user?.email || "",
        password: "",
      })
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Only include password in the update if it was changed
      const updateData = {
        ...formData,
        role: session?.user?.role, // Preserve existing role
        ...(formData.password ? { password: formData.password } : {}),
      }

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update profile")
      }

      const updatedUser = await response.json()

      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          ...updatedUser,
        },
      })

      setIsEditing(false) // Exit edit mode
      setFormData((prev) => ({ ...prev, password: "" })) // Clear password field
      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isEditing) {
      setFormData({
        firstname: session?.user?.firstname || "",
        lastname: session?.user?.lastname || "",
        email: session?.user?.email || "",
        password: "",
      })
      setIsEditing(false)
    } else {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isLoading && handleOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-[525px] bg-[#1a1a1a] border-[#333333]">
        <DialogHeader className="border-b border-[#333333] pb-4">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-semibold text-white">Profile Settings</DialogTitle>
            {!isEditing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="text-[#666666] hover:text-white hover:bg-[#333333] gap-2 h-8"
              >
                <FiEdit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6">
          {!isEditing ? (
            // Preview Mode
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl flex-shrink-0">
                  {formData.firstname?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="flex-1 space-y-1.5 pt-2">
                  <h3 className="text-xl font-medium text-white">
                    {formData.firstname} {formData.lastname}
                  </h3>
                  <div className="flex items-center text-[#999999] text-sm">
                    <FiMail className="w-4 h-4 mr-2" />
                    {formData.email}
                  </div>
                  <div className="flex items-center text-[#999999] text-sm">
                    <FiUser className="w-4 h-4 mr-2" />
                    {session?.user?.role === "org_admin" ? "Administrator" : "User"}
                  </div>
                  <div className="flex items-center text-[#999999] text-sm">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    Member since {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="bg-[#262626] rounded-lg p-4 space-y-4">
                <div>
                  <div className="text-sm font-medium text-[#999999] mb-2">Personal Information</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#666666] mb-1">First Name</div>
                      <div className="text-white">{formData.firstname}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666] mb-1">Last Name</div>
                      <div className="text-white">{formData.lastname}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#666666] mb-1">Email Address</div>
                  <div className="text-white">{formData.email}</div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl">
                  {formData.firstname?.[0]?.toUpperCase() || "A"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <FiUser className="h-5 w-5" />
                      </div>
                      <Input
                        type="text"
                        value={formData.firstname}
                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        placeholder="First name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Last Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <FiUser className="h-5 w-5" />
                      </div>
                      <Input
                        type="text"
                        value={formData.lastname}
                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <FiMail className="h-5 w-5" />
                    </div>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <FiLock className="h-5 w-5" />
                    </div>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#333333]">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-[#999999] hover:text-white hover:bg-[#333333] disabled:opacity-50"
            >
              {isEditing ? "Cancel" : "Close"}
            </Button>
            {isEditing && (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 min-w-[100px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <FiLoader className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
