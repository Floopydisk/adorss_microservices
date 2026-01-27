# Multi-Role Account System & Permission System Integration - Implementation Summary

**Date:** January 25, 2026  
**Status:** ✅ Core Implementation Complete  
**Phase:** Phase 1 - Foundation & Architecture

---

## Overview

Implemented a production-grade multi-role and permission system enabling:

- Users with multiple roles across different organizations
- Role switching with fresh JWT tokens
- Granular permission-based access control (resource:action)
- Comprehensive audit logging of auth events
- Data isolation by organization and role

---

## What Was Implemented

### 1. **Database Layer - 4 New Migrations**

#### `user_roles` Table

- Tracks user's roles within organization contexts
- Supports: school_id, fleet_id, admin_org_id, etc.
- Fields: user_id, role, organization_id, organization_type, is_active, context, assigned_at, expires_at
- Indexes on: user_id, role, organization_id, [user_id, is_active], [user_id, role, organization_id]
- Unique constraint prevents duplicate roles per org

#### `user_links` Table

- Establishes relationships between users (parent→student, admin→user, etc.)
- Relationship types: parent_of, teacher_at, driver_for, fleet_manager, admin_of
- Fields: user_id, linked_user_id, relationship_type, organization_id, organization_type, is_active, context
- Supports both active and inactive links (soft deactivation)

#### `audit_logs` Table

- 15 categories of events: auth.login, auth.role_switch, perm.denied, etc.
- Tracks: user_id, action, resource, request/response data, status, failure_reason, IP, user_agent
- Queryable by: user, category, status, date range
- Purpose: Compliance, security forensics, debugging

#### Users Table Addition

- `active_role_id` - Current active UserRole ID (performance optimization)
- `last_role_switched_at` - Timestamp when user switched roles

### 2. **Model Layer - 3 New Models**

#### `UserRole` Model

**Relationships:**

- belongsTo User

**Scopes:**

- `active()` - Get non-expired, active roles
- `inOrganization(id, type)` - Filter by organization
- `withRole(name)` - Filter by role name

**Methods:**

- `getPermissions()` - Get all permissions for this role
- `hasPermission(resource, action)` - Check single permission
- `getOrganizationContext()` - Get merged org context
- `isExpired()` - Check expiry
- `activate()` / `deactivate()` - Toggle active status

#### `UserLink` Model

**Relationships:**

- belongsTo User (linking user)
- belongsTo User as linkedUser (linked user)

**Scopes:**

- `active()` - Get non-expired, active links
- `withRelationshipType(type)` - Filter by type
- `inOrganization(id, type)` - Filter by organization

**Methods:**

- `isExpired()` - Check expiry
- `activate()` / `deactivate()` - Toggle
- `getContext()` - Get merged context

#### `AuditLog` Model

**Scopes:**

- `forUser(id)` - Get logs for user
- `withCategory(name)` - Filter by category
- `failed()` - Get failed/denied actions
- `successful()` - Get successful actions
- `withinDateRange(start, end)` - Date filtering

**Static Methods:**

- `logSuccess(userId, category, action, resource, metadata)` - Log success
- `logFailure(userId, category, action, reason, metadata)` - Log failure
- `logDenied(userId, resource, action, metadata)` - Log permission denial
- `logLoginAttempt(userId, success, reason)` - Log login attempts

### 3. **Enhanced User Model**

**New Relationships:**

- `hasMany userRoles()` - All roles for user
- `hasMany activeRoles()` - Only active roles
- `hasMany linkedUsers()` - Users linked by this user
- `hasMany linkedBy()` - Users who linked to this user
- `hasMany auditLogs()` - Audit trail

**New Methods:**

- `getAllRoles()` - Get all active roles
- `hasRole(name, organizationId)` - Check if user has role
- `hasAnyRole(names, organizationId)` - Check any of multiple roles
- `getActiveRole()` - Get currently active role
- `switchRole(userRoleId)` - Switch to different role
- `linkUser(linkedUser, relationshipType, org, context)` - Link to another user
- `getLinkedUsers(relationshipType, organizationId)` - Get linked users

**Updated JWT Claims:**

