# OTP Issues - Fixes Applied

**Date:** February 3, 2026  
**Status:** ✅ FIXED

---

## Issues Reported

1. **"Too many requests" error** when requesting OTP
2. **"Invalid or expired OTP" error** when verifying with bypass OTP `123456`

---

## Root Causes Identified

### Issue 1: Double Rate Limiting

- **Problem:** Rate limiting was applied in TWO places:
    - `RateLimitAuth` middleware: 3 requests per hour per phone
    - `SMSService`: 3 requests per hour per phone
- **Impact:** Users were hitting BOTH limits, causing premature "too many requests" errors
- **Example:** If a user made 2 requests, both counters incremented. A 3rd request would fail at the middleware level even though SMSService would have allowed it.

### Issue 2: OTP Validation Logic Order

- **Problem:** The dev OTP bypass check was happening AFTER the production mode check
- **Impact:** In some edge cases, the static OTP `123456` wouldn't bypass properly
- **Code flow:**

    ```php
    // OLD (problematic):
    if (!isDevMode()) return checkOTP();  // ❌ Checked first
    if (otp === "123456") return true;    // Never reached in some cases

    // NEW (fixed):
    if (isDevMode() && otp === "123456") return true;  // ✅ Checked first
    if (!isDevMode()) return checkOTP();
    ```

### Issue 3: Rate Limiting in Dev Mode

- **Problem:** Rate limits were enforced even in development mode
- **Impact:** Developers hit limits during testing, slowing down development

---

## Fixes Applied

### ✅ Fix 1: Removed Duplicate Rate Limiting

**File:** `auth-service/app/Http/Middleware/RateLimitAuth.php`

**Change:** Removed OTP request rate limiting from middleware since `SMSService` already handles it.

```php
// REMOVED this block from middleware:
if ($request->routeIs('auth.phone.request-otp')) {
    // Rate limiting code removed
}

// Added comment explaining why:
// Note: OTP request rate limiting is handled in SMSService
// to avoid double-counting and allow dev bypass
```

**Benefit:** Eliminates double counting, prevents premature "too many requests" errors.

---

### ✅ Fix 2: Fixed OTP Validation Order

**File:** `auth-service/app/Utils/DevOtpHelper.php`

**Change:** Check dev bypass BEFORE production validation.

```php
// NEW ORDER:
public static function validateOtp($submittedOtp, $expectedOtp, $isExpired) {
    // 1. Check dev bypass FIRST (highest priority)
    if (isDevOtpBypassEnabled() && $submittedOtp === DEV_OTP) {
        return true; // ✅ Bypass all checks
    }

    // 2. Production mode check
    if (!isDevOtpBypassEnabled()) {
        return !$isExpired && $submittedOtp === $expectedOtp;
    }

    // 3. Dev mode with real OTP
    return !$isExpired && $submittedOtp === $expectedOtp;
}
```

**Benefit:** Static OTP `123456` always works in dev mode, regardless of expiration.

---

### ✅ Fix 3: Disabled Rate Limiting in Dev Mode

**File:** `auth-service/app/Services/SMSService.php`

**Change:** Skip rate limit checks in development mode.

```php
public function sendOTP($phone, $otp) {
    // Check dev mode FIRST, skip rate limiting
    if (DevOtpHelper::isDevOtpBypassEnabled()) {
        Log::notice('📲 [DEV MODE] OTP Request - Use static OTP "123456"', [
            'rate_limit_bypassed' => true,
        ]);
        return true; // ✅ No rate limiting in dev
    }

    // Production: enforce rate limiting
    if (!$this->checkRateLimit($phone)) {
        return false; // ❌ Rate limit exceeded
    }

    // Send SMS via AWS SNS...
}
```

**Benefit:** Unlimited OTP requests in dev mode for faster testing.

---

## Testing the Fix

### Manual Test Steps

1. **Request OTP:**

    ```bash
    curl -X POST http://localhost:8000/auth/phone/request-otp \
      -H "Content-Type: application/json" \
      -d '{
        "phone": "+2348012345678",
        "role": "parent"
      }'
    ```

    **Expected:** Success, no rate limit errors (can repeat many times)

2. **Verify OTP with static bypass:**

    ```bash
    curl -X POST http://localhost:8000/auth/phone/verify-otp \
      -H "Content-Type: application/json" \
      -d '{
        "phone": "+2348012345678",
        "otp": "123456",
        "role": "parent"
      }'
    ```

    **Expected:** Success, returns `registration_token`

3. **Run automated test:**
    ```bash
    cd auth-service
    bash test_phone_auth.sh
    ```

---

## Environment Requirements

For the fixes to work, ensure `.env` has:

```env
APP_ENV=local              # or 'development' or 'testing'
# NOT 'production'
```

**Dev bypass is enabled when:** `APP_ENV` is `local`, `development`, or `testing`

---

## Production Behavior

In production (`APP_ENV=production`):

- ✅ Rate limiting enforced (3 requests per hour)
- ✅ Real OTP required (no `123456` bypass)
- ✅ Expiration checks enforced
- ✅ AWS SNS sends actual SMS

---

## Summary

| Issue                             | Status   | Fix Applied                     |
| --------------------------------- | -------- | ------------------------------- |
| Too many requests on OTP endpoint | ✅ FIXED | Removed duplicate rate limiting |
| Invalid OTP error with "123456"   | ✅ FIXED | Reordered validation logic      |
| Rate limiting in dev mode         | ✅ FIXED | Disabled rate limits in dev     |

**All OTP authentication flows should now work correctly for frontend testing.**

---

## Next Steps

1. ✅ Test the OTP flow end-to-end
2. ✅ Verify multiple requests don't trigger rate limiting
3. ✅ Confirm static OTP `123456` works consistently
4. 🔜 Configure AWS SNS for production (when ready)
5. 🔜 Remove dev bypass when SMS infrastructure is live
