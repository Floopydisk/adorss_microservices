<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'last_role_switched_at',
        'active_role_id',
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
            'last_role_switched_at' => 'datetime',
            'password' => 'hashed',
            'phone_verified' => 'boolean',
            'email_verified' => 'boolean',
            'locked' => 'boolean',
        ];
    }

    /**
     * Relationship: User's multiple roles in different organizations
     */
    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * Relationship: Get active user roles only
     */
    public function activeRoles(): HasMany
    {
        return $this->userRoles()->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Relationship: Links to other users (parent→student, admin→users, etc.)
     */
    public function linkedUsers(): HasMany
    {
        return $this->hasMany(UserLink::class);
    }

    /**
     * Relationship: Users who linked to this user (students whose parent is this user, etc.)
     */
    public function linkedBy(): HasMany
    {
        return $this->hasMany(UserLink::class, 'linked_user_id');
    }

    /**
     * Relationship: Audit logs for this user
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class)->latest();
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
        // Get active role - use the most recently switched or first active
        $activeRole = $this->activeRoles()->first();

        $claims = [
            'role' => $this->role,
            'email' => $this->email,
            'status' => $this->status,
            'school_id' => $this->school_id,
            'phone_verified' => $this->phone_verified,
            'email_verified' => $this->email_verified,
            'has_multiple_roles' => $this->activeRoles()->count() > 1,
        ];

        // Add active role context if it exists
        if ($activeRole) {
            $claims['active_role'] = $activeRole->role;
            $claims['active_role_id'] = $activeRole->id;
            $claims['organization_id'] = $activeRole->organization_id;
            $claims['organization_type'] = $activeRole->organization_type;
            $claims['role_context'] = $activeRole->getOrganizationContext();
        }

        return $claims;
    }

    public function emailVerification()
    {
        return $this->hasOne(EmailVerification::class, 'email', 'email');
    }

    /**
     * Get all available roles for this user
     */
    public function getAllRoles(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->activeRoles()->get();
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleName, ?int $organizationId = null): bool
    {
        $query = $this->activeRoles()->where('role', $roleName);

        if ($organizationId !== null) {
            $query->where('organization_id', $organizationId);
        }

        return $query->exists();
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roles, ?int $organizationId = null): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role, $organizationId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get user's active role
     */
    public function getActiveRole(): ?UserRole
    {
        return $this->activeRoles()->first();
    }

    /**
     * Switch to a different role
     */
    public function switchRole(int $userRoleId): bool
    {
        $userRole = $this->activeRoles()->find($userRoleId);

        if (!$userRole) {
            return false;
        }

        // Deactivate all other roles
        $this->activeRoles()
            ->where('id', '!=', $userRoleId)
            ->update(['is_active' => false]);

        // Activate this role
        $userRole->update(['is_active' => true]);

        // Update timestamp
        $this->update(['last_role_switched_at' => now()]);

        return true;
    }

    /**
     * Link this user to another user (parent→student, admin→org, etc.)
     */
    public function linkUser(
        User $linkedUser,
        string $relationshipType,
        ?int $organizationId = null,
        string $organizationType = 'school',
        ?array $context = null
    ): UserLink {
        return $this->linkedUsers()->create([
            'linked_user_id' => $linkedUser->id,
            'relationship_type' => $relationshipType,
            'organization_id' => $organizationId,
            'organization_type' => $organizationType,
            'context' => $context,
        ]);
    }

    /**
     * Get linked users of a specific type
     */
    public function getLinkedUsers(string $relationshipType, ?int $organizationId = null)
    {
        $query = $this->linkedUsers()
            ->where('relationship_type', $relationshipType)
            ->active();

        if ($organizationId !== null) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get()->map->linkedUser;
    }
}
