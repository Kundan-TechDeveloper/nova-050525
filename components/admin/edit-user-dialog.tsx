"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import type { User } from "@/lib/types"
import { UserCog } from "lucide-react"

interface EditUserDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onUserUpdated: (user: User) => void
}

export function EditUserDialog({ open, onClose, user, onUserUpdated }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "user",
  })

  useEffect(() => {
    if (user && open) {
      setFormData({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        password: "",
        role: user.role || "user",
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return

    setIsLoading(true)

    try {
      const updateData = {
        ...formData,
        ...(formData.password ? { password: formData.password } : {}),
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      const updatedUser = await response.json()
      onUserUpdated(updatedUser)
      onClose()

      // Reset form
      setFormData((prev) => ({ ...prev, password: "" }))
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog is closed
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        role: "user",
      })
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-zinc-900">Edit User</DialogTitle>
              <DialogDescription className="text-[15px] text-zinc-500">
                Update user account information.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label htmlFor="firstName" className="text-sm font-medium text-zinc-900">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="lastName" className="text-sm font-medium text-zinc-900">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
                required
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-900">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              required
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-900">
              New Password
              <span className="text-sm font-normal text-zinc-500 ml-2">(leave blank to keep current)</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="role" className="text-sm font-medium text-zinc-900">
              Role
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger
                id="role"
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-zinc-200 shadow-md">
                <SelectItem value="user" className="text-zinc-900 hover:bg-zinc-50">
                  User
                </SelectItem>
                <SelectItem value="org_admin" className="text-zinc-900 hover:bg-zinc-50">
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-10 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-colors"
              disabled={isLoading}
            >
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
      </DialogContent>
    </Dialog>
  )
}
