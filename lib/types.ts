export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  createdAt: string
  role?: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  accessLevel: string
}

export interface Document {
  id: string
  workspaceId: string
  filepath: string
  fileType: "original" | "revision" | "amendment"
  originalFileId?: string
  impactDate?: string
  createdAt: string
}

export interface SuperAdminStatsResponse {
  totalOrganizations: number
  totalUsers: number
  activeOrganizations: number
  activeUsers: number
  recentOrganizations: Array<{
    id: string
    name: string
    status: string | null
    createdAt: Date
    memberCount: number
  }>
}

export interface SuperAdminStats extends SuperAdminStatsResponse {
  organizationGrowth: number
  userGrowth: number
  activeOrganizationGrowth: number
  activeUserGrowth: number
  organizationDistribution: Array<{
    name: string
    userCount: number
  }>
}
