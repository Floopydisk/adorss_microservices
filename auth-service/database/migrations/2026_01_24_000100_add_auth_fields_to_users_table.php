<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->nullable()->after('email');
            $table->boolean('phone_verified')->default(false)->after('phone');
            $table->boolean('email_verified')->default(false)->after('phone_verified');
            $table->timestamp('email_verification_expires_at')->nullable()->after('email_verified');
            $table->string('role')->default('student')->after('email_verification_expires_at');
            $table->string('status')->default('active')->after('role');
            $table->string('school_id')->nullable()->after('status');
            $table->string('verification_status')->default('unverified')->after('school_id');
            $table->text('verification_notes')->nullable()->after('verification_status');
            $table->timestamp('last_login_at')->nullable()->after('verification_notes');
            $table->boolean('locked')->default(false)->after('last_login_at');
            $table->text('lock_reason')->nullable()->after('locked');

            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
            $table->dropColumn([
                'phone',
                'role',
                'status',
                'school_id',
                'verification_status',
                'verification_notes',
                'last_login_at',
            ]);
        });
    }
};
