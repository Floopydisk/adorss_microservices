# Multi-Role System - Quick Reference Guide

## Overview

Users can now have **multiple roles** in different organizations (schools, fleets, etc.). Each role has its own set of permissions and organization context.

## Key Concepts

### User Model Changes

- `userRoles()` → Collection of all roles user has
- `activeRoles()` → Only non-expired, active roles
- `getActiveRole()` → Currently active role object
- `linkedUsers()` → Users linked by this user (parents→students)

### New Models

- **UserRole** → Represents user's role in an organization
- **UserLink** → Tracks relationships (parent↔student, teacher↔school)
- **AuditLog** → Security audit trail

## Common Tasks

### Task 1: Create User with Role

```php
// Register user and create UserRole
User::create([
    'name' => 'John Teacher',
    'email' => 'john@school.com',
    'password' => Hash::make('password'),
    'role' => 'teacher',
    'status' => 'active',
]);

// UserRole is auto-created during registration with organization_id
POST /auth/register
{
  "name": "John Teacher",
  "email": "john@school.com",
  "password": "password",
  "role": "teacher",
  "organization_id": 1,
  "organization_type": "school"
}
```

### Task 2: Check if User Has Role

```php
$user = User::find(1);

// Check single role
if ($user->hasRole('teacher', organization_id: 1)) {
    // User is teacher in school 1
}

// Check any of multiple roles
if ($user->hasAnyRole(['teacher', 'school_admin'])) {
    // User has at least one of these roles
}

// Get all roles for user
$roles = $user->getAllRoles();
foreach ($roles as $role) {
    echo $role->role; // 'teacher', 'parent', etc.
    echo $role->organization_id; // Which school/fleet
}
```

### Task 3: Switch Active Role

```php
// From API
POST /auth/switch-role
{
  "user_role_id": 5
}

// Response includes new JWT token with switched role
{
  "success": true,
  "active_role": "parent",
  "token": "eyJ0eXAi...",
  "expires_in": 3600
}

// From controller
$user = Auth::user();
$user->switchRole($userRoleId);
$newToken = JWTAuth::fromUser($user); // New token with switched role
```

### Task 4: Assign New Role to User

```php
// User gets added as parent in different school
$user = User::find(1);

$userRole = $user->userRoles()->create([
    'role' => 'parent',
    'organization_id' => 2, // School 2
    'organization_type' => 'school',
    'is_active' => true,
]);

// User now has 2 roles:
// - teacher in school 1
// - parent in school 2
```

### Task 5: Link Users (Parent→Student, etc.)

```php
// Parent links to student (establishes monitoring relationship)
$parent = User::find(1);
$student = User::find(10);

$parent->linkUser(
    linkedUser: $student,
    relationshipType: 'parent_of',
    organizationId: 1,
    organizationType: 'school'
);

// Later: Get linked users
$myStudents = $parent->getLinkedUsers('parent_of', organizationId: 1);
foreach ($myStudents as $student) {
    // Access child's data
}
```

### Task 6: Deactivate Role (Soft Delete)

```php
$user = User::find(1);
$role = $user->activeRoles()->first();

$role->deactivate(); // is_active = false
// Role still exists but not returned by activeRoles()

$role->activate(); // Re-enable if needed
```

### Task 7: Create Temporary Role (with Expiry)

```php
$user = User::find(1);

// Give temporary admin access for 7 days
$user->userRoles()->create([
    'role' => 'admin',
    'organization_id' => 1,
    'organization_type' => 'school',
    'is_active' => true,
    'expires_at' => now()->addDays(7),
]);

// On next login, expired roles won't be in JWT
```

### Task 8: Check Permissions

```php
// Controller
$user = Auth::user();

// Method 1: Direct check
if ($user->hasPermission('assignments', 'create')) {
    // Can create assignments
}

// Method 2: Check with active role
$activeRole = $user->getActiveRole();
if ($activeRole->hasPermission('assignments', 'create')) {
    // Active role allows it
}

// Method 3: From API (let gateway handle it)
// Gateway middleware checks permissions automatically
```

### Task 9: View User's Roles (API)

```bash
# Get all roles for authenticated user
curl -X GET http://localhost:3000/auth/me/roles \
  -H "Authorization: Bearer $TOKEN"

# Response:
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
      "permissions": [
        {
          "resource": "assignments",
          "action": "create"
        },
        ...
      ]
    },
    {
      "id": 6,
      "role": "parent",
      "is_active": false,
      "organization_id": 2,
      "organization_type": "school",
      "permissions": [...]
    }
  ]
}
```

### Task 10: Log Custom Audit Event

```php
// Log any auth-related event
AuditLog::logSuccess(
    userId: $user->id,
    category: 'auth.role_switch',
    action: 'switched_to_parent',
    resource: 'user_roles',
    metadata: [
        'from_role' => 'teacher',
        'to_role' => 'parent',
        'organization_id' => 2,
    ]
);

// Query audit logs
$logs = AuditLog::forUser($userId)
    ->withCategory('auth.login')
    ->failed()
    ->latest()
    ->limit(10)
    ->get();
```

## JWT Token Structure

**Before multi-role:**