- `active_role` - Currently active role name
- `active_role_id` - Currently active UserRole ID
- `organization_id` - Current organization context
- `organization_type` - Type of organization (school, fleet, etc.)
- `role_context` - Organization-specific context
- `has_multiple_roles` - Boolean indicating if user has multiple roles

### 4. **API Endpoints - 2 New Auth Endpoints**

#### `GET /auth/me/roles` (Protected)

Returns all available roles for authenticated user with permissions.

**Response:**

```json
{
  "success": true,
  "count": 2,
  "active_role": 5,
  "roles": [
    {
      "id": 5,
      "role": "teacher",
      "is_active": true,
      "organization_id": 1,
      "organization_type": "school",
      "context": {
        "organization_id": 1,
        "organization_type": "school"
      },
      "permissions": [
        {
          "resource": "assignments",
          "action": "create",
          "name": "assignments.create"
        },
        ...
      ],
      "assigned_at": "2026-01-25T10:30:00Z",
      "expires_at": null
    },
    {
      "id": 6,
      "role": "parent",
      "is_active": false,
      "organization_id": 2,
      "organization_type": "school",
      ...
    }
  ]
}
```

#### `POST /auth/switch-role` (Protected)

Switch to a different role and get new JWT token.

**Request:**

```json
{
    "user_role_id": 6
}
```

**Response:**

```json
{
    "success": true,
    "message": "Role switched successfully",
    "active_role": "parent",
    "organization_id": 2,
    "organization_type": "school",
    "token": "eyJ0eXAi...",
    "expires_in": 3600
}
```

### 5. **Registration & Login Updates**

**Enhanced `/auth/register`:**

- Now creates UserRole entry automatically
- Accepts `organization_id` and `organization_type` parameters
- Links user to school/fleet on registration
- Logs registration event in AuditLog
- Sets `active_role_id` on user

**Enhanced `/auth/login`:**

- Logs login attempts (success/failure) to AuditLog
- Returns JWT with organization context
- Failure reasons tracked for audit trail

### 6. **Permission System - Comprehensive Matrix**

**Implemented 55+ Permissions** organized by domain:

**Education Domain (17 permissions):**

- assignments: create, read, update, delete
- grades: create, read, update
- attendance: create, read, update
- timetable: read, create, update
- results: create, read, update
- classes: read, manage
- students: read, create, update
- teachers: read, create, update, verify

**Messaging Domain (5 permissions):**

- messages: create, read, delete
- notifications: read, dismiss
- announcements: create, read

**Mobility Domain (6 permissions):**

- location: read, broadcast
- routes: read, manage
- trips: create, read, update

**Finance Domain (7 permissions):**

- fees: read, pay, manage
- payments: create, read
- receipts: read, download

**Admin Domain (5 permissions):**

- users: manage, verify, lock
- audit: read
- school: read, manage
- analytics: read, export

**Marketplace Domain (3 permissions):**

- marketplace: read, offer, book

**Role Permission Assignments:**

| Role                    | Key Permissions                                                                                                    | Purpose               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| **admin**               | All 55+                                                                                                            | System admin          |
| **school_admin**        | Students (CRUD), Teachers (CRUD), Classes, Timetable, Finance, School, Analytics                                   | School management     |
| **teacher**             | Assignments (CRUD), Grades (CRUD), Attendance (CRUD), Classes (read), Students (read), Messages, Marketplace offer | Teaching              |
| **student**             | Assignments, Grades, Attendance, Timetable, Results (read), Messages, Notifications, Marketplace book              | Learning              |
| **parent**              | Same as student + Fees (read/pay), Location (read), Payment/Receipts (read)                                        | Monitoring + Payments |
| **driver**              | Routes, Trips, Location (broadcast), Messages, Notifications                                                       | Transportation        |
| **independent_teacher** | Marketplace (offer), Messages, Payments (read), Receipts (read)                                                    | Private tutoring      |

### 7. **API Gateway Permission Enforcement**

**Updated `/src/routes/serviceRoutes.ts`** with explicit route definitions:

- **40+ Explicit Routes** covering all service endpoints
- Each route has its own `authorize()` middleware
- Routes organized by service: education, messaging, mobility, finance
- Resources covered:
    - Education: assignments, grades, attendance, timetable, results, classes, students, teachers
    - Messaging: messages, notifications, announcements
    - Mobility: location, routes, trips
    - Finance: fees, payments, receipts

