<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
     */
    public function isValid(): bool
    {
        return !$this->used && now()->isBefore($this->expires_at);
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
