<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Enables multi-role support: same user can have multiple roles in different organizations.
     * Example: User is teacher in school_id=1 AND parent in school_id=2
     */
    public function up(): void
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();

            // User who has this role
            $table->unsignedBigInteger('user_id');

            // The role name (teacher, student, parent, driver, admin, school_admin, independent_teacher)
            $table->string('role');

            // Organization context: school_id, fleet_id, admin_org_id, etc.
            $table->unsignedBigInteger('organization_id')->nullable()->comment('ID of organization (school, fleet, etc.)');

            // Type of organization: school, fleet, admin_org, independent
            $table->string('organization_type')->default('school')->comment('Type of organization context');

            // Is this the user's active/primary role?
            $table->boolean('is_active')->default(true);

            // Additional context (class_id for teacher, student_id for parent watching, etc.)
            $table->json('context')->nullable()->comment('Additional role-specific context');

            // Metadata
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('expires_at')->nullable()->comment('Role access expiry (e.g., temp admin roles)');
            $table->timestamps();

            // Relationships
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('cascade');

            // Indexes for performance
            $table->index('user_id');
            $table->index('role');
            $table->index('organization_id');
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'role', 'organization_id']);

            // Unique constraint: user can have one active instance of a role per organization
            $table->unique(['user_id', 'role', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};
