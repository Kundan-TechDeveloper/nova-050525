"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  FiArrowLeft,
  FiCalendar,
  FiUsers,
  FiMail,
  FiUser,
  FiSettings,
  FiSearch,
  FiTrash2,
  FiEdit,
} from "react-icons/fi"
import { RefreshCw, UserPlus, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBreadcrumbStore } from "@/components/super-admin/header"

interface Organization {
  id: string
  name: string
  slug: string
  status: string | null
  expiresAt: Date
  createdAt: Date
  memberCount: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { setOrganizationName } = useBreadcrumbStore()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newUser, setNewUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "user",
  })
  const [settings, setSettings] = useState({
    name: "",
    slug: "",
    expiresAt: "",
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrganizationDetails()
    }
  }, [params.id])

  useEffect(() => {
    if (organization?.name) {
      setOrganizationName(organization.name)
    }
    return () => {
      setOrganizationName("") // Clear the name when unmounting
    }
  }, [organization?.name, setOrganizationName])

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true)
      console.log("Fetching organization details for ID:", params.id)

      const [orgResponse, usersResponse] = await Promise.all([
        fetch(`/api/super-admin/organizations/${params.id}`),
        fetch(`/api/super-admin/organizations/${params.id}/users`),
      ])

      if (!orgResponse.ok) {
        const errorText = await orgResponse.text()
        console.error("Error fetching organization:", errorText)
        throw new Error(`Failed to fetch organization: ${errorText}`)
      }

      if (!usersResponse.ok) {
        const errorText = await usersResponse.text()
        console.error("Error fetching users:", errorText)
        throw new Error(`Failed to fetch users: ${errorText}`)
      }

      const [orgData, usersData] = await Promise.all([orgResponse.json(), usersResponse.json()])

      console.log("Organization data received:", orgData)
      console.log("Users data received:", usersData)

      setOrganization(orgData)
      setUsers(usersData)
      setSettings({
        name: orgData.name,
        slug: orgData.slug,
        expiresAt: orgData.expiresAt ? new Date(orgData.expiresAt).toISOString().split("T")[0] : "",
      })
    } catch (error) {
      console.error("Error in fetchOrganizationDetails:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load organization details", {
        position: "bottom-right",
      })
      router.push("/super-admin/organizations")
    } finally {
      setLoading(false)
    }
  }

  const updateOrganization = async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: settings.name,
          slug: settings.slug,
          expiresAt: settings.expiresAt ? new Date(settings.expiresAt).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update organization")
      }

      toast.success("Organization updated successfully", {
        position: "bottom-right",
      })
      setOpenSettingsDialog(false)
      fetchOrganizationDetails()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization", {
        position: "bottom-right",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setNewUser({
      firstname: user.name.split(" ")[0] || "",
      lastname: user.name.split(" ")[1] || "",
      email: user.email,
      password: "",
      role: user.role,
    })
    setOpenUserDialog(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/super-admin/organizations/${params.id}/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete user")
      }

      toast.success(result.message || "User deleted successfully", {
        position: "bottom-right",
      })
      setOpenDeleteDialog(false)
      setSelectedUser(null)
      await fetchOrganizationDetails()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete user", {
        position: "bottom-right",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const addOrUpdateUser = async () => {
    if (!selectedUser && !newUser.password) {
      toast.error("Password is required for new users", {
        position: "bottom-right",
      })
      return
    }

    setIsUpdating(true)
    try {
      const endpoint = selectedUser
        ? `/api/super-admin/organizations/${params.id}/users/${selectedUser.id}`
        : `/api/super-admin/organizations/${params.id}/users`

      const method = selectedUser ? "PUT" : "POST"

      // Only include fields that have values
      const userData = {
        ...(newUser.email && { email: newUser.email }),
        ...(newUser.role && { role: newUser.role }),
        ...(newUser.firstname && { firstname: newUser.firstname }),
        ...(newUser.lastname && { lastname: newUser.lastname }),
        ...(method === "POST" && newUser.password && { password: newUser.password }),
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Special handling for email already exists
        if (response.status === 409) {
          toast.warning("Email address is already in use by another user", {
            position: "bottom-right",
          })
        } else {
          throw new Error(result.message || (selectedUser ? "Failed to update user" : "Failed to add user"))
        }
        return
      }

      toast.success(result.message || (selectedUser ? "User updated successfully" : "User added successfully"), {
        position: "bottom-right",
      })
      setOpenUserDialog(false)
      setSelectedUser(null)
      setNewUser({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        role: "user",
      })
      fetchOrganizationDetails()
    } catch (error) {
      console.error("Error updating/adding user:", error)
      toast.error(
        error instanceof Error ? error.message : selectedUser ? "Failed to update user" : "Failed to add user",
        {
          position: "bottom-right",
        },
      )
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-zinc-200 animate-pulse" />
            <div>
              <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded" />
              <div className="h-4 w-32 mt-2 bg-zinc-200 animate-pulse rounded" />
            </div>
          </div>
          <div className="h-10 w-24 bg-zinc-200 animate-pulse rounded" />
        </div>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-[300px] rounded-xl bg-zinc-200 animate-pulse" />
          <div className="h-[400px] rounded-xl bg-zinc-200 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="text-zinc-900 text-xl font-medium mb-4">Organization not found or error loading data</div>
          <p className="text-zinc-600 mb-6">There was a problem loading the organization details.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={fetchOrganizationDetails} className="bg-zinc-900 hover:bg-zinc-800 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/super-admin/organizations")}
              className="border-zinc-300 text-zinc-700"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { name, slug, status, memberCount, createdAt, expiresAt } = organization

  return (
    <div className="flex-1 p-8 bg-zinc-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Organization Header Card */}
        <div className="bg-white rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between p-8 border-b border-zinc-100">
            <div className="flex items-start gap-5 mb-6 md:mb-0">
              <div
                className="w-16 h-16 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-semibold shadow-sm cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => router.push("/super-admin/organizations")}
              >
                <FiArrowLeft className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-1">{organization.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-zinc-500">{organization.slug}</span>
                  {/* <span className="text-zinc-300">•</span>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    status === 'active' ? 'bg-green-100 text-green-700' :
                    status === 'inactive' ? 'bg-zinc-100 text-zinc-700' :
                    status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {status || 'inactive'}
                  </div>
                  <span className="text-zinc-300">•</span>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <FiUsers className="h-3.5 w-3.5" />
                    <span>{memberCount} members</span>
                  </div> */}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrganizationDetails}
                disabled={loading}
                className="flex items-center gap-1.5 text-zinc-700 bg-white border-zinc-200 hover:bg-zinc-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenUserDialog(true)}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </Button>
              {/* <Button
                variant="default"
                size="sm"
                onClick={() => setOpenSettingsDialog(true)}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                <FiSettings className="h-3.5 w-3.5" />
                Settings
              </Button> */}
            </div>
          </div>

          {/* Organization Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-100">
            <div className="p-6">
              <div className="text-sm font-medium text-zinc-500 mb-1">Status</div>
              <div
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                  status === "active"
                    ? "bg-green-100 text-green-700"
                    : status === "inactive"
                      ? "bg-zinc-100 text-zinc-700"
                      : status === "expired"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {status || "inactive"}
              </div>
            </div>
            <div className="p-6">
              <div className="text-sm font-medium text-zinc-500 mb-1">Members</div>
              <div className="flex items-center gap-2 text-zinc-900">
                <FiUsers className="h-4 w-4 text-zinc-500" />
                <span className="text-lg font-semibold">{memberCount}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="text-sm font-medium text-zinc-500 mb-1">Created On</div>
              <div className="flex items-center gap-2 text-zinc-900">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span className="text-lg font-semibold">{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="text-sm font-medium text-zinc-500 mb-1">Expires On</div>
              <div className="flex items-center gap-2 text-zinc-900">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span className="text-lg font-semibold">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="bg-white border border-zinc-200 p-1 rounded-lg mb-6">
            <TabsTrigger
              value="members"
              className="rounded-md data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-700"
            >
              <FiUsers className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-md data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-700"
            >
              <FiCalendar className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-md data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-700"
            >
              <FiSettings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-0">
            <Card className="bg-white shadow-sm border-zinc-200 overflow-hidden">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">Members</CardTitle>
                    <CardDescription className="text-zinc-600">
                      Manage organization members and their roles
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-[280px]">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-zinc-200 h-10 text-zinc-900 placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50/75 hover:bg-zinc-50/75">
                        <TableHead className="font-medium text-zinc-600 pl-6">User</TableHead>
                        <TableHead className="font-medium text-zinc-600">Email</TableHead>
                        <TableHead className="font-medium text-zinc-600">Role</TableHead>
                        <TableHead className="font-medium text-zinc-600">Joined</TableHead>
                        <TableHead className="font-medium text-zinc-600 text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className={`
                            hover:bg-zinc-50 
                            transition-all 
                            duration-300 
                            ease-in-out
                            ${selectedUser?.id === user.id && isDeleting ? "opacity-50 bg-red-50 scale-98" : "opacity-100"}
                          `}
                        >
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                <FiUser className="h-4 w-4 text-zinc-600" />
                              </div>
                              <span className="font-medium text-zinc-900">{user.name || "Not set"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-700">
                            <div className="flex items-center gap-2">
                              <FiMail className="h-4 w-4 text-zinc-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium">
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-700">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="h-8 px-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                                disabled={isDeleting || (selectedUser?.id === user.id && isUpdating)}
                              >
                                {selectedUser?.id === user.id && isUpdating ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-zinc-400" />
                                ) : (
                                  <FiEdit className="h-4 w-4" />
                                )}
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isDeleting || isUpdating}
                              >
                                {selectedUser?.id === user.id && isDeleting ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-red-400" />
                                ) : (
                                  <FiTrash2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                            No members found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="bg-white shadow-sm border-zinc-200 overflow-hidden">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
                <CardTitle className="text-xl font-semibold text-zinc-900">Activity Log</CardTitle>
                <CardDescription className="text-zinc-600">Recent activity in this organization</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-zinc-500">Activity tracking coming soon</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card className="bg-white shadow-sm border-zinc-200 overflow-hidden">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
                <CardTitle className="text-xl font-semibold text-zinc-900">Organization Settings</CardTitle>
                <CardDescription className="text-zinc-600">Manage organization details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="org-name" className="text-sm font-medium text-zinc-900">
                      Organization Name
                    </Label>
                    <Input
                      id="org-name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-slug" className="text-sm font-medium text-zinc-900">
                      Organization Slug
                    </Label>
                    <Input
                      id="org-slug"
                      value={settings.slug}
                      onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-expires" className="text-sm font-medium text-zinc-900">
                      Expiration Date
                    </Label>
                    <Input
                      id="org-expires"
                      type="date"
                      value={settings.expiresAt}
                      onChange={(e) => setSettings({ ...settings, expiresAt: e.target.value })}
                      className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900"
                    />
                  </div>
                  <div className="">
                    <Button onClick={updateOrganization} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Dialog */}
      <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
        <DialogContent className="sm:max-w-[525px] bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-sm">
                <FiUser className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-zinc-900">
                  {selectedUser ? "Edit Member" : "Add Organization Member"}
                </DialogTitle>
                <DialogDescription className="text-[15px] text-zinc-500">
                  {selectedUser ? "Update member details" : "Add a new member to this organization"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-zinc-900">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter First Name"
                  value={newUser.firstname}
                  onChange={(e) => setNewUser({ ...newUser, firstname: e.target.value })}
                  className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-zinc-900">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter Last Name"
                  value={newUser.lastname}
                  onChange={(e) => setNewUser({ ...newUser, lastname: e.target.value })}
                  className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
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
                placeholder="Enter Email Address"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-900">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-zinc-900">
                Role
              </Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="org_admin" className="text-zinc-900 hover:bg-zinc-50 cursor-pointer">
                    Organization Admin
                  </SelectItem>
                  <SelectItem value="user" className="text-zinc-900 hover:bg-zinc-50 cursor-pointer">
                    User
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="">
            <Button
              variant="outline"
              onClick={() => {
                setOpenUserDialog(false)
                setSelectedUser(null)
                setNewUser({
                  firstname: "",
                  lastname: "",
                  email: "",
                  password: "",
                  role: "user",
                })
              }}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={addOrUpdateUser}
              className="bg-zinc-900 hover:bg-zinc-800 text-white"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {selectedUser ? "Updating..." : "Adding..."}
                </>
              ) : selectedUser ? (
                "Update Member"
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-zinc-900">Delete Member</DialogTitle>
                <DialogDescription className="text-[15px] text-zinc-500">
                  Are you sure you want to delete this member?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600">
              This action cannot be undone. This will permanently delete the member
              <span className="font-medium text-zinc-900"> {selectedUser?.name}</span> from the organization.
            </p>
          </div>
          <DialogFooter className="border-t border-zinc-200 mt-6 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpenDeleteDialog(false)
                setSelectedUser(null)
              }}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
