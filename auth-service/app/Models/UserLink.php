<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * UserLink Model
 * 
 * Represents relationships between users:
 * - Parent linked to Student(s)
 * - Teacher linked to School
 * - Driver linked to Fleet/School
 * - Admin linked to Organization
 */
class UserLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'linked_user_id',
        'relationship_type',
        'organization_id',
        'organization_type',
        'is_active',
        'context',
        'linked_at',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'context' => 'array',
        'linked_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Relationship: User doing the linking (parent, admin, fleet manager, etc.)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: User being linked to (student, driver, teacher, etc.)
     */
    public function linkedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'linked_user_id');
    }

    /**
     * Scope: Get only active links
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope: Get links by relationship type
     */
    public function scopeWithRelationshipType(Builder $query, string $type): Builder
    {
        return $query->where('relationship_type', $type);
    }

    /**
     * Scope: Get links for organization
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
     * Check if link is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Activate link (re-enable monitoring, permissions, etc.)
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate link (pause without deleting)
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Get merged context with organization info
     */
    public function getContext(): array
    {
        return array_merge(
            [
                'organization_id' => $this->organization_id,
                'organization_type' => $this->organization_type,
            ],
            $this->context ?? []
        );
    }
}
