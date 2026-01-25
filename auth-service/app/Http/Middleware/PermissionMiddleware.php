<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission): mixed
    {
        $user = $request->user();
        if (!$user) {
            throw new AccessDeniedHttpException('Unauthorized');
        }

        [$resource, $action] = $this->parsePermissionString($permission);

        if (!$user->hasPermission($resource, $action)) {
            throw new AccessDeniedHttpException('Forbidden: missing permission');
        }

        return $next($request);
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
