<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PhoneVerification;
use App\Models\EmailVerification;
use App\Services\SMSService;
use App\Jobs\SendEmailVerification;
use App\Utils\DevOtpHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

class PhoneAuthController extends Controller
{
    private function tokenTtlSeconds(): int
    {
        return (int) config('jwt.ttl', 60) * 60;
    }

    /**
     * Step 1: Request OTP for phone number
     * POST /auth/phone/request-otp
     */
    public function requestOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|regex:/^[0-9+\-() ]{7,20}$/',
            'role' => 'required|string|in:student,parent,teacher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $role = $request->input('role');

        // Check if phone already registered for this role
        $existingUser = User::where('phone', $phone)
            ->where('role', $role)
            ->first();

        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number already registered for this role',
            ], 409);
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        PhoneVerification::updateOrCreate(
            ['phone' => $phone],
            [
                'otp' => $otp,
                'expires_at' => $expiresAt,
                'verified' => false,
                'verified_at' => null,
            ]
        );

        // Send OTP via AWS SNS
        $smsService = new SMSService();
        $smsSent = $smsService->sendOTP($phone, $otp);

        if (!$smsSent) {
            Log::error('Failed to send OTP for phone registration', [
                'phone' => substr($phone, -4),
                'role' => $role,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your phone. It will expire in 10 minutes.',
            'expires_in_minutes' => 10,
        ]);
    }

    /**
     * Step 2: Verify OTP and get temporary registration token
     * POST /auth/phone/verify-otp
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'otp' => 'required|string|size:6',
            'role' => 'required|string|in:student,parent,teacher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $otp = $request->input('otp');

        // Development bypass: Allow static OTP without DB record
        if (DevOtpHelper::isDevOtpBypassEnabled() && $otp === DevOtpHelper::DEV_OTP) {
            Log::info('🔓 [DEV MODE] OTP verification bypassed with static OTP', [
                'phone' => substr($phone, -4),
                'otp' => 'DEV_STATIC',
            ]);

            // Try to create verification record, but don't fail if DB is unavailable
            try {
                PhoneVerification::updateOrCreate(
                    ['phone' => $phone],
                    [
                        'otp' => DevOtpHelper::DEV_OTP,
                        'expires_at' => now()->addMinutes(10),
                        'verified' => true,
                        'verified_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('🔓 [DEV MODE] Could not save verification record (DB offline?)', [
                    'phone' => substr($phone, -4),
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            // Normal flow: Check DB record
            $phoneVerification = PhoneVerification::where('phone', $phone)->first();

            if (!$phoneVerification) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP not found or expired. Request a new one.',
                ], 404);
            }

            if (!$phoneVerification->isValid($otp)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 401);
            }

            $phoneVerification->markVerified();
        }

        $tempToken = Str::random(64);
        cache()->put('phone_auth:' . $tempToken, [
            'phone' => $request->input('phone'),
            'role' => $request->input('role'),
        ], now()->addMinutes(30));

        return response()->json([
            'success' => true,
            'message' => 'OTP verified',
            'registration_token' => $tempToken,
        ]);
    }

    /**
     * Step 3: Complete registration with email, name, and password
     * POST /auth/phone/complete-registration
     */
    public function completeRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'registration_token' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $regToken = $request->input('registration_token');
        $tempData = cache()->get('phone_auth:' . $regToken);

        if (!$tempData) {
            return response()->json([
                'success' => false,
                'message' => 'Registration token invalid or expired',
            ], 401);
        }

        $phone = $tempData['phone'];
        $role = $tempData['role'];
        $email = $request->input('email');
        $name = $request->input('name');
        $password = $request->input('password');

        // Create user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'phone_verified' => true,
            'password' => Hash::make($password),
            'role' => $role,
            'status' => 'active',
            'email_verified' => false,
            'email_verification_expires_at' => now()->addDays(7),
        ]);

        // Create email verification record
        $verificationToken = Str::random(64);
        EmailVerification::create([
            'email' => $email,
            'token' => $verificationToken,
            'expires_at' => now()->addDays(7),
            'verified' => false,
        ]);

        // Queue email verification link (async)
        SendEmailVerification::dispatch($user, $verificationToken, 7);

        Log::info('User registered successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $role,
        ]);

        // Clear temp registration data
        cache()->forget('phone_auth:' . $regToken);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Registration completed. Verify your email within 7 days.',
            'user' => $user,
            'token' => $token,
            'expires_in' => $this->tokenTtlSeconds(),
            'email_verification_required' => true,
            'email_verification_expires_in_days' => 7,
        ], 201);
    }

    /**
     * Request OTP for Login (validates user exists)
     * POST /auth/phone/request-login-otp
     */
    public function requestLoginOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|regex:/^[0-9+\-() ]{7,20}$/',
            'role' => 'required|string|in:student,parent,teacher,driver,admin,school_admin,independent_teacher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $role = $request->input('role');

        // Check if user exists with this phone and role
        $user = User::where('phone', $phone)
            ->where('role', $role)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found with this phone number and role',
            ], 404);
        }

        // Check if account is locked
        if ($user->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'Account is locked: ' . $user->lock_reason,
            ], 403);
        }

        // Check if account is active
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active',
            ], 403);
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        PhoneVerification::updateOrCreate(
            ['phone' => $phone],
            [
                'otp' => $otp,
                'expires_at' => $expiresAt,
                'verified' => false,
                'verified_at' => null,
            ]
        );

        // Send OTP via AWS SNS
        $smsService = new SMSService();
        $smsSent = $smsService->sendOTP($phone, $otp);

        if (!$smsSent) {
            Log::error('Failed to send OTP for phone login', [
                'phone' => substr($phone, -4),
                'role' => $role,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your phone. It will expire in 10 minutes.',
            'expires_in_minutes' => 10,
        ]);
    }

    /**
     * Phone + OTP Login
     * POST /auth/phone/login
     */
    public function loginWithPhone(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'otp' => 'required|string|size:6',
            'role' => 'required|string|in:student,parent,teacher,driver,admin,school_admin,independent_teacher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->input('phone');
        $otp = $request->input('otp');
        $role = $request->input('role');

        // Development bypass: Allow static OTP without DB record
        $devBypassUsed = false;
        if (DevOtpHelper::isDevOtpBypassEnabled() && $otp === DevOtpHelper::DEV_OTP) {
            Log::info('🔓 [DEV MODE] Login OTP verification bypassed with static OTP', [
                'phone' => substr($phone, -4),
                'otp' => 'DEV_STATIC',
            ]);

            $devBypassUsed = true;

            // Try to create verification record, but don't fail if DB is unavailable
            try {
                PhoneVerification::updateOrCreate(
                    ['phone' => $phone],
                    [
                        'otp' => DevOtpHelper::DEV_OTP,
                        'expires_at' => now()->addMinutes(10),
                        'verified' => true,
                        'verified_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('🔓 [DEV MODE] Could not save verification record (DB offline?)', [
                    'phone' => substr($phone, -4),
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            // Normal flow: Check DB record
            $phoneVerification = PhoneVerification::where('phone', $phone)->first();

            if (!$phoneVerification || !$phoneVerification->isValid($otp)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP',
                ], 401);
            }

            $phoneVerification->markVerified();
        }

        $user = User::where('phone', $phone)
            ->where('role', $role)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        if ($user->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'Account locked: ' . $user->lock_reason,
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active',
            ], 403);
        }

        // Check email verification deadline
        if (!$user->email_verified && $user->email_verification_expires_at && now()->isAfter($user->email_verification_expires_at)) {
            $user->lockForUnverifiedEmail();
            return response()->json([
                'success' => false,
                'message' => 'Account locked due to unverified email (7-day deadline passed)',
            ], 403);
        }

        // Note: phoneVerification->markVerified() is handled above in both dev and normal flows
        $user->update(['last_login_at' => now()]);

        try {
            $token = JWTAuth::fromUser($user);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
            'expires_in' => $this->tokenTtlSeconds(),
        ]);
    }

    /**
     * Verify Email with token
     * POST /auth/verify-email
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $emailVerification = EmailVerification::where('token', $request->input('token'))->first();

        if (!$emailVerification) {
            return response()->json([
                'success' => false,
                'message' => 'Verification token not found',
            ], 404);
        }

        if (!$emailVerification->isValid($request->input('token'))) {
            return response()->json([
                'success' => false,
                'message' => 'Verification token expired',
            ], 401);
        }

        $user = User::where('email', $emailVerification->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $emailVerification->markVerified();
        $user->update([
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        if ($user->isLocked()) {
            $user->unlock();
        }

        Log::info('Email verified successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'user' => $user,
        ]);
    }

    /**
     * Resend email verification link
     * POST /auth/resend-verification-email
     */
    public function resendVerificationEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        // Check rate limiting (max 3 resend requests per hour per email)
        $cacheKey = "resend_verify:{$email}";
        $resendCount = cache()->get($cacheKey, 0);

        if ($resendCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'Too many resend requests. Please try again in 1 hour.',
            ], 429);
        }

        // Check if already verified
        if ($user->email_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email is already verified',
            ], 400);
        }

        // Check if account is locked for non-verification reasons
        if ($user->isLocked() && strpos($user->lock_reason ?? '', 'Email not verified') === false) {
            return response()->json([
                'success' => false,
                'message' => 'Account is locked. Please contact support.',
            ], 403);
        }

        // Create or update email verification record
        $verificationToken = Str::random(64);
        EmailVerification::updateOrCreate(
            ['email' => $email],
            [
                'token' => $verificationToken,
                'expires_at' => now()->addDays(7),
                'verified' => false,
            ]
        );

        // Queue email sending
        SendEmailVerification::dispatch($user, $verificationToken, 7);

        // Increment resend counter
        cache()->put($cacheKey, $resendCount + 1, now()->addHour());

        Log::info('Email verification resent', [
            'user_id' => $user->id,
            'email' => $email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification email sent. Please check your inbox.',
        ]);
    }

    /**
     * Request password reset email
     * POST /auth/forgot-password
     */
    public function forgotPassword(Request $request)
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

        $email = $request->input('email');

        // Rate limiting (max 3 requests per hour per email)
        $cacheKey = "password_reset:{$email}";
        $requestCount = cache()->get($cacheKey, 0);

        if ($requestCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'Too many password reset requests. Please try again in 1 hour.',
            ], 429);
        }

        // Check if user exists
        $user = User::where('email', $email)->first();

        // Always return success to prevent email enumeration
        // But only send email if user exists
        if ($user) {
            // Invalidate any existing reset tokens for this email
            \App\Models\PasswordReset::where('email', $email)
                ->where('used', false)
                ->update(['used' => true, 'used_at' => now()]);

            // Generate new reset token
            $resetToken = Str::random(64);
            $expiresInMinutes = 60;

            \App\Models\PasswordReset::create([
                'email' => $email,
                'token' => $resetToken,
                'expires_at' => now()->addMinutes($expiresInMinutes),
                'used' => false,
            ]);

            // Queue password reset email
            \App\Jobs\SendPasswordReset::dispatch($user, $resetToken, $expiresInMinutes);

            Log::info('Password reset requested', [
                'user_id' => $user->id,
                'email' => $email,
            ]);
        } else {
            Log::info('Password reset requested for non-existent email', [
                'email' => $email,
            ]);
        }

        // Increment rate limit counter
        cache()->put($cacheKey, $requestCount + 1, now()->addHour());

        return response()->json([
            'success' => true,
            'message' => 'If an account exists with this email, you will receive a password reset link shortly.',
        ]);
    }

    /**
     * Reset password with token
     * POST /auth/reset-password
     * 
     * In development mode, accepts dev OTP "123456" as token
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string', // Allow both 64-char tokens and 6-digit dev OTP
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $token = $request->input('token');
        $password = $request->input('password');

        // Find the password reset record
        // In dev mode, also check for dev OTP token
        $passwordReset = \App\Models\PasswordReset::where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset token',
            ], 400);
        }

        if (!$passwordReset->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset token has expired or already been used',
            ], 400);
        }

        // Find the user
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Update the password
        $user->update([
            'password' => Hash::make($password),
        ]);

        // Mark token as used (unless it's the dev bypass OTP)
        if ($token !== \App\Utils\DevOtpHelper::DEV_OTP) {
            $passwordReset->markUsed();

            // Invalidate all other reset tokens for this email
            \App\Models\PasswordReset::where('email', $email)
                ->where('id', '!=', $passwordReset->id)
                ->where('used', false)
                ->update(['used' => true, 'used_at' => now()]);
        }

        Log::info('Password reset successful', [
            'user_id' => $user->id,
            'email' => $email,
            'used_dev_otp' => $token === \App\Utils\DevOtpHelper::DEV_OTP,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully. You can now log in with your new password.',
        ]);
    }
}
