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
            // Create all roles
            $roleData = [
                'admin' => 'Super Administrator - Full system access',
                'school_admin' => 'School Administrator - Manage school, teachers, students',
                'teacher' => 'Teacher - Create assignments, grade, mark attendance',
                'student' => 'Student - View assignments, grades, timetable',
                'parent' => 'Parent/Guardian - Monitor child progress, pay fees',
                'driver' => 'Driver - Transport management, location tracking',
                'independent_teacher' => 'Independent Teacher - Offer lessons in marketplace',
            ];

            $roles = [];
            foreach ($roleData as $name => $description) {
                $roles[$name] = Role::firstOrCreate(
                    ['name' => $name],
                    ['description' => $description]
                );
            }

            // Comprehensive permission matrix
            $permissions = $this->getPermissionMatrix();

            // Create permissions
            $permModels = [];
            foreach ($permissions as $perm) {
                $key = "{$perm['resource']}:{$perm['action']}";
                $permModels[$key] = Permission::firstOrCreate(
                    ['resource' => $perm['resource'], 'action' => $perm['action']],
                    [
                        'name' => $perm['name'] ?? $key,
                        'description' => $perm['description'] ?? "{$perm['action']} {$perm['resource']}",
                    ]
                );
            }

            // Assign permissions to roles based on matrix
            $rolePermissions = $this->getRolePermissionMatrix();

            foreach ($rolePermissions as $roleName => $perms) {
                if (isset($roles[$roleName])) {
                    $permIds = [];
                    foreach ($perms as $perm) {
                        $key = "{$perm['resource']}:{$perm['action']}";
                        if (isset($permModels[$key])) {
                            $permIds[] = $permModels[$key]->id;
                        }
                    }
                    $roles[$roleName]->permissions()->syncWithoutDetaching($permIds);
                }
            }
        });
    }

    /**
     * Get comprehensive permission matrix for the system
     * Organized by resource domain
     */
    private function getPermissionMatrix(): array
    {
        return [
            // Education Service permissions
            ['resource' => 'assignments', 'action' => 'create', 'name' => 'assignments.create', 'description' => 'Create assignments'],
            ['resource' => 'assignments', 'action' => 'read', 'name' => 'assignments.read', 'description' => 'View assignments'],
            ['resource' => 'assignments', 'action' => 'update', 'name' => 'assignments.update', 'description' => 'Update assignments'],
            ['resource' => 'assignments', 'action' => 'delete', 'name' => 'assignments.delete', 'description' => 'Delete assignments'],

            ['resource' => 'grades', 'action' => 'create', 'name' => 'grades.create', 'description' => 'Create grade records'],
            ['resource' => 'grades', 'action' => 'read', 'name' => 'grades.read', 'description' => 'View grades'],
            ['resource' => 'grades', 'action' => 'update', 'name' => 'grades.update', 'description' => 'Update grades'],

            ['resource' => 'attendance', 'action' => 'create', 'name' => 'attendance.create', 'description' => 'Mark attendance'],
            ['resource' => 'attendance', 'action' => 'read', 'name' => 'attendance.read', 'description' => 'View attendance'],
            ['resource' => 'attendance', 'action' => 'update', 'name' => 'attendance.update', 'description' => 'Update attendance'],

            ['resource' => 'timetable', 'action' => 'read', 'name' => 'timetable.read', 'description' => 'View timetable'],
            ['resource' => 'timetable', 'action' => 'create', 'name' => 'timetable.create', 'description' => 'Create timetable'],
            ['resource' => 'timetable', 'action' => 'update', 'name' => 'timetable.update', 'description' => 'Update timetable'],

            ['resource' => 'results', 'action' => 'create', 'name' => 'results.create', 'description' => 'Create exam results'],
            ['resource' => 'results', 'action' => 'read', 'name' => 'results.read', 'description' => 'View results'],
            ['resource' => 'results', 'action' => 'update', 'name' => 'results.update', 'description' => 'Update results'],

            ['resource' => 'classes', 'action' => 'read', 'name' => 'classes.read', 'description' => 'View classes'],
            ['resource' => 'classes', 'action' => 'manage', 'name' => 'classes.manage', 'description' => 'Manage classes'],

            ['resource' => 'students', 'action' => 'read', 'name' => 'students.read', 'description' => 'View student records'],
            ['resource' => 'students', 'action' => 'create', 'name' => 'students.create', 'description' => 'Create student records'],
            ['resource' => 'students', 'action' => 'update', 'name' => 'students.update', 'description' => 'Update student records'],

            ['resource' => 'teachers', 'action' => 'read', 'name' => 'teachers.read', 'description' => 'View teacher records'],
            ['resource' => 'teachers', 'action' => 'create', 'name' => 'teachers.create', 'description' => 'Create teacher records'],
            ['resource' => 'teachers', 'action' => 'update', 'name' => 'teachers.update', 'description' => 'Update teacher records'],
            ['resource' => 'teachers', 'action' => 'verify', 'name' => 'teachers.verify', 'description' => 'Verify teacher qualifications'],

            // Messaging Service permissions
            ['resource' => 'messages', 'action' => 'create', 'name' => 'messages.create', 'description' => 'Send messages'],
            ['resource' => 'messages', 'action' => 'read', 'name' => 'messages.read', 'description' => 'Read messages'],
            ['resource' => 'messages', 'action' => 'delete', 'name' => 'messages.delete', 'description' => 'Delete messages'],

            ['resource' => 'notifications', 'action' => 'read', 'name' => 'notifications.read', 'description' => 'View notifications'],
            ['resource' => 'notifications', 'action' => 'dismiss', 'name' => 'notifications.dismiss', 'description' => 'Dismiss notifications'],

            // Mobility Service permissions
            ['resource' => 'location', 'action' => 'read', 'name' => 'location.read', 'description' => 'View location tracking'],
            ['resource' => 'location', 'action' => 'broadcast', 'name' => 'location.broadcast', 'description' => 'Broadcast location'],

            ['resource' => 'routes', 'action' => 'read', 'name' => 'routes.read', 'description' => 'View routes'],
            ['resource' => 'routes', 'action' => 'manage', 'name' => 'routes.manage', 'description' => 'Manage routes'],

            ['resource' => 'trips', 'action' => 'create', 'name' => 'trips.create', 'description' => 'Create trips'],
            ['resource' => 'trips', 'action' => 'read', 'name' => 'trips.read', 'description' => 'View trips'],
            ['resource' => 'trips', 'action' => 'update', 'name' => 'trips.update', 'description' => 'Update trip status'],

            // Finance Service permissions
            ['resource' => 'fees', 'action' => 'read', 'name' => 'fees.read', 'description' => 'View fee information'],
            ['resource' => 'fees', 'action' => 'pay', 'name' => 'fees.pay', 'description' => 'Pay fees'],
            ['resource' => 'fees', 'action' => 'manage', 'name' => 'fees.manage', 'description' => 'Manage fee structure'],

            ['resource' => 'payments', 'action' => 'create', 'name' => 'payments.create', 'description' => 'Process payments'],
            ['resource' => 'payments', 'action' => 'read', 'name' => 'payments.read', 'description' => 'View payments'],

            ['resource' => 'receipts', 'action' => 'read', 'name' => 'receipts.read', 'description' => 'View receipts'],
            ['resource' => 'receipts', 'action' => 'download', 'name' => 'receipts.download', 'description' => 'Download receipts'],

            // School management permissions
            ['resource' => 'school', 'action' => 'read', 'name' => 'school.read', 'description' => 'View school info'],
            ['resource' => 'school', 'action' => 'manage', 'name' => 'school.manage', 'description' => 'Manage school settings'],

            ['resource' => 'analytics', 'action' => 'read', 'name' => 'analytics.read', 'description' => 'View analytics'],
            ['resource' => 'analytics', 'action' => 'export', 'name' => 'analytics.export', 'description' => 'Export analytics'],

            // Admin permissions
            ['resource' => 'users', 'action' => 'manage', 'name' => 'users.manage', 'description' => 'Manage user accounts'],
            ['resource' => 'users', 'action' => 'verify', 'name' => 'users.verify', 'description' => 'Verify users'],
            ['resource' => 'users', 'action' => 'lock', 'name' => 'users.lock', 'description' => 'Lock/unlock accounts'],

            ['resource' => 'audit', 'action' => 'read', 'name' => 'audit.read', 'description' => 'View audit logs'],

            ['resource' => 'announcements', 'action' => 'create', 'name' => 'announcements.create', 'description' => 'Post announcements'],
            ['resource' => 'announcements', 'action' => 'read', 'name' => 'announcements.read', 'description' => 'View announcements'],

            // Marketplace permissions
            ['resource' => 'marketplace', 'action' => 'read', 'name' => 'marketplace.read', 'description' => 'View marketplace'],
            ['resource' => 'marketplace', 'action' => 'offer', 'name' => 'marketplace.offer', 'description' => 'Offer services'],
            ['resource' => 'marketplace', 'action' => 'book', 'name' => 'marketplace.book', 'description' => 'Book services'],
        ];
    }

    /**
     * Define which roles have which permissions
     * Returns array of role => [permission list]
     */
    private function getRolePermissionMatrix(): array
    {
        return [
            'admin' => [
                // Admin has all permissions
                ['resource' => 'assignments', 'action' => 'create'],
                ['resource' => 'assignments', 'action' => 'read'],
                ['resource' => 'assignments', 'action' => 'update'],
                ['resource' => 'assignments', 'action' => 'delete'],
                ['resource' => 'grades', 'action' => 'create'],
                ['resource' => 'grades', 'action' => 'read'],
                ['resource' => 'grades', 'action' => 'update'],
                ['resource' => 'attendance', 'action' => 'create'],
                ['resource' => 'attendance', 'action' => 'read'],
                ['resource' => 'attendance', 'action' => 'update'],
                ['resource' => 'timetable', 'action' => 'read'],
                ['resource' => 'timetable', 'action' => 'create'],
                ['resource' => 'timetable', 'action' => 'update'],
                ['resource' => 'results', 'action' => 'create'],
                ['resource' => 'results', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'update'],
                ['resource' => 'classes', 'action' => 'read'],
                ['resource' => 'classes', 'action' => 'manage'],
                ['resource' => 'students', 'action' => 'read'],
                ['resource' => 'students', 'action' => 'create'],
                ['resource' => 'students', 'action' => 'update'],
                ['resource' => 'teachers', 'action' => 'read'],
                ['resource' => 'teachers', 'action' => 'create'],
                ['resource' => 'teachers', 'action' => 'update'],
                ['resource' => 'teachers', 'action' => 'verify'],
                ['resource' => 'messages', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'messages', 'action' => 'delete'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'dismiss'],
                ['resource' => 'location', 'action' => 'read'],
                ['resource' => 'location', 'action' => 'broadcast'],
                ['resource' => 'routes', 'action' => 'read'],
                ['resource' => 'routes', 'action' => 'manage'],
                ['resource' => 'trips', 'action' => 'create'],
                ['resource' => 'trips', 'action' => 'read'],
                ['resource' => 'trips', 'action' => 'update'],
                ['resource' => 'fees', 'action' => 'read'],
                ['resource' => 'fees', 'action' => 'pay'],
                ['resource' => 'fees', 'action' => 'manage'],
                ['resource' => 'payments', 'action' => 'create'],
                ['resource' => 'payments', 'action' => 'read'],
                ['resource' => 'receipts', 'action' => 'read'],
                ['resource' => 'receipts', 'action' => 'download'],
                ['resource' => 'school', 'action' => 'read'],
                ['resource' => 'school', 'action' => 'manage'],
                ['resource' => 'analytics', 'action' => 'read'],
                ['resource' => 'analytics', 'action' => 'export'],
                ['resource' => 'users', 'action' => 'manage'],
                ['resource' => 'users', 'action' => 'verify'],
                ['resource' => 'users', 'action' => 'lock'],
                ['resource' => 'audit', 'action' => 'read'],
                ['resource' => 'announcements', 'action' => 'create'],
                ['resource' => 'announcements', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'read'],
            ],

            'school_admin' => [
                // School administrators
                ['resource' => 'students', 'action' => 'read'],
                ['resource' => 'students', 'action' => 'create'],
                ['resource' => 'students', 'action' => 'update'],
                ['resource' => 'teachers', 'action' => 'read'],
                ['resource' => 'teachers', 'action' => 'create'],
                ['resource' => 'teachers', 'action' => 'update'],
                ['resource' => 'classes', 'action' => 'read'],
                ['resource' => 'classes', 'action' => 'manage'],
                ['resource' => 'timetable', 'action' => 'read'],
                ['resource' => 'timetable', 'action' => 'create'],
                ['resource' => 'timetable', 'action' => 'update'],
                ['resource' => 'attendance', 'action' => 'read'],
                ['resource' => 'grades', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'read'],
                ['resource' => 'fees', 'action' => 'read'],
                ['resource' => 'fees', 'action' => 'manage'],
                ['resource' => 'payments', 'action' => 'read'],
                ['resource' => 'school', 'action' => 'read'],
                ['resource' => 'school', 'action' => 'manage'],
                ['resource' => 'analytics', 'action' => 'read'],
                ['resource' => 'analytics', 'action' => 'export'],
                ['resource' => 'announcements', 'action' => 'create'],
                ['resource' => 'announcements', 'action' => 'read'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'audit', 'action' => 'read'],
            ],

            'teacher' => [
                // Teachers can create and grade assignments, mark attendance
                ['resource' => 'assignments', 'action' => 'create'],
                ['resource' => 'assignments', 'action' => 'read'],
                ['resource' => 'assignments', 'action' => 'update'],
                ['resource' => 'grades', 'action' => 'create'],
                ['resource' => 'grades', 'action' => 'read'],
                ['resource' => 'grades', 'action' => 'update'],
                ['resource' => 'attendance', 'action' => 'create'],
                ['resource' => 'attendance', 'action' => 'read'],
                ['resource' => 'attendance', 'action' => 'update'],
                ['resource' => 'timetable', 'action' => 'read'],
                ['resource' => 'classes', 'action' => 'read'],
                ['resource' => 'students', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'announcements', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'offer'], // Independent teaching
            ],

            'student' => [
                // Students can view their own information
                ['resource' => 'assignments', 'action' => 'read'],
                ['resource' => 'grades', 'action' => 'read'],
                ['resource' => 'attendance', 'action' => 'read'],
                ['resource' => 'timetable', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'read'],
                ['resource' => 'messages', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'dismiss'],
                ['resource' => 'announcements', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'book'], // Book independent teachers
            ],

            'parent' => [
                // Parents can monitor their children's progress
                ['resource' => 'assignments', 'action' => 'read'],
                ['resource' => 'grades', 'action' => 'read'],
                ['resource' => 'attendance', 'action' => 'read'],
                ['resource' => 'timetable', 'action' => 'read'],
                ['resource' => 'results', 'action' => 'read'],
                ['resource' => 'messages', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'dismiss'],
                ['resource' => 'announcements', 'action' => 'read'],
                ['resource' => 'fees', 'action' => 'read'],
                ['resource' => 'fees', 'action' => 'pay'],
                ['resource' => 'payments', 'action' => 'read'],
                ['resource' => 'receipts', 'action' => 'read'],
                ['resource' => 'receipts', 'action' => 'download'],
                ['resource' => 'location', 'action' => 'read'], // Track child location
                ['resource' => 'marketplace', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'book'], // Hire tutors
            ],

            'driver' => [
                // Drivers manage transportation
                ['resource' => 'routes', 'action' => 'read'],
                ['resource' => 'trips', 'action' => 'create'],
                ['resource' => 'trips', 'action' => 'read'],
                ['resource' => 'trips', 'action' => 'update'],
                ['resource' => 'location', 'action' => 'broadcast'],
                ['resource' => 'location', 'action' => 'read'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'announcements', 'action' => 'read'],
            ],

            'independent_teacher' => [
                // Independent teachers offer services in marketplace
                ['resource' => 'marketplace', 'action' => 'read'],
                ['resource' => 'marketplace', 'action' => 'offer'],
                ['resource' => 'messages', 'action' => 'create'],
                ['resource' => 'messages', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'read'],
                ['resource' => 'notifications', 'action' => 'dismiss'],
                ['resource' => 'fees', 'action' => 'read'],
                ['resource' => 'payments', 'action' => 'read'],
                ['resource' => 'receipts', 'action' => 'read'],
            ],
        ];
    }
}
