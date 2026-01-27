<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Add multi-role support fields to users table:
     * - active_role_id: References the currently active UserRole
     * - last_role_switched_at: Track when user last switched roles
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('active_role_id')->nullable()
                ->after('school_id')
                ->comment('Currently active role (for faster lookups)');

            $table->timestamp('last_role_switched_at')
                ->nullable()
                ->after('last_login_at')
                ->comment('When user last switched roles');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['active_role_id', 'last_role_switched_at']);
        });
    }
};
