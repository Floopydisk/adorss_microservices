# AWS Setup Guide for OTP & Email Services

This guide will help you set up AWS SNS (for SMS OTPs) and AWS SES (for emails) to enable authentication workflows.

---

## Prerequisites

- AWS Account (create at https://aws.amazon.com)
- Access to AWS Console
- Credit card for AWS billing (free tier available)

---

## Part 1: AWS IAM User Setup

### Step 1: Create IAM User with Programmatic Access

1. Go to **AWS Console** → **IAM** → **Users** → **Create user**
2. User name: `adorss-auth-service`
3. Check **"Access key - Programmatic access"**
4. Click **Next: Permissions**

### Step 2: Attach Policies

Click **"Attach policies directly"** and select:

- ✅ **AmazonSNSFullAccess** (for SMS)
- ✅ **AmazonSESFullAccess** (for Email)

Click **Next: Tags** → **Next: Review** → **Create user**

### Step 3: Save Credentials

⚠️ **IMPORTANT**: Copy these credentials immediately (they won't be shown again)

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

---

## Part 2: AWS SNS Setup (SMS/OTP)

### Step 1: Enable SMS in SNS

1. Go to **AWS Console** → **SNS** → **Text messaging (SMS)**
2. Click **"Edit"** under **Default settings**
3. Configure:
    - **Default message type**: `Transactional` (for OTPs)
    - **Account spend limit**: Set monthly budget (default: $1.00)
    - **Default sender ID**: Leave blank or set custom ID (not supported in all countries)

### Step 2: Move Out of SMS Sandbox (IMPORTANT!)

⚠️ **By default, AWS SNS is in "sandbox mode"** and can only send SMS to verified phone numbers.

**For Production**: Request to exit sandbox

1. Go to **SNS** → **Text messaging (SMS)** → **Sandbox destination phone numbers**
2. Click **"Request production access"**
3. Fill out the form:
    - **Use case**: Transactional (one-time passwords)
    - **Website URL**: Your app's URL
    - **How users consent**: "Users create accounts and request OTPs"
    - **Message content**: "Your ADORSS verification code is: [OTP]"
4. Submit and wait for approval (usually 24-48 hours)

**For Testing**: Add verified phone numbers

1. Go to **SNS** → **Text messaging (SMS)** → **Sandbox destination phone numbers**
2. Click **"Add phone number"**
3. Enter your phone number (international format: +1234567890)
4. You'll receive a verification code via SMS
5. Enter the code to verify

### Step 3: Check Supported Countries

- SMS pricing and availability: https://aws.amazon.com/sns/sms-pricing/
- Some countries require sender registration
- US/Canada/UK work out-of-the-box

---

## Part 3: AWS SES Setup (Email)

### Step 1: Verify Your Domain (Recommended)

1. Go to **AWS Console** → **SES** → **Verified identities** → **Create identity**
2. Select **"Domain"**
3. Enter your domain: `adorss.com`
4. Click **"Create identity"**
5. AWS will provide DNS records (DKIM, SPF, DMARC)
6. Add these records to your domain's DNS settings
7. Wait for verification (can take up to 72 hours)

### Step 2: Verify Email Address (Quick Start)

If you don't have a domain yet:

1. Go to **SES** → **Verified identities** → **Create identity**
2. Select **"Email address"**
3. Enter your sender email: `noreply@adorss.com`
4. Click **"Create identity"**
5. Check your email inbox and click the verification link

### Step 3: Move Out of SES Sandbox (IMPORTANT!)

⚠️ **By default, AWS SES is in "sandbox mode"** and can only send emails to verified addresses.

**For Production**: Request production access

1. Go to **SES** → **Account dashboard**
2. Click **"Request production access"** button
3. Fill out the form:
    - **Use case**: Transactional emails (OTPs, password resets)
    - **Website URL**: Your app's URL
    - **Mail type**: Transactional
    - **How do you comply with regulations**: "Users opt-in by creating accounts"
4. Submit and wait for approval (usually 24 hours)

**For Testing**: Add verified recipient emails

1. Go to **SES** → **Verified identities** → **Create identity**
2. Select **"Email address"**
3. Enter test recipient email
4. Verify via email link

### Step 4: Configure Sending Email

Update your `.env`:

```bash
MAIL_FROM_ADDRESS="noreply@adorss.com"
MAIL_FROM_NAME="ADORSS Education Platform"
```

The sender email must match your verified identity!

---

## Part 4: Configure Your Laravel App

### Update .env File

```bash
# AWS Credentials (from Part 1)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_DEFAULT_REGION=us-east-1  # Change if you're using a different region

# Email Configuration
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@adorss.com"  # Must match verified SES identity
MAIL_FROM_NAME="ADORSS Education Platform"

# Frontend URL (for email links)
APP_FRONTEND_URL=https://your-app.com  # Change to your actual frontend URL

# Queue Configuration (required for async email sending)
QUEUE_CONNECTION=database  # or 'redis' for production
```

### Set Up Queue Worker

The system uses queued jobs for sending emails. You need a queue worker running:

**Development**:

```bash
php artisan queue:work --queue=emails --tries=3
```

**Production** (using Supervisor):
Create `/etc/supervisor/conf.d/adorss-queue-worker.conf`:

```ini
[program:adorss-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/auth-service/artisan queue:work --queue=emails --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/auth-service/storage/logs/queue-worker.log
stopwaitsecs=3600
```

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start adorss-queue-worker:*
```

---

## Part 5: Test Your Setup

### Test SMS (OTP)

```bash
php artisan tinker
```

```php
$sms = new \App\Services\SMSService();
$sms->sendOTP('+1234567890', '123456');  // Use your verified phone number
```

Check your phone for the SMS!

### Test Email

```bash
php artisan tinker
```

```php
$user = \App\Models\User::first(); // or create a test user
$token = \Illuminate\Support\Str::random(64);
\App\Jobs\SendEmailVerification::dispatch($user, $token, 7);
```

Then run the queue worker:

```bash
php artisan queue:work --queue=emails --tries=3
```

Check your email inbox!

---

## Part 6: Production Checklist

### Before Going Live:

- [ ] AWS SNS moved out of sandbox (approved)
- [ ] AWS SES moved out of sandbox (approved)
- [ ] Domain verified in SES (with DKIM)
- [ ] SPF and DMARC records added to DNS
- [ ] Queue worker running via Supervisor
- [ ] `.env` has production AWS credentials
- [ ] `APP_FRONTEND_URL` points to production domain
- [ ] Rate limiting tested (3 OTP requests per hour)
- [ ] Email templates tested and look good
- [ ] Logs monitored for failed sends

### Cost Estimates:

**AWS SNS (SMS)**:

- US/Canada: ~$0.00645 per SMS
- International varies: $0.02 - $0.15+ per SMS
- 1,000 OTPs/month in US = ~$6.50/month

**AWS SES (Email)**:

- First 62,000 emails/month: **FREE** (if sent from EC2)
- After that: $0.10 per 1,000 emails
- 10,000 emails/month = **FREE**

**Total for typical startup**: $10-20/month for SMS, $0 for email

---

## Troubleshooting

### SMS Not Sending

1. Check AWS CloudWatch Logs for SNS errors
2. Verify phone number format: `+1234567890` (must start with +)
3. Check if you're still in sandbox mode
4. Verify IAM user has `AmazonSNSFullAccess`
5. Check rate limiting in Laravel logs

### Email Not Sending

1. Check queue worker is running: `ps aux | grep queue`
2. Check failed jobs: `php artisan queue:failed`
3. Verify sender email matches SES verified identity
4. Check Laravel logs: `tail -f storage/logs/laravel.log`
5. Verify IAM user has `AmazonSESFullAccess`

### Rate Limiting

Both SMS and Email have rate limits:

- **SMS**: 3 OTP requests per phone number per hour
- **Email verification resend**: 3 requests per email per hour
- **Password reset**: 3 requests per email per hour

Check cache entries if you hit limits:

```bash
php artisan tinker
>>> cache()->get('sms_rate_limit:+1234567890')
>>> cache()->forget('sms_rate_limit:+1234567890')  // Reset if needed
```

---

## Alternative: Development Mode

For development/testing without AWS:

### Option 1: Log Driver (No actual sends)

```bash
# .env
MAIL_MAILER=log
```

Emails will be logged to `storage/logs/laravel.log` instead of being sent.

### Option 2: Mailtrap (Fake SMTP for testing)

1. Sign up at https://mailtrap.io (free)
2. Get SMTP credentials
3. Update `.env`:

```bash
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
```

### Option 3: Return OTP in API Response (TESTING ONLY!)

The system already does this in development! Check the response:

```json
{
    "success": true,
    "message": "OTP sent",
    "otp": "123456", // ← Only in development
    "expires_in_minutes": 10
}
```

⚠️ **Never use this in production!**

---

## Security Best Practices

1. **Never commit AWS credentials** to git
2. Use **environment variables** only
3. Rotate credentials regularly
4. Use **IAM roles** instead of access keys (if deploying to EC2)
5. Enable **CloudWatch** monitoring for SNS/SES
6. Set up **billing alerts** to avoid surprise charges
7. Review **CloudTrail** logs for suspicious activity

---

## Need Help?

- AWS SNS Documentation: https://docs.aws.amazon.com/sns/
- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- Laravel Mail Documentation: https://laravel.com/docs/mail
- Laravel Queue Documentation: https://laravel.com/docs/queues

For issues, check logs:

- Laravel: `storage/logs/laravel.log`
- Queue: `storage/logs/queue-worker.log`
- AWS CloudWatch: SNS/SES delivery logs
