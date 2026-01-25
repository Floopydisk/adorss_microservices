<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // All fields already added in migration 2026_01_24_000100
        // This migration is now a no-op to maintain migration history
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['phone']);
            $table->dropColumn([
                'phone_verified',
                'email_verified',
                'email_verification_expires_at',
                'locked',
                'lock_reason',
            ]);
        });
    }
};
