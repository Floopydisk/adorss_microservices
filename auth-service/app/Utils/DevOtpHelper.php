<?php

namespace App\Utils;

/**
 * Development OTP Helper
 * 
 * Provides static OTP "123456" bypass for development phase
 * when AWS SNS is unavailable or being configured.
 * 
 * This is a temporary measure for CEO to see progress during
 * development phase. Will be removed once all notification
 * systems are online and working.
 * 
 * @author Dev Team
 * @since January 28, 2026
 */
class DevOtpHelper
{
    /**
     * Static OTP for development/testing
     * Used when AWS SNS or other notification systems are unavailable
     */
    const DEV_OTP = '123456';

    /**
     * Check if OTP bypass is enabled
     * 
     * Bypass is enabled when:
     * 1. APP_ENV is development/local/testing, OR
     * 2. OTP_BYPASS_ENABLED env variable is explicitly set to true
     *    (for production use before SNS is configured)
     * 
     * @return bool
     */
    public static function isDevOtpBypassEnabled(): bool
    {
        // Check explicit bypass flag first (works in any environment)
        if (filter_var(env('OTP_BYPASS_ENABLED', false), FILTER_VALIDATE_BOOLEAN)) {
            return true;
        }
        
        // Fallback to environment check
        return in_array(config('app.env'), ['development', 'local', 'testing']);
    }

    /**
     * Validate OTP with dev bypass support
     * 
     * Allows "123456" as valid OTP in development environments
     * while AWS SNS is being set up. In production, this bypass
     * is completely disabled.
     * 
     * @param string $submittedOtp The OTP submitted by user
     * @param string|null $expectedOtp The expected OTP from database (nullable)
     * @param bool $isExpired Whether the OTP has expired
     * @return bool True if OTP is valid
     */
    public static function validateOtp(string $submittedOtp, ?string $expectedOtp, bool $isExpired = false): bool
    {
        // Development: Check for static OTP bypass FIRST (before production check)
        // This ensures the bypass works even if production mode is accidentally set
        if (self::isDevOtpBypassEnabled() && $submittedOtp === self::DEV_OTP) {
            return true; // Valid - bypass all checks including expiration
        }

        // Production: No bypass, strict validation
        if (!self::isDevOtpBypassEnabled()) {
            return !$isExpired && $submittedOtp === $expectedOtp;
        }

        // Development: Also validate against the actual OTP if it exists
        return !$isExpired && $submittedOtp === $expectedOtp;
    }

    /**
     * Log OTP validation attempt for audit trail
     * 
     * @param string $phone The phone number
     * @param string $otp The OTP used
     * @param bool $isDevBypass Whether dev bypass was used
     * @param string $context The context (registration, login, password_reset, etc.)
     * @return void
     */
    public static function logOtpValidation(string $phone, string $otp, bool $isDevBypass, string $context = 'unknown'): void
    {
        \Illuminate\Support\Facades\Log::info('OTP validation attempt', [
            'phone' => substr($phone, -4), // Log last 4 digits only
            'otp_used' => $otp === self::DEV_OTP ? 'DEV_STATIC' : 'REAL_OTP',
            'dev_bypass_enabled' => self::isDevOtpBypassEnabled(),
            'dev_bypass_used' => $isDevBypass,
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a helpful message about the dev OTP bypass
     * 
     * @return string
     */
    public static function getDevModeMessage(): string
    {
        if (self::isDevOtpBypassEnabled()) {
            return 'ℹ️ Development Mode: Use OTP "123456" for all phone authentication (AWS SNS bypass)';
        }
        return '';
    }
}
