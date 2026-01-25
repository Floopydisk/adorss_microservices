# Phase 2 Quick Reference

Fast lookup guide for Phase 2 SMS & Email Services.

---

## 🚀 Quick Start (2 Minutes)

### 1. Add AWS Credentials to `.env`

```env
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
```

### 2. Test SMS Delivery

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
```

### 3. Check Logs

```bash
tail -f storage/logs/laravel.log | grep -i "sms\|email"
```

---

## 📋 Files Overview

| File                                            | Purpose               | Status               |
| ----------------------------------------------- | --------------------- | -------------------- |
| `app/Services/SMSService.php`                   | AWS SNS SMS delivery  | ✅ Ready             |
| `app/Mail/EmailVerificationMail.php`            | Email template class  | ✅ Ready             |
| `app/Jobs/SendEmailVerification.php`            | Async email queue job | ✅ Ready             |
| `app/Http/Middleware/RateLimitAuth.php`         | API rate limiting     | ✅ Ready             |
| `resources/views/emails/verify-email.blade.php` | HTML email template   | ✅ Ready             |
| `config/aws.php`                                | AWS configuration     | ✅ Ready             |
| `routes/api.php`                                | Updated routes        | ✅ Ready             |
| `.env`                                          | Environment config    | ⏳ Needs credentials |

---

## 📞 SMS Service

### Send OTP

```php
use App\Services\SMSService;

$smsService = new SMSService();
$success = $smsService->sendOTP($phone, $otp);

if ($success) {
    Log::info("SMS sent to {$phone}");
} else {
    Log::error("SMS failed for {$phone}");
}
```

### Features

- ✅ AWS SNS integration
- ✅ 6-digit OTP formatting
- ✅ Rate limiting (3/hour/phone)
- ✅ Phone validation
- ✅ Secure logging (masks phone)
- ✅ Error handling

### Rate Limits

- **3 requests per phone per hour**
- Returns 429 if exceeded

---

## 📧 Email Service

### Queue Email

```php
use App\Jobs\SendEmailVerification;
use App\Models\User;

$user = User::find($userId);
$token = Str::random(64);

SendEmailVerification::dispatch($user, $token, 7);
// Async job queues automatically
```

### Features

- ✅ AWS SES integration
- ✅ Async job queue
- ✅ 3 automatic retries
- ✅ Exponential backoff (1m, 5m, 15m)
- ✅ Professional HTML template
- ✅ Resend endpoint
- ✅ Error handling

### Configuration

```env
QUEUE_CONNECTION=sync        # dev (instant)
QUEUE_CONNECTION=redis       # production (async)
MAIL_MAILER=log             # dev (logs only)
MAIL_MAILER=ses             # production (AWS SES)
```

---

## 🛡️ Rate Limiting

### Limits

| Endpoint                          | Limit | Window |
| --------------------------------- | ----- | ------ |
| `/auth/phone/request-otp`         | 3     | 1 hour |
| `/auth/login`                     | 5     | 15 min |
| `/auth/register`                  | 3     | 1 hour |
| `/auth/resend-verification-email` | 3     | 1 hour |

### Returns 429

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "code": 429
}
```

---

## 📚 API Endpoints

### Request OTP

```
POST /api/auth/phone/request-otp
Content-Type: application/json

{
  "phone": "+14155552671",
  "role": "student"
}
```

**Response:** 200 OK (or 429 if rate limited)

### Verify OTP

```
POST /api/auth/phone/verify-otp
{
  "phone": "+14155552671",
  "otp": "123456"
}
```

**Response:** 200 OK + verification_token

### Complete Registration

```
POST /api/auth/phone/complete-registration
{
  "phone": "+14155552671",
  "verification_token": "...",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "role": "student"
}
```

**Response:** 201 Created + JWT token  
**Action:** Email verification job queued automatically

### Verify Email

```
POST /api/auth/verify-email
{
  "token": "abc123..."
}
```

**Response:** 200 OK (account unlocked)

### Resend Verification Email

```
POST /api/auth/resend-verification-email
{
  "email": "john@example.com"
}
```

**Response:** 200 OK (or 429 if rate limited, or 400 if verified)

---

## 🔧 Configuration

### AWS Credentials

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
```

### Email Configuration

```env
MAIL_MAILER=ses
MAIL_FROM_ADDRESS=noreply@adorss.com
MAIL_FROM_NAME=ADORSS Education Platform
APP_FRONTEND_URL=http://localhost:3000
```

### Queue Configuration

```env
QUEUE_CONNECTION=sync      # Development
QUEUE_CONNECTION=redis     # Production
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 🧪 Testing

### Test OTP

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -d '{"phone": "+14155552671", "role": "student"}'

