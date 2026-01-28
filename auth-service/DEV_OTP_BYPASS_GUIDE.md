# Development OTP Bypass Guide

**Status:** 🚧 Active (January 28, 2026)  
**Reason:** AWS SNS configuration pending  
**Static OTP:** `123456`  
**Environments:** `development`, `local`, `testing`

---

## Overview

During the development phase, while AWS SNS is being configured, all OTP-requiring features accept a **static OTP `123456`** to bypass the phone verification system. This allows the CEO and team to see full progress across all authentication features without waiting for email/SMS infrastructure to be online.

**This bypass is automatically disabled in production environments.**

---

## How It Works

### 1. Request OTP (Any Method)
All phone authentication endpoints work normally:

```bash
# Registration OTP
curl -X POST https://api.adorss.ng/auth/phone/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "role": "parent"
  }'

# Response:
# {
#   "success": true,
#   "message": "OTP sent to your phone. It will expire in 10 minutes.",
#   "expires_in_minutes": 10
# }
```

**What happens in dev mode:**
- AWS SNS is **bypassed** (no real SMS sent)
- The generated OTP is **logged** to the application logs
- System is ready to accept **either**:
  - The real generated OTP (from logs)
  - **Static OTP: `123456`**

### 2. Verify OTP (Uses Static OTP)

```bash
curl -X POST https://api.adorss.ng/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "otp": "123456",    # Use this static OTP in dev
    "role": "parent"
  }'

# Response:
# {
#   "success": true,
#   "message": "OTP verified",
#   "registration_token": "abc123..."
# }
```

**Key Features:**
- Static OTP `123456` bypasses expiration checks
- Works **immediately** without waiting 10 minutes
- Works across all OTP flows (registration, login, password reset)

---

## OTP-Requiring Features

All of these features now support the static OTP bypass:

### 1. **Phone Registration**
```bash
POST /auth/phone/request-otp        # Request OTP
POST /auth/phone/verify-otp         # Verify with "123456"
POST /auth/phone/complete-registration
```

### 2. **Phone Login**
```bash
POST /auth/phone/request-login-otp  # Request OTP
POST /auth/phone/login              # Verify with "123456"
```

### 3. **Password Reset** (Optional - future)
```bash
POST /auth/forgot-password          # Request reset
# Use "123456" if OTP-based reset is implemented
```

---

## Testing Checklist

Use this to test all OTP flows with the static OTP:

- [ ] **Register with Phone OTP**
  1. Request OTP: `POST /auth/phone/request-otp`
  2. Verify OTP with `123456`: `POST /auth/phone/verify-otp`
  3. Complete registration: `POST /auth/phone/complete-registration`
  4. Check: User created with `phone_verified = true`

- [ ] **Login with Phone OTP**
  1. Request Login OTP: `POST /auth/phone/request-login-otp`
  2. Login with `123456`: `POST /auth/phone/login`
  3. Check: JWT token returned

- [ ] **Multiple Registrations**
  1. Register 3 different phone numbers all with `123456`
  2. Verify each gets unique registration token
  3. Verify all 3 complete registration successfully

- [ ] **Rate Limiting Still Works**
  1. Request OTP 4+ times for same phone in 1 hour
  2. Verify 4th request fails with rate limit error
  3. Verify static OTP still works within limit

---

## Log Output Examples

### Development Mode - OTP Request
```
[2026-01-28 14:30:45] local.NOTICE: 📲 [DEV MODE] OTP Request - Use static OTP "123456" to bypass
{
  "phone": "****5678",
  "otp_generated": "847291",
  "dev_static_otp": "123456",
  "aws_sns_status": "BYPASSED - Using static OTP",
  "message": "ℹ️ Development Mode: Use OTP \"123456\" for all phone authentication (AWS SNS bypass)"
}
```

### OTP Validation Success
```
[2026-01-28 14:31:12] local.INFO: OTP validation attempt
{
  "phone": "****5678",
  "otp_used": "DEV_STATIC",
  "dev_bypass_enabled": true,
  "dev_bypass_used": true,
  "context": "phone_verification",
  "timestamp": "2026-01-28T14:31:12.000Z"
}
```

---

## Architecture

### Files Modified

**1. `app/Utils/DevOtpHelper.php`** (NEW)
- Centralized bypass logic
- Environment-aware validation
- Audit logging support
- Constants for static OTP

**2. `app/Models/PhoneVerification.php`**
- Updated `isValid()` to use `DevOtpHelper`
- Logs all OTP validation attempts
- Respects production environment (no bypass)

**3. `app/Services/SMSService.php`**
- Updated `sendOTP()` to log in dev mode
- Returns success for logged OTPs
- Includes bypass status in logs

---

## Transition to Production

### When to Remove This Bypass

Once AWS SNS is fully configured and tested:

1. **Update Environment Variables**
   ```env
   # .env.production
   APP_ENV=production
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   ```

2. **Verify AWS SNS Configuration**
   - Test real SMS delivery
   - Confirm delivery logs in AWS Console
   - Set up SMS rate limits

3. **Remove Dev Code** (Optional)
   - `app/Utils/DevOtpHelper.php` stays (no harm)
   - Bypass is automatically disabled (checked via `APP_ENV`)
   - No database changes needed

### Rollback if Issues

If production OTP system fails:

1. Set `APP_ENV=development` temporarily
2. Static OTP `123456` will be active again
3. Fix AWS SNS configuration
4. Set `APP_ENV=production` once fixed

---

## Security Implications

### ⚠️ Development Only
- **Never** commit this with `APP_ENV=production`
- **Never** use production database in dev mode
- **Never** expose dev logs with OTP codes in production

### ✅ Safe By Default
- Production environments have `APP_ENV=production` 
- Bypass is completely disabled in production
- No hardcoded bypass in production code
- All OTP validations still require correct code in production

### 📋 Audit Trail
Every OTP validation is logged with:
- Phone number (last 4 digits only)
- Whether static OTP was used
- Bypass status
- Timestamp
- Context (registration/login/etc)

---

## Support

### Issues

**Q: "OTP validation failed even with 123456"**
- A: Ensure `APP_ENV=development` or `local` in `.env`
- A: Check auth-service is restarted after config changes

**Q: "Static OTP worked yesterday, not today"**
- A: Check `.env` hasn't been changed to production
- A: Restart the service

**Q: "Want to test with real OTP"**
- A: Use the generated OTP from logs during request
- A: Both real OTP and `123456` work in dev mode

### Timeline

- **Now:** Static OTP `123456` bypass active (AWS SNS down)
- **Feb 2026:** AWS SNS configuration complete
- **Feb 2026:** All SMS tests pass
- **Mar 2026:** Bypass removed, production-only real SMS

