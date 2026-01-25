# Phase 2 Testing Guide

Complete testing procedures for SMS and Email services in production-ready authentication system.

---

## Quick Start (5 Minutes)

### 1. Set AWS Credentials

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
QUEUE_CONNECTION=sync
MAIL_MAILER=log
```

### 2. Test OTP Request

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
```

### 3. Check Logs

```bash
tail -f storage/logs/laravel.log
```

---

## Full Test Suite

### Test 1: OTP SMS Delivery

**Objective:** Verify SMS delivery via AWS SNS

**Prerequisites:**

- AWS SNS enabled
- Phone number format: `+14155552671`
- SNS spending limit set
- Credentials in `.env`

**Procedure:**

```bash
# Request OTP
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "phone": "+14155552671",
    "role": "student"
  }' | json_pp

# Expected Response (202)
{
  "success": true,
  "message": "OTP sent to your phone. It will expire in 10 minutes.",
  "expires_in_minutes": 10
}
```

**Verification:**

- [ ] SMS received on phone with 6-digit code
- [ ] Log entry: `[INFO] OTP sent successfully`
- [ ] AWS SNS dashboard shows successful delivery

**Troubleshooting:**

- Invalid phone format → Returns 400 "Invalid phone number"
- AWS credentials wrong → Check `[ERROR]` in logs
- SNS quota exceeded → Check AWS SNS dashboard

---

### Test 2: OTP Rate Limiting

**Objective:** Verify 3 OTP requests per hour limit

**Procedure:**

```bash
# Request 1 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Returns: 200 OK

# Request 2 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Returns: 200 OK

# Request 3 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Returns: 200 OK

# Request 4 (BLOCKED - Rate Limited)
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Returns: 429 Too Many Requests
{
  "success": false,
  "message": "Too many OTP requests. Please try again later.",
  "code": 429
}
```

**Verification:**

- [ ] First 3 requests succeed (200)
- [ ] 4th request returns 429
- [ ] Cache key: `rate_limit:otp:+14155552671` in Redis
- [ ] TTL: 3600 seconds (1 hour)

**Expected Behavior:**

- Limits per phone number
- Resets after 1 hour
- Different phones have independent limits

---

### Test 3: Email Verification Async Job

**Objective:** Verify async email queuing and delivery

**Prerequisites:**

- Queue configured: `QUEUE_CONNECTION=sync` for testing
- Or Redis with: `php artisan queue:work redis --queue=emails`
- Mail driver: `MAIL_MAILER=log` for development

**Procedure:**

```bash
# 1. Request OTP
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Response includes: expires_in_minutes

# 2. Verify OTP (use OTP from SMS or logs)
curl -X POST "http://localhost:8000/api/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155552671",
    "otp": "123456"
  }'
# Response includes: verification_token

# 3. Complete Registration
curl -X POST "http://localhost:8000/api/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155552671",
    "verification_token": "abc123...",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "role": "student"
  }'
# Response: 201 Created with JWT token
```

**Verification (Sync Queue):**

```bash
# Check logs for email queued message
grep "Email verification sent" storage/logs/laravel.log

# Check logs for email content (with log driver)
grep -A 20 "To: john@example.com" storage/logs/laravel.log
```

**Expected Log Output:**

```
[INFO] Email verification sent: user_id=1, email=john@example.com
[INFO] Mailable: EmailVerificationMail | john@example.com
```

**Verification (Redis Queue):**

```bash
# Start queue worker
php artisan queue:work redis --queue=emails --verbose

# In another terminal, complete registration (above)
# Queue worker output shows:
# [Illuminate\Contracts\Queue\Job] Processing: App\Jobs\SendEmailVerification
# [Job] Processed: App\Jobs\SendEmailVerification
```

---

### Test 4: Email Resend with Rate Limiting

**Objective:** Verify email resend endpoint and rate limiting

**Procedure:**

```bash
# Request 1 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
# Response: 200 OK
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}

# Request 2 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
# Response: 200 OK

# Request 3 (SUCCESS)
curl -X POST "http://localhost:8000/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
# Response: 200 OK

# Request 4 (BLOCKED - Rate Limited)
curl -X POST "http://localhost:8000/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
# Response: 429 Too Many Requests
{
  "success": false,
  "message": "Too many resend requests. Please try again later.",
  "code": 429
}
```

