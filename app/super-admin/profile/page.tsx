"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { User, Key, Camera } from "lucide-react"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (session?.user) {
      const [firstname = "", lastname = ""] = (session.user.name || "").split(" ")
      setProfileData((prev) => ({
        ...prev,
        firstname,
        lastname,
        email: session.user.email || "",
      }))
    }
  }, [session])

  const handleUpdateProfile = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const updateData = {
        firstname: profileData.firstname,
        lastname: profileData.lastname,
        email: profileData.email,
        ...(profileData.newPassword ? { password: profileData.newPassword } : {}),
      }

      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const updatedUser = await response.json()

      // Update session to reflect changes
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: `${updatedUser.firstname} ${updatedUser.lastname}`,
          email: updatedUser.email,
        },
      })

      toast.success("Profile updated successfully")

      // Reset password fields
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password change if attempted
    if (profileData.newPassword || profileData.confirmPassword) {
      if (!profileData.currentPassword) {
        toast.error("Current password is required to change password")
        return
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast.error("New passwords do not match")
        return
      }
    }

    await handleUpdateProfile()
  }

  return (
    <div className="flex-1 h-[calc(100vh-155px)] overflow-hidden message-scrollbar">
      <div className="h-full overflow-y-auto px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Profile</h1>
            <p className="text-sm text-zinc-600">Manage your personal information and account settings.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            {/* Profile Information */}
            <Card className="border-zinc-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">Personal Information</CardTitle>
                    <CardDescription className="text-[15px] text-zinc-500">
                      Update your personal details and contact information.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-zinc-200">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-zinc-100 flex items-center justify-center">
                      <span className="text-2xl font-medium text-zinc-900">
                        {profileData.firstname?.[0]?.toUpperCase() || ""}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full absolute bottom-0 right-0 bg-zinc-900 hover:bg-zinc-800"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-medium text-zinc-900 mb-1">Profile photo</h3>
                    <p className="text-[13px] text-zinc-500 mb-3">This will be displayed on your profile.</p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[13px] font-medium border-zinc-300 text-zinc-900 hover:bg-zinc-200 hover:text-zinc-900"
                      >
                        Change photo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[13px] font-medium border-zinc-300 text-zinc-900 hover:bg-zinc-200 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-zinc-900">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={profileData.firstname}
                      onChange={(e) => setProfileData({ ...profileData, firstname: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-zinc-900">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={profileData.lastname}
                      onChange={(e) => setProfileData({ ...profileData, lastname: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zinc-900">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-zinc-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">Change Password</CardTitle>
                    <CardDescription className="text-[15px] text-zinc-500">
                      Update your password to keep your account secure.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-zinc-900">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-zinc-900">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-900">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
