<?php

namespace App\Models\Traits;

use App\Models\Role;
use Illuminate\Support\Facades\Cache;

trait HasPermissions
{
    public function hasPermission(string $resource, string $action): bool
    {
        $roleName = $this->role;
        if (!$roleName) {
            return false;
        }

        $cacheKey = sprintf('role_perms:%s', $roleName);

        $permissions = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($roleName) {
            $role = Role::query()->where('name', $roleName)->with('permissions')->first();
            if (!$role) {
                return collect();
            }
            return $role->permissions->map(function ($perm) {
                return strtolower($perm->resource . ':' . $perm->action);
            });
        });

        $needle = strtolower($resource . ':' . $action);
        return $permissions->contains($needle);
    }

    public function hasAnyPermission(array $required): bool
    {
        foreach ($required as $perm) {
            [$res, $act] = $this->parsePermissionString($perm);
            if ($this->hasPermission($res, $act)) {
                return true;
            }
        }
        return false;
    }

    private function parsePermissionString(string $perm): array
    {
        // Supports "resource:action" or "resource.action" or "resource,action"
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