**Verification:**

- [ ] First 3 requests return 200
- [ ] 4th request returns 429
- [ ] Email received 3 times
- [ ] Log shows: `Email verification resent`

---

### Test 5: Email Verification Complete Flow

**Objective:** Verify email verification unlocks account

**Procedure:**

```bash
# 1. Get verification email (check logs or mailbox)
# Extract token from verification URL:
# http://localhost:3000/verify-email?token=abc123...

# 2. Verify email
curl -X POST "http://localhost:8000/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123..."}'
# Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully. Account unlocked."
}

# 3. Try login (should now work)
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'
# Response: 200 OK with JWT token
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

**Verification:**

- [ ] Email verification succeeds
- [ ] Login succeeds with JWT token
- [ ] No "email_verified_at" null error

---

### Test 6: Already Verified Prevention

**Objective:** Prevent verification of already verified email

**Procedure:**

```bash
# User already verified (previous test)
curl -X POST "http://localhost:8000/api/auth/resend-verification-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
# Response: 400 Bad Request
{
  "success": false,
  "message": "Email is already verified.",
  "code": 400
}
```

---

### Test 7: Login Rate Limiting

**Objective:** Verify 5 login attempts per 15 minutes

**Procedure:**

```bash
# Wrong password attempts
for i in {1..6}; do
  curl -X POST "http://localhost:8000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "john@example.com", "password": "wrong"}'
  sleep 2
done

# Attempts 1-5: 401 Unauthorized (wrong password)
# Attempt 6: 429 Too Many Requests (rate limited)
```

---

### Test 8: Registration Rate Limiting

**Objective:** Verify 3 registration attempts per hour per IP

**Procedure:**

```bash
# Make 4 registration attempts from same IP
for i in {1..4}; do
  curl -X POST "http://localhost:8000/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "+1415555267'"$i"'",
      "role": "student",
      "first_name": "Test",
      "last_name": "User",
      "email": "test'"$i"'@example.com",
      "password": "Password123!",
      "password_confirmation": "Password123!"
    }'
  sleep 2
done

# Attempts 1-3: 200/201 OK
# Attempt 4: 429 Too Many Requests
```

---

### Test 9: Phone Number Validation

**Objective:** Verify phone validation in SMS service

**Procedure:**

```bash
# Valid formats
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Returns: 200 OK

# Invalid formats
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -d '{"phone": "14155552671", "role": "student"}'
# Returns: 400 Bad Request

curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -d '{"phone": "123", "role": "student"}'
# Returns: 400 Bad Request
```

---

### Test 10: AWS Credentials Error Handling

**Objective:** Verify graceful failure with invalid credentials

**Prerequisites:**

- Invalid AWS credentials in `.env`

**Procedure:**

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+14155552671", "role": "student"}'
# Response: 500 Internal Server Error
{
  "success": false,
  "message": "Failed to send OTP. Please try again later.",
  "code": 500
}

# Check logs
grep "\[ERROR\]" storage/logs/laravel.log
# Should show: Failed to send OTP via AWS SNS: error=InvalidSignatureException
```

---

## Performance Testing

### Load Test: SMS Delivery

```bash
# Use Apache Bench for 100 concurrent requests
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:8000/api/auth/phone/request-otp

# Monitor
watch -n 1 'tail -10 storage/logs/laravel.log'
```

**Expected:**

- All requests queue successfully
- Some hit rate limits (expected)
- SMS service handles concurrency
- Job queue processes reliably

### Load Test: Email Queue

```bash
# With 100 concurrent registrations
ab -n 100 -c 10 -p registration.json -T application/json \
  http://localhost:8000/api/auth/phone/complete-registration

# Monitor queue
php artisan queue:monitor
```

---

## Integration Testing with Postman

### Import Collection

1. Download `ADORSS_API_Postman_Collection.json`
2. Postman → Import → Choose file
3. Select "Phase 2 - SMS & Email" folder

### Environment Variables

```json
{
    "base_url": "http://localhost:8000/api",
    "phone": "+14155552671",
    "email": "test@example.com",
    "otp": "123456"
}
```

### Test Sequence

1. Request OTP
2. Verify OTP (manually enter from logs)
3. Complete Registration
4. Verify Email (extract token from logs)
5. Login with Email
6. Refresh Token
7. Get User Profile
8. Logout

