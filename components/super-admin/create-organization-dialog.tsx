"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { Building2 } from "lucide-react"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Define the form data type
interface FormData {
  name: string
  expiryDate: string
}

export function CreateOrganizationDialog({ open, onOpenChange, onSuccess }: CreateOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Calculate default expiry date (7 days from today)
  const getDefaultExpiryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split("T")[0]
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    expiryDate: getDefaultExpiryDate(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format the data before sending
      const formattedData = {
        name: formData.name,
        // If expiryDate is empty or not provided, API will use default 30 days
        // If a specific date is selected, convert it to days from now
        expiryDays: formData.expiryDate
          ? Math.ceil((new Date(formData.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : undefined,
      }

      console.log("Creating organization with data:", formattedData)

      const response = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check for duplicate organization name error
        if (response.status === 409) {
          toast.error(`Organization name "${formData.name}" already exists. Please choose a different name.`, {
            position: "bottom-right",
            duration: 5000,
          })
          setIsLoading(false)
          return
        }
        throw new Error(result.message || "Failed to create organization")
      }

      toast.success("Organization created successfully", {
        position: "bottom-right",
      })

      // Restore pointer events
      document.body.style.pointerEvents = ""

      // Close the dialog
      onOpenChange(false)

      // Notify parent of success
      onSuccess()

      // Reset form data
      setFormData({
        name: "",
        expiryDate: getDefaultExpiryDate(),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization", {
        position: "bottom-right",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Restore pointer events
    document.body.style.pointerEvents = ""

    // Reset form data
    setFormData({
      name: "",
      expiryDate: getDefaultExpiryDate(),
    })

    // Close dialog
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen === false) {
          // Only handle closing the dialog here
          document.body.style.pointerEvents = ""
          setFormData({
            name: "",
            expiryDate: getDefaultExpiryDate(),
          })
        }
        // Always update the parent's state
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-zinc-900">Add Organization</DialogTitle>
              <DialogDescription className="text-[15px] text-zinc-500">
                Create a new organization in the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-900">
              Organization Name
            </Label>
            <Input
              id="name"
              placeholder="Enter organization name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              required
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="expiryDate" className="text-sm font-medium text-zinc-900">
              Expiry Date
              <span className="text-sm font-normal text-zinc-500 ml-2">(When the organization access will expire)</span>
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-200">
            <Button
              type="button"
              onClick={handleClose}
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
                "Create Organization"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