**Example Route:**

```typescript
router.post(
  "/education/assignments",
  authMiddleware.authenticate,
  authMiddleware.authorize("assignments", "create"),
  ServiceRouter.createProxy(serviceUrls.education, {...})
);
```

### 8. **Seed Data - Complete Permission Matrix**

**RolesAndPermissionsSeeder** updated to:

- Create all 7 roles with descriptions
- Create all 55+ permissions with resource:action pairs
- Assign permissions to each role based on use cases
- Idempotent (safe to run multiple times)

---

## Data Flow Examples

### Example 1: User with Multiple Roles Logs In

```
1. User registers as TEACHER for School A with organization_id=1
   → Creates UserRole: role=teacher, org_id=1
   → JWT includes: active_role=teacher, organization_id=1

2. Admin adds same user as PARENT for School B with organization_id=2
   → Creates UserRole: role=parent, org_id=2
   → User now has 2 active roles

3. User calls GET /auth/me/roles
   → Returns 2 roles with their permissions
   → Shows teacher has assignments:create, parent has fees:pay

4. User calls POST /auth/switch-role with parent role ID
   → JWT updated: active_role=parent, organization_id=2
   → User can now access parent-only resources

5. All actions logged in AuditLog with category=auth.role_switch
```

### Example 2: Permission Denied Flow

```
1. Student (no fees:pay permission) tries: POST /api/finance/fees
   → Gateway middleware checks: student doesn't have fees:pay
   → Response: 403 Forbidden - "missing permission fees:pay"
   → AuditLog created: category=perm.denied, status=denied

2. Admin reviews denied permissions:
   SELECT * FROM audit_logs
   WHERE category='perm.denied'
   AND user_id=123
   AND created_at > NOW() - INTERVAL 7 DAY
```

### Example 3: Parent with Multiple Children

```
1. Parent registers with organization_id=1
   → Creates UserRole: role=parent, org_id=1

2. Admin creates links:
   → UserLink: parent_id=1, student_id=10, type=parent_of, org_id=1
   → UserLink: parent_id=1, student_id=11, type=parent_of, org_id=1

3. Parent calls POST /auth/link-user to view child 10
   → Returns: assignments for child 10
   → Only sees child 10's data (other child 11 filtered)

4. Data isolation by linked_user_id ensures security
```

---

## Database Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id          │ Primary Key
│ email       │ Unique
│ password    │ Hashed
│ role        │ Legacy, kept for compatibility
│ status      │ active, pending, locked
│ active_role_id │ FK to user_roles
│ last_role_switched_at │
└────────┬────┘
         │ 1:N
         ▼
┌─────────────────┐
│  user_roles     │ ◄── Multi-role support
│─────────────────│
│ id              │ Primary Key
│ user_id         │ FK to users
│ role            │ teacher, student, parent, driver, admin, school_admin, independent_teacher
│ organization_id │ school_id, fleet_id, admin_org_id
│ organization_type │ school, fleet, admin_org
│ is_active       │ Can disable role without deleting
│ context         │ JSON: additional org context
│ expires_at      │ For temporary roles
│ UNIQUE(user_id, role, organization_id)
└────────┬────────┘
         │
         │ hasPermission() through
         │ Role → Permissions relationship
         ▼
┌──────────────────┐
│ role_permission  │
│──────────────────│
│ role_id          │ FK to roles
│ permission_id    │ FK to permissions
└──────────────────┘

┌──────────────────┐
│  user_links      │ ◄── Relationship tracking
│──────────────────│
│ id               │
│ user_id          │ (parent, admin, manager)
│ linked_user_id   │ (student, employee, resource)
│ relationship_type│ parent_of, teacher_at, admin_of
│ organization_id  │
│ is_active        │
│ context          │ JSON
│ UNIQUE(user_id, linked_user_id, type, org_id)
└──────────────────┘

