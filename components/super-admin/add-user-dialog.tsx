"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import type { User } from "@/lib/types"
import { UserPlus } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onClose: () => void
  onUserAdded: (user: User) => void
}

export function AddUserDialog({ open, onClose, onUserAdded }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create super admin user")
      }

      const newUser = await response.json()
      onUserAdded(newUser)

      // Reset form
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
      })
      onClose()
    } catch (error) {
      console.error("Error creating super admin user:", error)
      toast.error("Failed to create super admin user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-zinc-900">Add Super Admin</DialogTitle>
              <DialogDescription className="text-[15px] text-zinc-500">
                Create a new super admin user account.
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
                placeholder="Enter First Name"
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
                placeholder="Enter Last Name"
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
              placeholder="Enter Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              required
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-900">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              required
            />
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
                  <span>Creating...</span>
                </>
              ) : (
                "Create Super Admin"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