# Check logs for delivery
tail -f storage/logs/laravel.log | grep "OTP sent"
```

### Test Rate Limit

```bash
# Request 4 times (3 allowed)
for i in {1..4}; do
  curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
    -d '{"phone": "+14155552671", "role": "student"}'
done
# 4th returns 429
```

### Test Email Queue (Sync)

```bash
# With QUEUE_CONNECTION=sync, emails send immediately
php artisan tinker
>>> SendEmailVerification::dispatch(User::first(), 'token', 7);
>>> tail -f storage/logs/laravel.log  # See email sent
```

### Test Email Queue (Redis)

```bash
# Terminal 1: Start queue worker
php artisan queue:work redis --queue=emails

# Terminal 2: Dispatch job
php artisan tinker
>>> SendEmailVerification::dispatch(User::first(), 'token', 7);

# Terminal 1: See job processed
# Processed: App\Jobs\SendEmailVerification
```

---

## 🐛 Troubleshooting

### SMS Not Received

- [ ] Phone format is `+14155552671` (with + prefix)
- [ ] AWS credentials configured
- [ ] SNS spending limit set in AWS Console
- [ ] Check logs: `grep ERROR storage/logs/laravel.log`

### Email Not Received

- [ ] Queue worker running: `php artisan queue:work`
- [ ] Redis running (if async): `redis-cli ping`
- [ ] Email verified in SES (production)
- [ ] Check logs: `grep "Email verification" storage/logs/laravel.log`

### Rate Limit False Positives

- [ ] Cache flushed: `php artisan cache:clear`
- [ ] Redis running (if Redis cache driver)
- [ ] Check cache: `redis-cli KEYS rate_limit:*`

---

## 📊 Monitoring

### View Logs

```bash
# Real-time
tail -f storage/logs/laravel.log

# Filter by service
grep "SMS\|Email" storage/logs/laravel.log

# Count errors
grep "\[ERROR\]" storage/logs/laravel.log | wc -l
```

### Queue Status

```bash
# Pending jobs
php artisan queue:failed

# Retry failed
php artisan queue:retry all

# Monitor in real-time
php artisan queue:monitor

# Work on queue
php artisan queue:work redis --queue=emails --verbose
```

### AWS Metrics

```
SNS Dashboard:
AWS Console → SNS → Text Messaging (SMS) → Metrics

SES Dashboard:
AWS Console → SES → Sending Statistics
```

---

## 🔐 Security

✅ **Implemented:**

- Phone masking in logs (\*\*\*\*7890)
- OTP not in response (production-safe)
- 64-character random tokens
- Rate limiting (prevents brute force)
- Account lockout (email verification required)
- Error handling (no sensitive data exposed)

---

## ✨ New in Phase 2

1. **SMS Delivery** - Real AWS SNS integration
2. **Async Email** - Queued jobs with retry logic
3. **Rate Limiting** - Middleware protecting all endpoints
4. **Email Resend** - New endpoint with rate limiting
5. **Professional Templates** - HTML email with branding
6. **Production Config** - AWS SDK integrated
7. **Comprehensive Docs** - Setup, testing, troubleshooting

---

## 📞 Documentation

| Document                              | Content                                          |
| ------------------------------------- | ------------------------------------------------ |
| `PHASE_2_SETUP.md`                    | Implementation guide (setup, config, deployment) |
| `PHASE_2_TESTING.md`                  | Testing guide (10+ test cases, troubleshooting)  |
| `PHASE_2_IMPLEMENTATION_CHECKLIST.md` | Detailed checklist (this file)                   |

---

## 🎯 Next Steps

1. **Get AWS Credentials** from your AWS account
2. **Update .env** with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
3. **Test SMS** with `curl` command above
4. **Test Email** - follow PHASE_2_TESTING.md
5. **Deploy to Production** - update config for production

---

## 📝 Log Examples

### Successful OTP

```
[2026-01-24 10:30:15] local.INFO: OTP sent successfully: phone=****7890, message_id=SNS-abc123
```

### Email Queued

```
[2026-01-24 10:30:16] local.INFO: Email verification sent: user_id=1, email=john@example.com
```

### Rate Limit Hit

```
[2026-01-24 10:30:17] local.WARNING: Rate limit exceeded: type=otp_request, phone=****7890
```

### Error

```
[2026-01-24 10:30:18] local.ERROR: Failed to send OTP via AWS SNS: error=InvalidParameterException
```

---

**Version:** 1.0  
**Date:** January 24, 2026  
**Status:** ✅ Complete

For detailed info, see `PHASE_2_SETUP.md` or `PHASE_2_TESTING.md`
