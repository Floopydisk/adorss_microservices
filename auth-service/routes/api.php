<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PhoneAuthController;
use App\Http\Controllers\PermissionController;

Route::prefix('auth')->middleware('rate_limit_auth')->group(function () {
    // Legacy email/password registration and login
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('check-email', [AuthController::class, 'checkEmail']);

    // Phone-based registration flow
    Route::prefix('phone')->group(function () {
        Route::post('request-otp', [PhoneAuthController::class, 'requestOtp'])->name('auth.phone.request-otp');
        Route::post('verify-otp', [PhoneAuthController::class, 'verifyOtp']);
        Route::post('complete-registration', [PhoneAuthController::class, 'completeRegistration'])->name('auth.phone.complete-registration');
        Route::post('request-login-otp', [PhoneAuthController::class, 'requestLoginOtp'])->name('auth.phone.request-login-otp');
        Route::post('login', [PhoneAuthController::class, 'loginWithPhone'])->name('auth.phone.login');
    });

    // Email verification (accessible without auth, with rate limiting)
    Route::post('verify-email', [PhoneAuthController::class, 'verifyEmail']);
    Route::post('resend-verification-email', [PhoneAuthController::class, 'resendVerificationEmail']);

    // Password reset (accessible without auth, with rate limiting)
    Route::post('forgot-password', [PhoneAuthController::class, 'forgotPassword'])->name('auth.forgot-password');
    Route::post('reset-password', [PhoneAuthController::class, 'resetPassword'])->name('auth.reset-password');

    // Protected endpoints
    Route::middleware('auth:api')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('verify-token', [AuthController::class, 'verifyToken']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        // Multi-role support endpoints
        Route::get('me/roles', [AuthController::class, 'listUserRoles'])->name('auth.list-roles');
        Route::post('switch-role', [AuthController::class, 'switchRole'])->name('auth.switch-role');

        // RBAC permission utilities
        Route::get('permissions', [PermissionController::class, 'listForUser']);
        Route::post('permissions/check', [PermissionController::class, 'check']);
        Route::post('permissions/check-many', [PermissionController::class, 'checkMany']);
    });
});