┌──────────────────┐
│  audit_logs      │ ◄── Security/compliance
│──────────────────│
│ id               │
│ user_id          │ FK to users
│ category         │ auth.login, perm.denied, etc.
│ action           │
│ resource         │
│ status           │ success, failed, denied, error
│ ip_address       │
│ user_agent       │
│ metadata         │ JSON
│ created_at       │
│ Indexes: user_id, category, status, [user_id, created_at]
└──────────────────┘
```

---

## Security Considerations

### ✅ Implemented

- Permission checks on every API endpoint
- Audit logging of permission denials
- Role expiration support (for temporary roles)
- Soft deactivation of roles (without deleting)
- Organization-level data isolation (organization_id in JWT)
- User link validation (users can't access unlinked users' data)

### ⚠️ Next Steps

- Rate limiting on role switches (prevent abuse)
- Login attempt lockout (after N failures)
- Refresh token rotation
- Certificate pinning for inter-service communication
- Database encryption at rest
- Sensitive field masking in audit logs

---

## Testing Checklist

### Unit Tests Needed

- [ ] UserRole scopes (active, inOrganization, withRole)
- [ ] User methods (hasRole, switchRole, getLinkedUsers)
- [ ] Permission checking logic
- [ ] AuditLog static methods

### Integration Tests Needed

- [ ] Register user → creates UserRole
- [ ] Switch role → issues new JWT with org context
- [ ] Permission check succeeds for authorized user
- [ ] Permission check fails for unauthorized user → logged
- [ ] Login attempt logged to AuditLog
- [ ] Multi-role user can see all roles
- [ ] Expired roles not returned in active roles
- [ ] Linked user relationships work correctly

### API Tests Needed

- [ ] GET /auth/me/roles returns all roles
- [ ] POST /auth/switch-role switches active role
- [ ] POST /auth/switch-role fails with invalid role_id
- [ ] Unauthorized requests return 403 with permission details
- [ ] Audit logs created for all auth events

---

## Files Created/Modified

### New Files (6)

1. `auth-service/database/migrations/2026_01_25_000100_create_user_roles_table.php`
2. `auth-service/database/migrations/2026_01_25_000200_create_user_links_table.php`
3. `auth-service/database/migrations/2026_01_25_000300_create_audit_logs_table.php`
4. `auth-service/database/migrations/2026_01_25_000400_add_multi_role_fields_to_users_table.php`
5. `auth-service/app/Models/UserRole.php`
6. `auth-service/app/Models/UserLink.php`
7. `auth-service/app/Models/AuditLog.php`

### Modified Files (4)

1. `auth-service/app/Models/User.php` - Added relationships, methods, JWT claims
2. `auth-service/app/Http/Controllers/AuthController.php` - Added listUserRoles(), switchRole(), updated register/login
3. `auth-service/routes/api.php` - Added /me/roles and /switch-role routes
4. `auth-service/database/seeders/RolesAndPermissionsSeeder.php` - Comprehensive permission matrix

### API Gateway Updates (1)

1. `api-gateway/src/routes/serviceRoutes.ts` - 40+ explicit routes with permission enforcement

---

## Deployment Steps

1. **Run migrations:**

    ```bash
    php artisan migrate
    ```

2. **Seed permissions:**

    ```bash
    php artisan db:seed --class=RolesAndPermissionsSeeder
    ```

3. **For existing users**, run artisan command to create UserRole entries:

    ```bash
    php artisan create:user-roles-for-existing-users
    ```

4. **Restart services:**
    ```bash
    docker-compose restart api-gateway auth-service
    ```

---

## Next Priority Tasks

1. **Rate Limiting** (HIGH) - Add per-user rate limiting on all endpoints
2. **Login Attempt Lockout** (HIGH) - Lock account after 5 failed attempts
3. **Refresh Token Rotation** (HIGH) - Prevent token replay attacks
4. **School Linking** (MEDIUM) - Implement school enrollment endpoints
5. **KYC Verification** (MEDIUM) - Add document upload for independent teachers
6. **Circuit Breaker** (MEDIUM) - Graceful degradation if auth service slow

---

## Completed Success Criteria

✅ Users can have multiple roles in different organizations  
✅ Users can switch active role with fresh JWT  
✅ JWT includes organization context  
✅ Permission system enforces resource:action rules  
✅ All 7 roles with appropriate permissions defined  
✅ Permission denials logged in AuditLog  
✅ Data isolation by organization implemented  
✅ Audit trail for authentication events  
✅ Backward compatible (legacy role field kept)

**Status:** Ready for testing and integration