```json
{
    "sub": 1,
    "role": "teacher",
    "email": "john@school.com",
    "status": "active",
    "school_id": 1,
    "phone_verified": true,
    "email_verified": true,
    "iat": 1705046400,
    "exp": 1705050000
}
```

**After multi-role:**

```json
{
    "sub": 1,
    "role": "teacher",
    "email": "john@school.com",
    "status": "active",
    "school_id": 1,
    "phone_verified": true,
    "email_verified": true,
    "active_role": "teacher",
    "active_role_id": 5,
    "organization_id": 1,
    "organization_type": "school",
    "role_context": {
        "organization_id": 1,
        "organization_type": "school"
    },
    "has_multiple_roles": true,
    "iat": 1705046400,
    "exp": 1705050000
}
```

## Permission Matrix

### Teacher Permissions

- ✅ assignments: create, read, update
- ✅ grades: create, read, update
- ✅ attendance: create, read, update
- ✅ results: read, create
- ✅ classes: read
- ✅ students: read
- ✅ messages: create, read
- ✅ marketplace: offer (independent teaching)
- ❌ fees: cannot manage school fees
- ❌ users: cannot manage other users

### Parent Permissions

- ✅ assignments: read
- ✅ grades: read
- ✅ attendance: read
- ✅ results: read
- ✅ fees: read, pay
- ✅ payments: read
- ✅ receipts: read, download
- ✅ location: read (child location tracking)
- ✅ messages: create, read
- ✅ marketplace: book (hire tutors)
- ❌ assignments: cannot create
- ❌ grades: cannot modify

### Student Permissions

- ✅ assignments: read
- ✅ grades: read
- ✅ attendance: read
- ✅ results: read
- ✅ timetable: read
- ✅ messages: create, read
- ✅ notifications: read, dismiss
- ✅ marketplace: book (hire tutors)
- ❌ assignments: cannot grade others
- ❌ fees: cannot view fee details

### School Admin Permissions

- ✅ students: create, read, update
- ✅ teachers: create, read, update
- ✅ classes: read, manage
- ✅ timetable: create, read, update
- ✅ fees: read, manage
- ✅ analytics: read, export
- ✅ school: read, manage
- ✅ audit: read
- ✅ announcements: create, read
- ❌ users: cannot lock accounts (admin only)

### Driver Permissions

- ✅ routes: read
- ✅ trips: create, read, update
- ✅ location: broadcast (share location)
- ✅ messages: read
- ✅ notifications: read
- ❌ assignments: no education access
- ❌ fees: no finance access

### Independent Teacher Permissions

- ✅ marketplace: offer (list services)
- ✅ messages: create, read
- ✅ fees: read
- ✅ payments: read (earnings)
- ✅ receipts: read
- ❌ classroom features
- ❌ school admin features

## Audit Log Categories

```
auth.login              → Successful login
auth.login_failed       → Failed login attempt
auth.register           → New account registration
auth.logout             → User logout
auth.role_switch        → User switched active role
auth.token_refresh      → Token refreshed
auth.password_reset     → Password changed
auth.email_verify       → Email verified
auth.phone_verify       → Phone verified
auth.account_locked     → Account locked
auth.account_unlocked   → Account unlocked
perm.denied             → Permission check failed
perm.granted            → Permission granted
user.updated            → User profile changed
user.deleted            → User account deleted
admin.action            → Admin performed action
```

## Migration Checklist

Before going to production:

- [ ] Run `php artisan migrate`
- [ ] Run `php artisan db:seed --class=RolesAndPermissionsSeeder`
- [ ] Create UserRole entries for existing users
- [ ] Test: Register user → creates UserRole
- [ ] Test: Switch role → new JWT with org context
- [ ] Test: Permission checks on each endpoint
- [ ] Test: Audit logs created for all auth events
- [ ] Verify: Multi-role users can see all roles via API
- [ ] Verify: Parent can link to student
- [ ] Verify: Expired roles not returned in activeRoles()

## Troubleshooting

### User can't access endpoint they should be able to

1. Check user's active role: `User::find(id)->getActiveRole()`
2. Check role has permission: `$userRole->hasPermission('resource', 'action')`
3. Check permission exists in DB: `Permission::where('resource', 'resource')->where('action', 'action')->first()`
4. Check role_permission table: `RolePermission::where('role_id', id)->get()`

### User says they have multiple roles but can only use one

- They need to call `POST /auth/switch-role` to switch active role
- App should show "Pick your role" screen after login if `has_multiple_roles=true`

### Audit logs not being created

- Check AuditLog model can be accessed: `AuditLog::count()`
- Verify migrations ran: `php artisan migrate:status`
- Check app is calling `AuditLog::logSuccess()` or `logFailure()`

### Permission denied on endpoint that should work

- Debug: Call `GET /auth/me/roles` to see actual permissions
- Check gateway route enforcement in `serviceRoutes.ts`
- Verify permission matrix in seeder matches actual API usage

## Performance Notes

- UserRole lookups are indexed by: user_id, role, organization_id
- AuditLog queries optimized for: user_id, category, created_at
- Permission checks cached in Memory (HasPermissions trait uses 5-min cache)
- Consider archiving old AuditLogs after 90+ days

---

**Last Updated:** January 25, 2026  
**Status:** Implementation Complete - Ready for Testing
