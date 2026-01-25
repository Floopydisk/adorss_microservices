<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Establishes relationships between users:
     * - Parent linked to Student
     * - Teacher linked to School
     * - Driver linked to Fleet/School
     * - Admin linked to Organization
     */
    public function up(): void
    {
        Schema::create('user_links', function (Blueprint $table) {
            $table->id();

            // User A (the one doing the linking - parent, fleet manager, admin, etc.)
            $table->unsignedBigInteger('user_id');

            // User B (the one being linked to - student, driver, teacher, etc.)
            $table->unsignedBigInteger('linked_user_id');

            // Type of relationship: parent_of, teacher_at, driver_for, fleet_manager, admin_of, etc.
            $table->string('relationship_type');

            // Organization context (school_id, fleet_id, etc.)
            $table->nullableUnsignedBigInteger('organization_id');
            $table->string('organization_type')->default('school');

            // Is this link active? (parent might deactivate monitoring a child)
            $table->boolean('is_active')->default(true);

            // Additional context (class_section, route_id, etc.)
            $table->json('context')->nullable();

            // Timestamps
            $table->timestamp('linked_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Relationships
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('cascade');

            $table->foreign('linked_user_id')
                ->references('id')->on('users')
                ->onDelete('cascade');

            // Indexes
            $table->index('user_id');
            $table->index('linked_user_id');
            $table->index('relationship_type');
            $table->index('organization_id');
            $table->index(['user_id', 'is_active']);

            // Prevent duplicate links
            $table->unique(['user_id', 'linked_user_id', 'relationship_type', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_links');
    }
};