---

## Debugging & Monitoring

### View Application Logs

```bash
# Real-time logs
tail -f storage/logs/laravel.log

# Search for specific errors
grep "ERROR" storage/logs/laravel.log

# Filter by operation
grep "OTP" storage/logs/laravel.log
grep "Email" storage/logs/laravel.log
grep "rate_limit" storage/logs/laravel.log
```

### Check Queue Status

```bash
# Failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Monitor queue in real-time
php artisan queue:monitor

# Work on specific queue
php artisan queue:work redis --queue=emails --verbose
```

### AWS Monitoring

**SNS Dashboard:**

```
AWS Console → SNS → Text Messaging (SMS) → Metrics
- Messages sent
- Messages failed
- Delivery success rate
```

**SES Dashboard:**

```
AWS Console → SES → Sending Statistics
- Emails sent
- Bounces
- Complaints
- Delivery rate
```

### Database Inspection

```bash
# Check verified users
php artisan tinker
>>> User::where('email_verified_at', '!=', null)->count()

# Check pending verification
>>> User::where('email_verified_at', null)->count()

# Check locked accounts
>>> User::where('is_locked', true)->count()

# View phone verifications
>>> PhoneVerification::where('verified_at', null)->get()
```

---

## Automation Testing (CI/CD)

### Laravel Testing

```bash
# Run auth tests
php artisan test tests/Feature/AuthenticationTest.php

# Run SMS service tests
php artisan test tests/Unit/SMSServiceTest.php

# Run all tests with coverage
php artisan test --coverage
```

### Sample Test Case

```php
// tests/Feature/PhoneAuthTest.php
public function test_otp_request_sends_sms()
{
    Bus::fake();

    $response = $this->postJson('/api/auth/phone/request-otp', [
        'phone' => '+14155552671',
        'role' => 'student'
    ]);

    $response->assertStatus(200);
    Bus::assertDispatched(SendSMS::class);
}
```

---

## Checklist - Ready for Production

- [ ] AWS credentials configured and tested
- [ ] SNS SMS delivery working
- [ ] SES email delivery working
- [ ] Redis queue running (or configured)
- [ ] Queue worker started: `php artisan queue:work redis`
- [ ] Rate limiting verified
- [ ] Email verification flow end-to-end tested
- [ ] Error handling tested (bad credentials, invalid data)
- [ ] Logs monitored for errors
- [ ] AWS quotas verified sufficient
- [ ] Email domain verified in SES (if using custom domain)
- [ ] Rate limiting thresholds appropriate for use case
- [ ] All tests passing: `php artisan test`
- [ ] Documentation updated
- [ ] Team trained on monitoring

---

## Common Issues & Solutions

### Issue: SMS not received

**Solution:**

1. Check phone format: `+14155552671`
2. Check AWS SNS spending limit
3. Verify phone is in supported country
4. Check CloudWatch logs: `aws logs tail /aws/sns/application`
5. Verify AWS credentials have `sns:Publish` permission

### Issue: Email not received

**Solution:**

1. Check mail logs: `grep "Email verification" storage/logs/laravel.log`
2. Verify email in SES: AWS Console → SES → Verified identities
3. Check SES sandbox status (limits to verified emails)
4. Check spam folder
5. Review SES bounce/complaint metrics
6. Verify MAIL_FROM_ADDRESS matches verified email

### Issue: Queue jobs not processing

**Solution:**

1. Verify queue worker is running: `php artisan queue:work`
2. Check Redis: `redis-cli ping` → should return PONG
3. Check failed jobs: `php artisan queue:failed`
4. Retry: `php artisan queue:retry all`
5. Verify QUEUE_CONNECTION in .env matches setup

### Issue: Rate limiting too strict

**Solution:**

1. Adjust thresholds in RateLimitAuth middleware
2. Clear cache: `php artisan cache:clear`
3. Verify cache driver configured correctly
4. Check cache keys: `redis-cli KEYS rate_limit:*`

---

## Contact & Support

For issues:

1. Check logs: `storage/logs/laravel.log`
2. Review this guide: Debugging & Monitoring section
3. Check AWS console for service status
4. Verify configuration against PHASE_2_SETUP.md

---

**Version:** Phase 2, January 24, 2026  
**Status:** ✅ Production-Ready  
**Last Updated:** [Current Date]
