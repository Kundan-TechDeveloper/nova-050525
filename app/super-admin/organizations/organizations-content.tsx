"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FiPlus, FiSearch, FiCalendar, FiUsers, FiMoreVertical, FiEye, FiEdit } from "react-icons/fi"
import { UserPlus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateOrganizationDialog } from "@/components/super-admin/create-organization-dialog"
import type { ColumnDef } from "@tanstack/react-table"
import { getOrganizations } from "@/app/super-admin/organizations/actions/organizations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { format } from "date-fns"

interface Organization {
  id: string
  name: string
  slug: string
  status: string | null
  expiresAt: Date
  createdAt: Date
  memberCount: number
}

interface OrganizationsContentProps {
  initialOrganizations: Organization[]
}

type StatusType = "active" | "inactive" | "expired" | "pending"

interface AddUserFormData {
  firstname: string
  lastname: string
  email: string
  password: string
  role: string
}

interface EditOrganizationFormData {
  name: string
  slug: string
  expiresAt: string
}

export function OrganizationsContent({ initialOrganizations }: OrganizationsContentProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)

  // Debug log to see what data we're receiving
  console.log("Organizations data:", organizations)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [selectedOrgName, setSelectedOrgName] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [addUserFormData, setAddUserFormData] = useState<AddUserFormData>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "user",
  })
  const [editOrgFormData, setEditOrgFormData] = useState<EditOrganizationFormData>({
    name: "",
    slug: "",
    expiresAt: "",
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Effect to ensure pointer events are always restored
  useEffect(() => {
    // Function to ensure pointer events are restored
    const restorePointerEvents = () => {
      document.body.style.pointerEvents = ""
    }

    // Add event listener for when the component unmounts or when dialogs are closed
    window.addEventListener("mousedown", restorePointerEvents)

    // Cleanup function
    return () => {
      window.removeEventListener("mousedown", restorePointerEvents)
      // Ensure pointer events are restored when component unmounts
      restorePointerEvents()
    }
  }, [])

  const handleViewDetails = (id: string) => {
    router.push(`/super-admin/organizations/${id}`)
  }

  const handleEditOrganization = (org: Organization) => {
    // First set the form data
    setEditOrgFormData({
      name: org.name,
      slug: org.slug,
      expiresAt: org.expiresAt ? new Date(org.expiresAt).toISOString().split("T")[0] : "",
    })
    // Then set the selected org ID
    setSelectedOrgId(org.id)
    // Finally open the dialog
    setIsEditDialogOpen(true)
  }

  const handleDeleteOrganization = (orgId: string, orgName: string) => {
    // First set the selected org ID and name
    setSelectedOrgId(orgId)
    setSelectedOrgName(orgName)
    // Then open the dialog
    setIsDeleteDialogOpen(true)
  }

  const refreshOrganizations = async () => {
    setIsLoading(true)
    try {
      const result = await getOrganizations()
      if (result.success && result.data) {
        setOrganizations(result.data)
        console.log("Refreshed organizations data:", result.data)
      }
    } catch (error) {
      console.error("Error refreshing organizations:", error)
      toast.error("Failed to refresh organizations", {
        position: "bottom-right",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const columns: ColumnDef<Organization>[] = [
    {
      header: "Organization",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[15px] font-medium">
            {row.original.name[0].toUpperCase()}
          </div>
          <div>
            <div className="text-[15px] font-medium text-zinc-900">{row.original.name}</div>
            <div className="text-sm text-zinc-500">{row.original.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Members",
      accessorKey: "memberCount",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
          <FiUsers className="h-4 w-4 text-zinc-500" />
          <span>{row.original.memberCount}</span>
        </div>
      ),
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
          <FiCalendar className="h-4 w-4 text-zinc-500" />
          <span>{format(new Date(row.original.createdAt), "yyyy-MM-dd")}</span>
        </div>
      ),
    },
    {
      header: "Expires",
      accessorKey: "expiresAt",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
          <FiCalendar className="h-4 w-4 text-zinc-500" />
          <span>{row.original.expiresAt ? format(new Date(row.original.expiresAt), "yyyy-MM-dd") : "Never"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = (row.original.status || "inactive") as StatusType
        const statusColors: Record<StatusType, string> = {
          active: "bg-green-100 text-green-700",
          inactive: "bg-zinc-100 text-zinc-700",
          expired: "bg-red-100 text-red-700",
          pending: "bg-yellow-100 text-yellow-700",
        }

        return (
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium ${statusColors[status]}`}
          >
            {status}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50">
                <FiMoreVertical className="h-4 w-4 text-zinc-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails(row.original.id)
                }}
                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
              >
                <FiEye className="h-4 w-4 mr-2 text-zinc-600" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditOrganization(row.original)
                }}
                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
              >
                <FiEdit className="h-4 w-4 mr-2 text-zinc-600" />
                Edit Organization
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenAddUser(row.original.id)
                }}
                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
              >
                <UserPlus className="h-4 w-4 mr-2 text-zinc-600" />
                Add User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteOrganization(row.original.id, row.original.name)
                }}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer focus:bg-red-50 focus:text-red-600 outline-none"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/super-admin/organizations/${selectedOrgId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addUserFormData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(`Email address "${addUserFormData.email}" is already in use. Please use a different email.`, {
            position: "bottom-right",
            duration: 5000,
          })
          setIsLoading(false)
          return
        }
        throw new Error(result.message || "Failed to add user to organization")
      }

      toast.success(result.message || "User added successfully", {
        position: "bottom-right",
      })

      // Restore pointer events before closing dialog
      document.body.style.pointerEvents = ""
      setIsAddUserDialogOpen(false)

      // Reset form
      setAddUserFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        role: "user",
      })

      // Refresh data
      refreshOrganizations()
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add user", {
        position: "bottom-right",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAddUser = (orgId: string) => {
    // First set the selected org ID
    setSelectedOrgId(orgId)
    // Reset the form data
    setAddUserFormData({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      role: "user",
    })
    // Then open the dialog
    setIsAddUserDialogOpen(true)
  }

  const confirmDeleteOrganization = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${selectedOrgId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete organization")
      }

      toast.success("Organization deleted successfully", {
        position: "bottom-right",
      })

      // Restore pointer events before closing dialog
      document.body.style.pointerEvents = ""
      setIsDeleteDialogOpen(false)

      await refreshOrganizations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organization", {
        position: "bottom-right",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format the data before sending
      const formattedData = {
        name: editOrgFormData.name,
        slug: editOrgFormData.slug,
        // If expiresAt is empty string, set it to null to avoid default 30 days
        expiresAt: editOrgFormData.expiresAt ? new Date(editOrgFormData.expiresAt).toISOString() : null,
      }

      console.log("Sending organization update with data:", formattedData)

      const response = await fetch(`/api/super-admin/organizations/${selectedOrgId}`, {
        method: "PUT",
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
          toast.error(`Organization name "${editOrgFormData.name}" already exists. Please choose a different name.`, {
            position: "bottom-right",
            duration: 5000,
          })
          return
        }
        throw new Error(result.message || "Failed to update organization")
      }

      toast.success("Organization updated successfully", {
        position: "bottom-right",
      })

      // Restore pointer events before closing dialog
      document.body.style.pointerEvents = ""
      setIsEditDialogOpen(false)

      await refreshOrganizations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization", {
        position: "bottom-right",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 overflow-auto">
      <div className="flex items-center justify-between px-5 py-5 pt-0 border-b border-zinc-200">
        <div>
          <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Organizations</h1>
          <p className="text-sm text-zinc-600">Manage and monitor all organizations in the system.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshOrganizations}
            variant="outline"
            size="sm"
            className="h-9 text-zinc-900 bg-zinc-50/50 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              // Reset any state before opening the dialog
              document.body.style.pointerEvents = ""
              setIsCreateDialogOpen(true)
            }}
            size="sm"
            className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-[15px] font-medium"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between p-6 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-zinc-900">All organizations</h2>
              <span className="text-[15px] text-zinc-500">{filteredOrganizations.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[320px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-zinc-200 h-10 text-[15px] text-zinc-900 placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="border border-zinc-200 rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-6 py-3 bg-zinc-50 text-left text-[13px] font-medium text-zinc-500">
                      Organization
                    </th>
                    <th className="px-6 py-3 bg-zinc-50 text-left text-[13px] font-medium text-zinc-500">Members</th>
                    <th className="px-6 py-3 bg-zinc-50 text-left text-[13px] font-medium text-zinc-500">Created</th>
                    <th className="px-6 py-3 bg-zinc-50 text-left text-[13px] font-medium text-zinc-500">Expires</th>
                    <th className="px-6 py-3 bg-zinc-50 text-left text-[13px] font-medium text-zinc-500">Status</th>
                    <th className="px-6 py-3 bg-zinc-50 text-right text-[13px] font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b border-zinc-200 hover:bg-zinc-50/50 cursor-pointer"
                      onClick={() => handleViewDetails(org.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[15px] font-medium">
                            {org.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[15px] font-medium text-zinc-900">{org.name}</div>
                            <div className="text-sm text-zinc-500">{org.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
                          <FiUsers className="h-4 w-4 text-zinc-500" />
                          <span>{org.memberCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
                          <FiCalendar className="h-4 w-4 text-zinc-500" />
                          <span>{format(new Date(org.createdAt), "yyyy-MM-dd")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[15px] text-zinc-600">
                          <FiCalendar className="h-4 w-4 text-zinc-500" />
                          <span>{org.expiresAt ? format(new Date(org.expiresAt), "yyyy-MM-dd") : "Never"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = (org.status || "inactive") as StatusType
                          const statusColors: Record<StatusType, string> = {
                            active: "bg-green-100 text-green-700",
                            inactive: "bg-zinc-100 text-zinc-700",
                            expired: "bg-red-100 text-red-700",
                            pending: "bg-yellow-100 text-yellow-700",
                          }

                          return (
                            <div
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium ${statusColors[status]}`}
                            >
                              {status}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50"
                              >
                                <FiMoreVertical className="h-4 w-4 text-zinc-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDetails(org.id)
                                }}
                                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
                              >
                                <FiEye className="h-4 w-4 mr-2 text-zinc-600" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditOrganization(org)
                                }}
                                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
                              >
                                <FiEdit className="h-4 w-4 mr-2 text-zinc-600" />
                                Edit Organization
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenAddUser(org.id)
                                }}
                                className="flex items-center px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
                              >
                                <UserPlus className="h-4 w-4 mr-2 text-zinc-600" />
                                Add User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteOrganization(org.id, org.name)
                                }}
                                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer focus:bg-red-50 focus:text-red-600 outline-none"
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrganizations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[15px] text-zinc-500">
                        No organizations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (open === false) {
            document.body.style.pointerEvents = ""
          }
          setIsCreateDialogOpen(open)
        }}
        onSuccess={refreshOrganizations}
      />

      {/* Add User Dialog */}
      <Dialog
        open={isAddUserDialogOpen}
        onOpenChange={(open) => {
          if (open === false) {
            document.body.style.pointerEvents = ""
          }
          setIsAddUserDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-zinc-900">Add Organization User</DialogTitle>
                <DialogDescription className="text-[15px] text-zinc-500">
                  Add a new user to this organization.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-zinc-900">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter First Name"
                  value={addUserFormData.firstname}
                  onChange={(e) => setAddUserFormData({ ...addUserFormData, firstname: e.target.value })}
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
                  value={addUserFormData.lastname}
                  onChange={(e) => setAddUserFormData({ ...addUserFormData, lastname: e.target.value })}
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
                value={addUserFormData.email}
                onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
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
                value={addUserFormData.password}
                onChange={(e) => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="role" className="text-sm font-medium text-zinc-900">
                Role
              </Label>
              <Select
                value={addUserFormData.role}
                onValueChange={(value) => setAddUserFormData({ ...addUserFormData, role: value })}
              >
                <SelectTrigger className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50">
                  <SelectItem
                    value="org_admin"
                    className="text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
                  >
                    Organization Admin
                  </SelectItem>
                  <SelectItem
                    value="user"
                    className="text-zinc-900 hover:bg-zinc-50 cursor-pointer focus:bg-zinc-50 focus:text-zinc-900 outline-none"
                  >
                    User
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4  border-t border-zinc-200">
              <Button
                type="button"
                onClick={() => {
                  document.body.style.pointerEvents = ""
                  setIsAddUserDialogOpen(false)
                }}
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
                    <span>Adding...</span>
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (open === false) {
            document.body.style.pointerEvents = ""
          }
          setIsEditDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[525px] bg-white border border-zinc-300 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-zinc-900">Edit Organization</DialogTitle>
                <DialogDescription className="text-[15px] text-zinc-500">
                  Update the organization details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSaveOrganization} className="space-y-6 py-4">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-medium text-zinc-900">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter Organization Name"
                value={editOrgFormData.name}
                onChange={(e) => setEditOrgFormData({ ...editOrgFormData, name: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="slug" className="text-sm font-medium text-zinc-900">
                Slug
              </Label>
              <Input
                id="slug"
                placeholder="Enter Organization Slug"
                value={editOrgFormData.slug}
                onChange={(e) => setEditOrgFormData({ ...editOrgFormData, slug: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="expiresAt" className="text-sm font-medium text-zinc-900">
                Expires At
              </Label>
              <Input
                id="expiresAt"
                type="date"
                placeholder="Enter Expiration Date"
                value={editOrgFormData.expiresAt}
                onChange={(e) => setEditOrgFormData({ ...editOrgFormData, expiresAt: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900/20 focus:ring-zinc-900/20 transition-colors"
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-200">
              <Button
                type="button"
                onClick={() => {
                  document.body.style.pointerEvents = ""
                  setIsEditDialogOpen(false)
                }}
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

      {/* Delete Organization Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (open === false) {
            document.body.style.pointerEvents = ""
          }
          setIsDeleteDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-white border border-zinc-300 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-zinc-900">Delete Organization</DialogTitle>
                <DialogDescription className="text-[15px] text-zinc-500">
                  Are you sure you want to delete this organization? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => {
                document.body.style.pointerEvents = ""
                setIsDeleteDialogOpen(false)
              }}
              variant="outline"
              className="h-10 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteOrganization}
              className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
            >
              Delete Organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
