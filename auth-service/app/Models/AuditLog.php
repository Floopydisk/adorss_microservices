<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * AuditLog Model
 * 
 * Comprehensive audit trail for:
 * - Authentication events (login, logout, registration)
 * - Authorization events (permission grants, denials)
 * - User account changes
 * - Admin actions
 * 
 * Used for security compliance, debugging, and forensics
 */
class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category',
        'action',
        'resource',
        'request_data',
        'response_data',
        'status',
        'failure_reason',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Relationship: User who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Get logs for a specific user
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Get logs of specific category
     */
    public function scopeWithCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Get failed attempts
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->whereIn('status', ['failed', 'denied', 'error']);
    }

    /**
     * Scope: Get successful actions
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope: Get logs within date range
     */
    public function scopeWithinDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Get related user info safely (sanitized)
     */
    public function getUserInfo(): array
    {
        return [
            'id' => $this->user_id,
            'name' => $this->user?->name,
            'email' => $this->user?->email,
            'role' => $this->user?->role,
        ];
    }

    /**
     * Log a successful action
     */
    public static function logSuccess(
        $userId,
        string $category,
        string $action,
        string $resource = null,
        array $metadata = []
    ): self {
        return self::create([
            'user_id' => $userId,
            'category' => $category,
            'action' => $action,
            'resource' => $resource,
            'status' => 'success',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a failed action
     */
    public static function logFailure(
        $userId,
        string $category,
        string $action,
        string $reason = null,
        array $metadata = []
    ): self {
        return self::create([
            'user_id' => $userId,
            'category' => $category,
            'action' => $action,
            'status' => 'failed',
            'failure_reason' => $reason,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a denied authorization
     */
    public static function logDenied(
        $userId,
        string $resource,
        string $action,
        array $metadata = []
    ): self {
        return self::create([
            'user_id' => $userId,
            'category' => 'perm.denied',
            'action' => "access_denied",
            'resource' => $resource,
            'status' => 'denied',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a login attempt
     */
    public static function logLoginAttempt($userId, bool $success = true, string $reason = null): self
    {
        return self::create([
            'user_id' => $userId,
            'category' => $success ? 'auth.login' : 'auth.login_failed',
            'action' => $success ? 'login_successful' : 'login_failed',
            'status' => $success ? 'success' : 'failed',
            'failure_reason' => $reason,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
