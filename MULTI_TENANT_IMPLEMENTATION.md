# Multi-Tenant Implementation Plan

## Current System

### Existing Database Structure
1. Users Table
   - Basic user management (id, email, password, firstname, lastname, role)
   - Simple role system (user, admin)
   - No organization/tenant association

2. Workspaces Table
   - Workspace management (id, name, description)
   - Currently shared across all users
   - No organization/tenant isolation

3. WorkspaceAccess Table
   - Access control for workspaces
   - Links users to workspaces with access levels
   - No organizational hierarchy

4. Additional Tables
   - Chats and Messages (for conversation history)
   - Documents (for file management)
   - All currently shared across the system

## Required Changes for Multi-Tenancy

### 1. Database Schema Changes

#### New Tables

```sql
-- Organizations Table
Table: organizations
- id: uuid('id').defaultRandom().primaryKey()
- name: varchar('name', { length: 255 }).notNull()
- slug: varchar('slug', { length: 255 }).unique().notNull()
- status: varchar('status', { length: 20 }).default('active')
- settings: json('settings')
- expires_at: timestamp('expires_at')
- created_at: timestamp('created_at').defaultNow()
- updated_at: timestamp('updated_at').defaultNow()

-- Organization Memberships Table
Table: organization_memberships
- id: uuid('id').defaultRandom().primaryKey()
- organization_id: uuid('organization_id').references(() => organizations.id)
- user_id: integer('user_id').references(() => users.id)
- role: varchar('role', { length: 20 }).default('member')
- created_at: timestamp('created_at').defaultNow()
- updated_at: timestamp('updated_at').defaultNow()
```

#### Modifications to Existing Tables

```sql
-- Modified Users Table
Table: users
+ organization_id: uuid('organization_id').references(() => organizations.id).nullable()
* role: varchar('role', { length: 20 }).default('user')
  // New role values: 'super_admin', 'org_admin', 'user'

-- Modified Workspaces Table
Table: workspaces
+ organization_id: uuid('organization_id').references(() => organizations.id).notNull()

-- Modified Documents Table
Table: documents
+ organization_id: uuid('organization_id').references(() => organizations.id).notNull()
```

### 2. API Changes

#### New Endpoints

1. Organization Management
   ```typescript
   // Organizations
   POST /api/organizations - Create organization
   GET /api/organizations - List organizations (super_admin only)
   GET /api/organizations/:id - Get organization details
   PUT /api/organizations/:id - Update organization
   DELETE /api/organizations/:id - Delete organization
   
   // Organization Members
   POST /api/organizations/:id/members - Add member
   GET /api/organizations/:id/members - List members
   PUT /api/organizations/:id/members/:userId - Update member role
   DELETE /api/organizations/:id/members/:userId - Remove member
   
   // Organization Invites
   POST /api/organizations/:id/invites - Create invite
   GET /api/organizations/:id/invites - List invites
   POST /api/organizations/invites/:token/accept - Accept invite
   DELETE /api/organizations/invites/:token - Delete invite
   ```

2. Modified Existing Endpoints
   ```typescript
   // Add organization context to all workspace operations
   POST /api/workspaces - Create workspace (within organization)
   GET /api/workspaces - List workspaces (filtered by organization)
   
   // Add organization context to all document operations
   POST /api/documents - Create document (within organization)
   GET /api/documents - List documents (filtered by organization)
   ```

### 3. Authentication & Authorization Updates

1. JWT Token Structure
   ```typescript
   {
     userId: string;
     email: string;
     role: 'super_admin' | 'org_admin' | 'user';
     organizationId: string | null;
     permissions: string[];
   }
   ```

2. Authorization Rules
   ```typescript
   const authorizationRules = {
     super_admin: {
       // Global access
       can_manage_organizations: true,
       can_manage_all_users: true,
       can_view_system_stats: true
     },
     org_admin: {
       // Organization-level access
       can_manage_org_settings: true,
       can_manage_org_users: true,
       can_manage_workspaces: true
     },
     user: {
       // Limited access
       can_view_assigned_workspaces: true,
       can_manage_own_documents: true
     }
   };
   ```

## Implementation Phases

