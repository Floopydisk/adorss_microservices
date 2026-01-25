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
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'expires_in' => $this->tokenTtlSeconds(),
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
}
