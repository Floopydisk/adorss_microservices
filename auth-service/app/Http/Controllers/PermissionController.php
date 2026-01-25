<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Permission;

class PermissionController extends Controller
{
    public function listForUser(Request $request)
    {
        $user = $request->user();
        $role = Role::query()->where('name', $user->role)->with('permissions')->first();
        $perms = $role ? $role->permissions->map(fn($p) => [
            'name' => $p->name,
            'resource' => $p->resource,
            'action' => $p->action,
            'description' => $p->description,
        ]) : collect();
        return response()->json([
            'role' => $user->role,
            'permissions' => $perms,
        ]);
    }

    public function check(Request $request)
    {
        $request->validate([
            'resource' => 'required|string',
            'action' => 'required|string',
        ]);

        $user = $request->user();
        $allowed = $user->hasPermission($request->string('resource'), $request->string('action'));

        return response()->json(['allowed' => $allowed]);
    }

    public function checkMany(Request $request)
    {
        $request->validate([
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string',
        ]);

        $user = $request->user();
        $result = [];
        foreach ($request->input('permissions', []) as $perm) {
            [$res, $act] = $this->parsePermissionString($perm);
            $result[$perm] = $user->hasPermission($res, $act);
        }

        return response()->json([
            'results' => $result,
        ]);
    }

    private function parsePermissionString(string $perm): array
    {
        if (str_contains($perm, ':')) {
            return explode(':', $perm, 2);
        }
        if (str_contains($perm, ',')) {
            return explode(',', $perm, 2);
        }
        if (str_contains($perm, '.')) {
            return explode('.', $perm, 2);
        }
        return [$perm, '*'];
    }
}
