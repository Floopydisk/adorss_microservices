<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RateLimitAuth
{
    /**
     * Rate limit authentication endpoints
     * - OTP request: max 3 per hour per phone
     * - Login attempt: max 5 per 15 minutes per email
     * - Registration: max 3 per hour per IP
     */
    public function handle(Request $request, Closure $next): Response
    {
        // OTP Request Rate Limiting
        if ($request->routeIs('auth.phone.request-otp')) {
            $phone = $request->input('phone');
            $cacheKey = "rate_limit:otp:{$phone}";
            $limit = 3;
            $window = 3600; // 1 hour

            if ($this->isRateLimited($cacheKey, $limit, $window)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many OTP requests. Please try again later.',
                ], 429);
            }

            $this->incrementCounter($cacheKey, $window);
        }

        // Login Attempt Rate Limiting
        if ($request->routeIs('auth.login') || $request->routeIs('auth.phone.login')) {
            $identifier = $request->input('email') ?? $request->input('phone');
            $cacheKey = "rate_limit:login:{$identifier}";
            $limit = 5;
            $window = 900; // 15 minutes

            if ($this->isRateLimited($cacheKey, $limit, $window)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many login attempts. Please try again in 15 minutes.',
                ], 429);
            }

            $this->incrementCounter($cacheKey, $window);
        }

        // Registration Rate Limiting
        if ($request->routeIs('auth.register') || $request->routeIs('auth.phone.complete-registration')) {
            $ip = $request->ip();
            $cacheKey = "rate_limit:register:{$ip}";
            $limit = 3;
            $window = 3600; // 1 hour

            if ($this->isRateLimited($cacheKey, $limit, $window)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many registration attempts. Please try again later.',
                ], 429);
            }

            $this->incrementCounter($cacheKey, $window);
        }

        return $next($request);
    }

    private function isRateLimited(string $cacheKey, int $limit, int $window): bool
    {
        $count = Cache::get($cacheKey, 0);
        return $count >= $limit;
    }

    private function incrementCounter(string $cacheKey, int $window): void
    {
        $count = Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $count + 1, now()->addSeconds($window));
    }
}
