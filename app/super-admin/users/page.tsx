"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreVertical, Pencil, Download, Trash2, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddUserDialog } from "@/components/super-admin/add-user-dialog"
import { EditUserDialog } from "@/components/super-admin/edit-user-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  firstname: string
  lastname: string
  role: string
  createdAt: string
}

interface UpdatedUser extends User {
  // Add any additional fields that might come from the API
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/super-admin/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstname} ${user.lastname}`.toLowerCase()
    const email = user.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(currentUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditUserOpen(true)
  }

  const handleCloseEditDialog = () => {
    setIsEditUserOpen(false)
    setSelectedUser(null)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/super-admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers(users.filter((user) => user.id !== userToDelete.id))
      toast.success("User deleted successfully")
      handleCloseDeleteDialog()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const handleUserUpdated = (updatedUser: any) => {
    setUsers(
      users.map((user) =>
        user.id === updatedUser.id
          ? {
              ...user,
              ...updatedUser,
              role: "super_admin", // Always keep role as super_admin
            }
          : user,
      ),
    )
    toast.success("User updated successfully")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return format(date, "dd MMM yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "-"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">System Users</h1>
          <p className="text-sm text-zinc-600">Manage super admin users and their permissions here.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-zinc-900">All users</h2>
            <span className="text-[15px] text-zinc-500">{filteredUsers.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search super admin users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-zinc-200 h-10 text-[15px] text-zinc-900 placeholder:text-zinc-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 text-[15px] font-medium border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-700"
            >
              <Filter className="w-4 h-4 mr-2 text-zinc-900" />
              Filters
            </Button>
            <Button
              onClick={() => setIsAddUserOpen(true)}
              size="sm"
              className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-[15px] font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Super Admin
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px] py-3 bg-zinc-50">
                  <Checkbox
                    checked={currentUsers.length > 0 && selectedUsers.length === currentUsers.length}
                    onCheckedChange={handleSelectAll}
                    className="border-zinc-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </TableHead>
                <TableHead className="w-[300px] py-3 text-[13px] text-zinc-500 font-medium bg-zinc-50">
                  User name
                </TableHead>
                <TableHead className="py-3 text-[13px] text-zinc-500 font-medium bg-zinc-50">Role</TableHead>
                <TableHead className="text-right py-3 pr-14 text-[13px] text-zinc-500 font-medium bg-zinc-50">
                  Added Date
                </TableHead>
                <TableHead className="w-[40px] py-3 bg-zinc-50"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p className="text-[15px] text-zinc-500">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((user) => (
                  <TableRow key={user.id} className="border-t border-zinc-200 hover:bg-zinc-50/50">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        className="border-zinc-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[15px] font-medium">
                          {user.firstname?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[15px] font-medium text-zinc-900">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-sm text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full px-2.5 py-1 text-[13px] font-medium bg-purple-50 text-purple-700">
                          Super Admin
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-14 text-[15px] text-zinc-600">
                      <span className="text-zinc-600">{formatDate(user.createdAt)}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-[200px] p-1.5 border-zinc-200 bg-white shadow-lg"
                          sideOffset={5}
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                            className="flex items-center text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <Pencil className="mr-2 h-4 w-4 text-zinc-500 transition-colors" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors">
                            <Download className="mr-2 h-4 w-4 text-zinc-500 transition-colors" />
                            Export details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(user)}
                            className="flex items-center text-[15px] text-red-600 px-3 py-2 cursor-pointer rounded-md border-t border-zinc-200 mt-1 focus:bg-transparent focus:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-red-500 transition-colors" />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 text-[13px] font-medium ${
                    currentPage === page
                      ? "bg-zinc-200 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddUserDialog
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={() => {
          fetchUsers()
          setIsAddUserOpen(false)
        }}
      />

      {isEditUserOpen && selectedUser && (
        <EditUserDialog
          open={isEditUserOpen}
          onClose={handleCloseEditDialog}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {isDeleteDialogOpen && userToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
          <DialogContent
            className="sm:max-w-[425px] bg-white"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-zinc-900">Delete User</DialogTitle>
              <DialogDescription className="text-[15px] text-zinc-500">
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 p-4 mt-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">
                This will permanently delete the user and remove all associated data.
              </p>
            </div>
            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleCloseDeleteDialog}
                className="h-10 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400"
              >
                Cancel
              </Button>
              <Button onClick={handleDeleteConfirm} className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white">
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
