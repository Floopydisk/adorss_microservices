<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Utils\DevOtpHelper;

class PhoneVerification extends Model
{
    protected $fillable = [
        'phone',
        'otp',
        'expires_at',
        'verified',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'verified' => 'boolean',
    ];

    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at);
    }

    public function isValid(string $otp): bool
    {
        $isExpired = $this->isExpired();
        $isValid = DevOtpHelper::validateOtp($otp, $this->otp, $isExpired);

        // Log the validation attempt
        DevOtpHelper::logOtpValidation(
            $this->phone,
            $otp,
            $otp === DevOtpHelper::DEV_OTP && DevOtpHelper::isDevOtpBypassEnabled(),
            'phone_verification'
        );

        return $isValid;
    }

    public function markVerified(): void
    {
        $this->update([
            'verified' => true,
            'verified_at' => now(),
        ]);
    }
}
