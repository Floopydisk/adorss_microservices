<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private array $allowedRoles = [
        'student',
        'parent',
        'teacher',
        'driver',
        'admin',
        'school_admin',
        'independent_teacher',
    ];

    private function tokenTtlSeconds(): int
    {
        return (int) config('jwt.ttl', 60) * 60;
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:' . implode(',', $this->allowedRoles),
            'phone' => 'nullable|string|max:32',
            'school_id' => 'nullable|string|max:64',
            'organization_id' => 'nullable|integer',
            'organization_type' => 'nullable|string|in:school,fleet,admin_org',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $role = $data['role'];
        $organizationId = $data['organization_id'] ?? null;
        $organizationType = $data['organization_type'] ?? 'school';

        $status = 'active';
        $verificationStatus = 'unverified';

        if (in_array($role, ['driver', 'independent_teacher'], true)) {
            $status = 'pending';
            $verificationStatus = 'pending_verification';
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
            'phone' => $data['phone'] ?? null,
            'school_id' => $data['school_id'] ?? null,
            'status' => $status,
            'verification_status' => $verificationStatus,
        ]);

        // Create UserRole entry
        $userRole = $user->userRoles()->create([
            'role' => $role,
            'organization_id' => $organizationId ?? $data['school_id'] ?? null,
            'organization_type' => $organizationType,
            'is_active' => true,
        ]);

        // Update active_role_id
        $user->update(['active_role_id' => $userRole->id]);

        // Log registration
        \App\Models\AuditLog::logSuccess(
            $user->id,
            'auth.register',
            'account_created',
            null,
            ['role' => $role, 'organization_id' => $organizationId]
        );

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'expires_in' => $this->tokenTtlSeconds(),
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'role' => 'nullable|string|in:' . implode(',', $this->allowedRoles),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $validator->validated();
        $roleConstraint = $credentials['role'] ?? null;

        $user = User::where('email', $credentials['email'])->first();
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if ($roleConstraint && $user->role !== $roleConstraint) {
            return response()->json([
                'success' => false,
                'message' => 'Role mismatch for this account',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account not active',
                'status' => $user->status,
                'verification_status' => $user->verification_status,
            ], 403);
        }

        try {
            $token = JWTAuth::fromUser($user);
            $user->forceFill(['last_login_at' => now()])->save();

            // Log successful login
            \App\Models\AuditLog::logLoginAttempt($user->id, true);
        } catch (JWTException $e) {
            \App\Models\AuditLog::logLoginAttempt($user->id, false, 'Token creation failed');
            return response()->json([
                'success' => false,
                'message' => 'Could not create token',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'access_token' => $token,
            'expires_in' => $this->tokenTtlSeconds(),
        ]);
    }

    /**
     * Check if an email already exists
     * POST /auth/check-email
     */
    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $validator->validated()['email'];
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'success' => true,
            'email' => $email,
            'exists' => $exists,
        ]);
    }

    public function me()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }
            return response()->json([
                'success' => true,
                'user' => $user,
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalid'], 401);
        }
    }

    public function verifyToken()
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            return response()->json([
                'success' => true,
                'claims' => $payload->toArray(),
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalid'], 401);
        }
    }

    public function refresh()
    {
        try {
            $newToken = JWTAuth::parseToken()->refresh();
            return response()->json([
                'success' => true,
                'token' => $newToken,
                'expires_in' => $this->tokenTtlSeconds(),
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token refresh failed'], 401);
        }
    }

    public function logout()
    {
        try {
            JWTAuth::parseToken()->invalidate();
        } catch (JWTException $e) {
            // Even if invalidate fails, tell client to drop token
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out',
        ]);
    }

    /**
     * Get all roles available to authenticated user
     * 
     * Returns list of roles with their organization context and permissions
     * 
     * GET /auth/me/roles
     */
    public function listUserRoles()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }

            $roles = $user->getAllRoles()
                ->map(function ($userRole) {
                    return [
                        'id' => $userRole->id,
                        'role' => $userRole->role,
                        'is_active' => $userRole->is_active,
                        'organization_id' => $userRole->organization_id,
                        'organization_type' => $userRole->organization_type,
                        'context' => $userRole->getOrganizationContext(),
                        'permissions' => $userRole->getPermissions()
                            ->map(fn($p) => [
                                'resource' => $p->resource,
                                'action' => $p->action,
                                'name' => $p->name,
                            ])
                            ->values(),
                        'assigned_at' => $userRole->assigned_at,
                        'expires_at' => $userRole->expires_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'count' => $roles->count(),
                'roles' => $roles,
                'active_role' => $user->getActiveRole()?->id,
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalid'], 401);
        }
    }

    /**
     * Switch to a different role
     * 
     * User can only switch to roles they already have.
     * Issues new JWT token with switched role context.
     * 
     * POST /auth/switch-role
     * 
     * Request:
     * {
     *   "user_role_id": 123
     * }
     */
    public function switchRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_role_id' => 'required|integer|exists:user_roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not found'], 404);
            }

            $userRoleId = $request->input('user_role_id');

            // Verify user actually has this role
            $userRole = $user->activeRoles()->find($userRoleId);
            if (!$userRole) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found or not active for this user',
                ], 403);
            }

            // Switch role
            if (!$user->switchRole($userRoleId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to switch role',
                ], 500);
            }

            // Issue new token with new role context
            $newToken = JWTAuth::fromUser($user);

            // Log role switch
            \App\Models\AuditLog::logSuccess(
                $user->id,
                'auth.role_switch',
                'role_switched',
                null,
                [
                    'from_role_id' => null,
                    'to_role_id' => $userRoleId,
                    'to_role_name' => $userRole->role,
                    'organization_id' => $userRole->organization_id,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Role switched successfully',
                'active_role' => $userRole->role,
                'organization_id' => $userRole->organization_id,
                'organization_type' => $userRole->organization_type,
                'token' => $newToken,
                'expires_in' => $this->tokenTtlSeconds(),
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalid'], 401);
        }
    }
}
