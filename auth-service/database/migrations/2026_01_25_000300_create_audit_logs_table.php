<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Audit trail for authentication and authorization events:
     * - Login attempts (success, failed password, account locked, etc.)
     * - Role switches
     * - Permission checks (denials especially)
     * - Account changes (status, verification, etc.)
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // User performing the action (nullable for system actions)
            $table->unsignedBigInteger('user_id')->nullable();

            // Category of event
            $table->enum('category', [
                'auth.login',           // Successful login
                'auth.login_failed',    // Failed login attempt
                'auth.logout',          // Logout
                'auth.register',        // New account registration
                'auth.token_refresh',   // Token refresh
                'auth.password_reset',  // Password reset
                'auth.email_verify',    // Email verification
                'auth.phone_verify',    // Phone verification
                'auth.role_switch',     // Role switched
                'auth.account_locked',  // Account locked
                'auth.account_unlocked', // Account unlocked
                'perm.denied',          // Permission denied
                'perm.granted',         // Permission granted
                'user.updated',         // User profile updated
                'user.deleted',         // User deleted
                'admin.action',         // Admin action
            ]);

            // Action description
            $table->string('action')->comment('Detailed action name');

            // Resource affected
            $table->string('resource')->nullable()->comment('What was accessed/modified');

            // Request details
            $table->json('request_data')->nullable()->comment('Request payload (sanitized)');
            $table->json('response_data')->nullable()->comment('Response data (sanitized)');

            // Status: success, failed, denied, error
            $table->enum('status', ['success', 'failed', 'denied', 'error'])->default('success');

            // Why it failed (if applicable)
            $table->string('failure_reason')->nullable();

            // IP address
            $table->string('ip_address')->nullable();

            // User agent
            $table->text('user_agent')->nullable();

            // Additional context
            $table->json('metadata')->nullable();

            // Timestamp
            $table->timestamps();

            // Relationships
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('set null');

            // Indexes for queries
            $table->index('user_id');
            $table->index('category');
            $table->index('status');
            $table->index(['user_id', 'created_at']);
            $table->index(['category', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