### Phase 1: Database Migration (1-2 weeks)
1. Create new tables (organizations, organization_memberships)
2. Add organization_id to existing tables
3. Create initial super admin account
4. Migration script for existing data:
   ```typescript
   async function migrateToMultiTenant() {
     // Create default organization
     const defaultOrg = await db.insert(organizations).values({
       name: 'Default Organization',
       slug: 'default-org',
       status: 'active'
     });

     // Associate existing users with default organization
     await db.update(users)
       .set({ organization_id: defaultOrg.id })
       .where(eq(users.role, 'admin'))
       .set({ role: 'org_admin' });

     // Associate existing workspaces with default organization
     await db.update(workspaces)
       .set({ organization_id: defaultOrg.id });

     // Associate existing documents with default organization
     await db.update(documents)
       .set({ organization_id: defaultOrg.id });
   }
   ```

### Phase 2: Backend Implementation (2-3 weeks)
1. Update authentication middleware
   ```typescript
   async function organizationContext(req, res, next) {
     const token = req.headers.authorization;
     const decoded = verifyToken(token);
     req.organizationId = decoded.organizationId;
     req.userRole = decoded.role;
     next();
   }
   ```

2. Implement organization service
   ```typescript
   class OrganizationService {
     async createOrganization(data) {}
     async getOrganizationMembers(orgId) {}
     async addMember(orgId, userId, role) {}
     async removeMember(orgId, userId) {}
   }
   ```

3. Update existing services with organization context
   ```typescript
   class WorkspaceService {
     async getWorkspaces(organizationId) {
       return db.select()
         .from(workspaces)
         .where(eq(workspaces.organization_id, organizationId));
     }
   }
   ```

### Phase 3: Frontend Implementation (2-3 weeks)
1. Super Admin Dashboard
   - Organization management
   - System-wide statistics
   - User management across organizations

2. Organization Admin Dashboard
   - Member management
   - Workspace management
   - Organization settings

3. Update existing components
   - Add organization context
   - Update permission checks
   - Modify navigation structure

### Phase 4: Testing & Deployment (1-2 weeks)
1. Unit Tests
   ```typescript
   describe('Organization Service', () => {
     it('should create organization with admin', async () => {});
     it('should enforce organization isolation', async () => {});
     it('should handle member management', async () => {});
   });
   ```

2. Integration Tests
   - Multi-tenant data isolation
   - Role-based access control
   - Organization management workflows

3. Migration Testing
   - Data integrity verification
   - Access control validation
   - Performance testing

## Security Considerations

1. Data Isolation
   ```typescript
   // Middleware to enforce organization isolation
   function enforceOrganizationIsolation(req, res, next) {
     if (!req.organizationId) {
       return res.status(403).json({ error: 'Organization context required' });
     }
     next();
   }
   ```

2. Access Control
   ```typescript
   function checkOrganizationAccess(orgId, userId, requiredRole) {
     const membership = await db.query.organization_memberships.findFirst({
       where: and(
         eq(organization_memberships.organization_id, orgId),
         eq(organization_memberships.user_id, userId),
         eq(organization_memberships.role, requiredRole)
       )
     });
     return !!membership;
   }
   ```

## Migration Strategy

1. Pre-migration Tasks
   - Backup all data
   - Create migration scripts
   - Set up rollback procedures

2. Migration Steps
   ```typescript
   async function migrationSteps() {
     // 1. Create new tables
     await createOrganizationTables();
     
     // 2. Create default organization
     const defaultOrg = await createDefaultOrganization();
     
     // 3. Migrate existing users
     await migrateUsers(defaultOrg.id);
     
     // 4. Migrate workspaces and documents
     await migrateWorkspaces(defaultOrg.id);
     await migrateDocuments(defaultOrg.id);
     
     // 5. Verify migration
     await verifyMigration();
   }
   ```

3. Post-migration Tasks
   - Verify data integrity
   - Update application settings
   - Create super admin account

## Monitoring and Maintenance

1. Logging
   ```typescript
   const logger = {
     info: (message, context) => {
       console.log({
         timestamp: new Date(),
         organization_id: context.organizationId,
         level: 'info',
         message
       });
     }
   };
   ```

2. Metrics
   - Organization-specific usage statistics
   - System-wide performance metrics
   - Error rates by organization

## Timeline
- Phase 1 (Database): 1-2 weeks
- Phase 2 (Backend): 2-3 weeks
- Phase 3 (Frontend): 2-3 weeks
- Phase 4 (Testing): 1-2 weeks
- Total: 6-10 weeks

## Resources Required
- 1 Backend Developer
- 1 Frontend Developer
- 1 QA Engineer
- 1 DevOps Engineer (part-time)

## Risk Management

1. Data Migration Risks
   - Data loss during migration
   - Inconsistent organization mapping
   - Performance impact

2. Mitigation Strategies
   - Comprehensive backup strategy
   - Staged migration approach
   - Performance monitoring
   - Rollback procedures 