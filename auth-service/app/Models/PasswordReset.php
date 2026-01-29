<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Utils\DevOtpHelper;

class PasswordReset extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'used',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'used' => 'boolean',
    ];

    /**
     * Check if the token is valid (not expired and not used)
     * 
     * In development mode, also accepts static OTP "123456" as valid token
     * to bypass email-based password reset when notification system is down.
     */
    public function isValid(): bool
    {
        // Development mode: Token format "123456" bypasses expiration
        if (DevOtpHelper::isDevOtpBypassEnabled() && $this->token === DevOtpHelper::DEV_OTP) {
            DevOtpHelper::logOtpValidation(
                $this->email,
                DevOtpHelper::DEV_OTP,
                true,
                'password_reset'
            );
            return true; // Bypass used/expired checks for dev
        }

        // Normal validation: Token must not be used and must not be expired
        $isValid = !$this->used && now()->isBefore($this->expires_at);

        // Log token validation attempt
        if ($isValid) {
            DevOtpHelper::logOtpValidation(
                $this->email,
                $this->token,
                false,
                'password_reset'
            );
        }

        return $isValid;
    }

    /**
     * Mark the token as used
     */
    public function markUsed(): void
    {
        $this->update([
            'used' => true,
            'used_at' => now(),
        ]);
    }

    /**
     * Get the user associated with this password reset
     */
    public function user()
    {
        return User::where('email', $this->email)->first();
    }

    /**
     * Scope to find valid tokens
     */
    public function scopeValid($query)
    {
        return $query->where('used', false)
            ->where('expires_at', '>', now());
    }

    /**
     * Scope to find by email
     */
    public function scopeForEmail($query, string $email)
    {
        return $query->where('email', $email);
    }
}
