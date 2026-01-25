<?php

namespace App\Services;

use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SMSService
{
    private SnsClient $snsClient;

    public function __construct()
    {
        $this->snsClient = new SnsClient([
            'version' => 'latest',
            'region'  => config('aws.default'),
            'credentials' => [
                'key'    => config('aws.access_key_id'),
                'secret' => config('aws.secret_access_key'),
            ],
        ]);
    }

    /**
     * Send OTP via AWS SNS
     * 
     * @param string $phone Phone number (international format: +1234567890)
     * @param string $otp 6-digit OTP code
     * @return bool Success/failure
     */
    public function sendOTP(string $phone, string $otp): bool
    {
        // Check rate limiting (max 3 requests per phone per hour)
        if (!$this->checkRateLimit($phone)) {
            Log::warning("OTP rate limit exceeded for phone: {$phone}");
            return false;
        }

        $message = $this->formatOTPMessage($otp);

        try {
            $result = $this->snsClient->publish([
                'Message' => $message,
                'PhoneNumber' => $phone,
            ]);

            // Log successful send
            Log::info('OTP sent successfully', [
                'phone' => $this->maskPhone($phone),
                'message_id' => $result['MessageId'],
            ]);

            // Increment rate limit counter
            $this->incrementRateLimit($phone);

            return true;
        } catch (AwsException $e) {
            Log::error('Failed to send OTP via AWS SNS', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Unexpected error sending OTP', [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Check if phone has hit rate limit (3 requests per hour)
     */
    private function checkRateLimit(string $phone): bool
    {
        $cacheKey = "sms_rate_limit:{$phone}";
        $count = Cache::get($cacheKey, 0);

        return $count < 3;
    }

    /**
     * Increment rate limit counter
     */
    private function incrementRateLimit(string $phone): void
    {
        $cacheKey = "sms_rate_limit:{$phone}";
        $count = Cache::get($cacheKey, 0);

        // Set cache for 1 hour with incrementing value
        Cache::put($cacheKey, $count + 1, now()->addHour());
    }

    /**
     * Format OTP message
     */
    private function formatOTPMessage(string $otp): string
    {
        return "Your ADORSS verification code is: {$otp}. Valid for 10 minutes. Do not share this code.";
    }

    /**
     * Mask phone for logging (show only last 4 digits)
     */
    private function maskPhone(string $phone): string
    {
        $length = strlen($phone);
        return str_repeat('*', $length - 4) . substr($phone, -4);
    }

    /**
     * Verify phone number format
     */
    public static function isValidPhone(string $phone): bool
    {
        // International format: +1-10 digits
        return (bool) preg_match('/^\+?[1-9]\d{1,14}$/', preg_replace('/\D/', '', $phone));
    }

    /**
     * Check SMS quota and balance (for monitoring)
     */
    public function checkQuota(): array
    {
        try {
            // Note: AWS SNS doesn't provide direct quota checking
            // This is for monitoring purposes
            return [
                'status' => 'active',
                'message' => 'SMS service is active and ready',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}
