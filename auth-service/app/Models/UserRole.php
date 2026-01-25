<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * UserRole Model
 * 
 * Represents a user's role within an organization context.
 * A user can have multiple roles (teacher in school A, parent in school A & B, etc.)
 */
class UserRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'role',
        'organization_id',
        'organization_type',
        'is_active',
        'context',
        'assigned_at',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'context' => 'array',
        'assigned_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Relationship: User who has this role
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Get only active roles
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                // Include roles with no expiry OR expiry in the future
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope: Get roles for a specific organization
     */
    public function scopeInOrganization(Builder $query, ?int $organizationId, string $organizationType = 'school'): Builder
    {
        if ($organizationId === null) {
            return $query->whereNull('organization_id');
        }
        return $query->where('organization_id', $organizationId)
            ->where('organization_type', $organizationType);
    }

    /**
     * Scope: Get roles of a specific type
     */
    public function scopeWithRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    /**
     * Get permissions for this role
     */
    public function getPermissions()
    {
        $role = Role::where('name', $this->role)->with('permissions')->first();
        return $role ? $role->permissions : collect();
    }

    /**
     * Check if this role has specific permission
     */
    public function hasPermission(string $resource, string $action): bool
    {
        $permissions = $this->getPermissions();
        return $permissions->contains(function ($perm) use ($resource, $action) {
            return strtolower($perm->resource . ':' . $perm->action) === strtolower($resource . ':' . $action);
        });
    }

    /**
     * Get organization-specific context
     */
    public function getOrganizationContext(): array
    {
        return array_merge(
            [
                'organization_id' => $this->organization_id,
                'organization_type' => $this->organization_type,
            ],
            $this->context ?? []
        );
    }

    /**
     * Check if role is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Activate this role
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate this role
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}
