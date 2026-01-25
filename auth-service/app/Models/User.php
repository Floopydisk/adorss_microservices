<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Traits\HasPermissions;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasPermissions;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'status',
        'school_id',
        'verification_status',
        'verification_notes',
        'last_login_at',
        'phone_verified',
        'email_verified',
        'email_verified_at',
        'email_verification_expires_at',
        'locked',
        'lock_reason',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'verification_notes',
        'lock_reason',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'phone_verified' => 'boolean',
            'email_verified' => 'boolean',
            'locked' => 'boolean',
        ];
    }

    public function isLocked(): bool
    {
        return $this->locked === true;
    }

    public function lockForUnverifiedEmail(string $reason = 'Email not verified within 7 days'): void
    {
        $this->update([
            'locked' => true,
            'lock_reason' => $reason,
        ]);
    }

    public function unlock(): void
    {
        $this->update([
            'locked' => false,
            'lock_reason' => null,
        ]);
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'email' => $this->email,
            'status' => $this->status,
            'school_id' => $this->school_id,
            'phone_verified' => $this->phone_verified,
            'email_verified' => $this->email_verified,
        ];
    }

    public function emailVerification()
    {
        return $this->hasOne(EmailVerification::class, 'email', 'email');
    }
}
