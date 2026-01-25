<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $roles = [
                ['name' => 'admin', 'description' => 'Administrator'],
                ['name' => 'teacher', 'description' => 'Teacher'],
                ['name' => 'student', 'description' => 'Student'],
                ['name' => 'parent', 'description' => 'Parent/Guardian'],
                ['name' => 'driver', 'description' => 'Driver'],
            ];

            foreach ($roles as $r) {
                Role::firstOrCreate(['name' => $r['name']], ['description' => $r['description']]);
            }

            $permissions = [
                ['name' => 'students.read', 'resource' => 'students', 'action' => 'read', 'description' => 'Read student records'],
                ['name' => 'students.write', 'resource' => 'students', 'action' => 'write', 'description' => 'Create/update student records'],
                ['name' => 'teachers.read', 'resource' => 'teachers', 'action' => 'read', 'description' => 'Read teacher records'],
                ['name' => 'teachers.write', 'resource' => 'teachers', 'action' => 'write', 'description' => 'Create/update teacher records'],
                ['name' => 'finance.read', 'resource' => 'finance', 'action' => 'read', 'description' => 'Read finance records'],
                ['name' => 'finance.write', 'resource' => 'finance', 'action' => 'write', 'description' => 'Update finance records'],
            ];

            $permModels = [];
            foreach ($permissions as $p) {
                $permModels[$p['name']] = Permission::firstOrCreate(
                    ['name' => $p['name']],
                    ['resource' => $p['resource'], 'action' => $p['action'], 'description' => $p['description']]
                );
            }

            // Map admin to all permissions
            $admin = Role::where('name', 'admin')->first();
            if ($admin) {
                $admin->permissions()->syncWithoutDetaching(collect($permModels)->pluck('id')->all());
            }

            // Teacher basic permissions
            $teacher = Role::where('name', 'teacher')->first();
            if ($teacher) {
                $teacher->permissions()->syncWithoutDetaching([
                    $permModels['students.read']->id,
                    $permModels['teachers.read']->id,
                ]);
            }

            // Student
            $student = Role::where('name', 'student')->first();
            if ($student) {
                $student->permissions()->syncWithoutDetaching([
                    $permModels['students.read']->id,
                ]);
            }

            // Parent
            $parent = Role::where('name', 'parent')->first();
            if ($parent) {
                $parent->permissions()->syncWithoutDetaching([
                    $permModels['students.read']->id,
                ]);
            }

            // Driver minimal
            $driver = Role::where('name', 'driver')->first();
            if ($driver) {
                // No default permissions yet
            }
        });
    }
}
