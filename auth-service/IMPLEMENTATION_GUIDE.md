# Phone-First Authentication Implementation Guide

## Architecture Overview

The authentication system is built in Laravel with JWT (JSON Web Tokens) using `tymon/jwt-auth`. It supports multi-step phone-based registration with OTP verification and email verification with account lockout.

### Technology Stack:

- **Framework**: Laravel 12
- **Database**: MySQL (adorss_local)
- **Authentication**: JWT (HS256)
- **ORM**: Eloquent
- **Cache**: Redis/File (for session tokens)

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255),
  phone VARCHAR(20) UNIQUE NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_expires_at TIMESTAMP NULL,
  role VARCHAR(50) DEFAULT 'student',
  status VARCHAR(50) DEFAULT 'active',  -- active, pending, suspended
  school_id BIGINT NULL,
  verification_status VARCHAR(50),
  verification_notes TEXT NULL,
  last_login_at TIMESTAMP NULL,
  locked BOOLEAN DEFAULT FALSE,
  lock_reason TEXT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);
```

### Phone Verifications Table

```sql
CREATE TABLE phone_verifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE,
  otp VARCHAR(6),
  expires_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  INDEX idx_phone (phone),
  INDEX idx_expires_at (expires_at)
);
```

### Email Verifications Table

```sql
CREATE TABLE email_verifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  token VARCHAR(255),
  expires_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
```

---

## File Structure

```
auth-service/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          # Legacy email/password auth
│   │   │   └── PhoneAuthController.php     # Phone OTP auth (NEW)
│   │   └── Middleware/
│   ├── Models/
│   │   ├── User.php                        # User model with JWTSubject
│   │   ├── PhoneVerification.php           # OTP tracking
│   │   └── EmailVerification.php           # Email token tracking
│   ├── Services/                           # FUTURE: OTP & Email services
│   └── Console/
│       └── Commands/
│           └── LockUnverifiedAccounts.php  # FUTURE: 7-day lockout scheduler
├── bootstrap/
│   └── app.php                             # Bootstrap configuration
├── config/
│   ├── auth.php                            # Auth guards & providers
│   ├── jwt.php                             # JWT configuration
│   └── database.php                        # Database config
├── database/
│   └── migrations/
│       ├── 0001_01_01_000000_create_users_table.php
│       ├── 0001_01_01_000001_create_cache_table.php
│       ├── 0001_01_01_000002_create_jobs_table.php
│       ├── 2026_01_24_000100_add_auth_fields_to_users_table.php
│       ├── 2026_01_24_000200_create_phone_verifications_table.php
│       ├── 2026_01_24_000300_create_email_verifications_table.php
│       └── 2026_01_24_000400_add_verification_fields_to_users_table.php
├── routes/
│   └── api.php                             # API routes with auth endpoints
├── storage/
│   └── logs/                               # Application logs
├── .env                                    # Environment variables
├── composer.json                           # PHP dependencies
├── PHONE_AUTH_API.md                       # THIS API DOCUMENTATION
└── IMPLEMENTATION_GUIDE.md                 # THIS IMPLEMENTATION GUIDE
```

---

## Implementation Checklist

### Phase 1: Foundation (COMPLETED ✅)

- [x] Laravel 12 scaffold
- [x] tymon/jwt-auth v2.2.1 installed
- [x] MySQL adorss_local database configured
- [x] Users table with auth fields (phone, email_verified, etc.)
- [x] PhoneVerification model & table
- [x] EmailVerification model & table
- [x] AuthController with basic endpoints
- [x] PhoneAuthController with multi-step flow
- [x] Routes configured with /auth/phone/\* endpoints
- [x] JWT configuration (config/jwt.php, .env JWT_SECRET)
- [x] API responses standardized

### Phase 2: SMS & Email Services (IN PROGRESS 🔄)

- [ ] OTP Service Class (generate, validate, resend)
- [ ] SMS Integration (Twilio or AWS SNS)
    - [ ] Add TWILIO*\* or AWS*\* env vars
    - [ ] Create SMSService with send() method
    - [ ] Update PhoneAuthController::requestOtp() to send SMS
    - [ ] Add rate limiting (max 3 OTP requests per phone per hour)
- [ ] Email Service (Laravel Mail)
    - [ ] Create EmailVerificationMailable class
    - [ ] Create SendEmailVerification queued job
    - [ ] Update PhoneAuthController::completeRegistration() to queue email
    - [ ] Create email template with verification link

### Phase 3: Verification & Lockout (PENDING)

- [ ] Email Verification Endpoint `/auth/verify-email` (implemented, needs testing)
- [ ] Scheduled Job: Lock unverified accounts after 7 days
    - [ ] Create LockUnverifiedAccounts command
    - [ ] Register in Kernel.php schedule
    - [ ] Test lockout enforcement
- [ ] Email Resend Endpoint `/auth/resend-verification-email`
    - [ ] Check rate limiting
    - [ ] Queue email job

### Phase 4: RBAC & Permissions (PENDING)

- [ ] Roles table (id, name, description)
- [ ] Permissions table (id, name, description)
- [ ] RolePermission pivot table
- [ ] User.roles() and User.permissions() relationships
- [ ] hasRole() and can() helper methods
- [ ] Permission middleware for route protection
- [ ] Define permission matrix (student can view own grades, etc.)

### Phase 5: Invitations & KYC (PENDING)

- [ ] Invitations table (id, email, token, role, school_id, expires_at, accepted_at)
- [ ] InvitationController (create, accept, reject)
- [ ] School Admin Invitation Workflow
    - [ ] POST /admin/invitations (create teacher invite)
    - [ ] POST /auth/invitations/{token}/accept (accept invite)
- [ ] Independent Teacher KYC Verification
    - [ ] KYC Documents table (id, user_id, document_type, file_path, verified_at)
    - [ ] Admin approval endpoint
    - [ ] Status tracking (pending, approved, rejected)
- [ ] Driver Approval Workflow (similar to KYC)

### Phase 6: API Gateway Integration (PENDING)

- [ ] API Gateway calls auth-service for JWT validation
- [ ] API Gateway routes requests to appropriate microservices
- [ ] Service-to-service authentication (internal JWTs)
- [ ] Token revocation/blacklist (if needed)

---

## Configuration Files

### .env

```env
APP_NAME="ADORSS Auth Service"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=adorss_local
DB_USERNAME=root
DB_PASSWORD=

# JWT
JWT_ALGORITHM=HS256
JWT_SECRET=LgTsrfxJitXVBoApiUBs6jY78n3qVJINwe00vnuXGiOO3hP9vE7j7lX1DwWgsS5l
JWT_TTL=60  # minutes

# Cache (for session tokens)
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# SMS (Twilio - when implementing)
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_FROM_NUMBER=+1234567890

# Email (when implementing)
MAIL_DRIVER=log
MAIL_FROM_ADDRESS=noreply@adorss.com
MAIL_FROM_NAME="ADORSS"
```

### config/auth.php (Modified)

```php
return [
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'api'),
        'passwords' => 'users',
    ],

    'guards' => [
        'api' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],
];
```

### config/jwt.php (Auto-published from tymon/jwt-auth)

```php
return [
    'secret' => env('JWT_SECRET'),
    'algo' => env('JWT_ALGORITHM', 'HS256'),
    'ttl' => env('JWT_TTL', 60),
    'refresh_ttl' => 20160, // 2 weeks
    'blacklist_enabled' => true,
    'blacklist_grace_period' => 0,
];
```

---

## Key Classes & Methods

### PhoneAuthController

```php
public function requestOtp(Request $request)
    // POST /auth/phone/request-otp
    // Generates OTP, stores in PhoneVerification, sends SMS
    // Returns: { success, otp (dev only), expires_in_minutes }

public function verifyOtp(Request $request)
    // POST /auth/phone/verify-otp
    // Validates OTP, creates temp registration token (Redis cache)
    // Returns: { success, registration_token }

public function completeRegistration(Request $request)
    // POST /auth/phone/complete-registration
    // Creates User, sends email verification link
    // Returns: { success, user, token (JWT) }

public function loginWithPhone(Request $request)
    // POST /auth/phone/login
    // Validates OTP, checks account status/email deadline
    // Returns: { success, user, token (JWT) }

public function verifyEmail(Request $request)
    // POST /auth/verify-email
    // Validates email token, marks user as verified
    // Returns: { success, user }
```

### User Model

```php
implements JWTSubject

// Fields
phone, phone_verified, email_verified, email_verification_expires_at,
locked, lock_reason, status, role, school_id, verification_status

// Methods
getJWTIdentifier()           // Returns user ID for JWT
getJWTCustomClaims()         // Returns { role, email, status, ... }
isLocked()                   // Returns bool
lockForUnverifiedEmail()     // Sets locked=true
unlock()                     // Clears locked status
emailVerification()          // Relationship to EmailVerification
```

### PhoneVerification Model

```php
// Methods
isExpired(): bool            // Checks if OTP past 10 minutes
isValid(string $otp): bool   // Validates OTP and expiry
markVerified(): void         // Updates verified=true, verified_at=now()
```

### EmailVerification Model

```php
// Methods
isExpired(): bool            // Checks if token past 7 days
isValid(string $token): bool // Validates token and expiry
markVerified(): void         // Updates verified=true, verified_at=now()
```

---

## Testing Endpoints

### 1. Request OTP

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "role": "student"
  }'
```

**Expected Response**:

```json
{
    "success": true,
    "message": "OTP sent to phone",
    "otp": "123456",
    "expires_in_minutes": 10
}
```

### 2. Verify OTP

```bash
curl -X POST "http://localhost:8000/api/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp": "123456",
    "role": "student"
  }'
```

**Expected Response**:

```json
{
    "success": true,
    "message": "OTP verified",
    "registration_token": "temp_cache_token"
}
```

### 3. Complete Registration

```bash
curl -X POST "http://localhost:8000/api/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_token": "temp_cache_token",
    "email": "student@example.com",
    "name": "John Student",
    "password": "SecurePassword123!"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Registration completed. Verify your email within 7 days.",
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "email_verification_required": true
}
```

### 4. Get User Profile

```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Next Steps

### Immediate (This Week)

1. **SMS Integration**: Set up Twilio/AWS SNS
    - Add credentials to .env
    - Create SMSService class
    - Implement requestOtp() SMS sending
    - Add rate limiting

2. **Email Service**: Set up Laravel Mail
    - Configure SMTP or use log driver for dev
    - Create EmailVerificationMailable
    - Create SendEmailVerification queued job
    - Test email sending

### Short Term (Next Week)

3. **Scheduled Jobs**: Implement 7-day lockout
    - Create LockUnverifiedAccounts command
    - Register in kernel.php
    - Test with manual schedule trigger

4. **Frontend Integration**: Build registration UI
    - Role selection dropdown
    - Phone OTP flow
    - Personal info form
    - Password setup
    - Email verification reminder

### Medium Term (2-3 Weeks)

5. **RBAC**: Implement roles & permissions
    - Design permission matrix
    - Create migrations
    - Add middleware for route protection

6. **Invitations**: School admin teacher invitations
7. **KYC**: Independent teacher & driver approval

### Long Term (1 Month+)

8. **API Gateway**: Route validation and service discovery
9. **Microservice Integration**: Connect other services (education, finance, etc.)
10. **Analytics**: Track registration conversion, failed logins, etc.

---

## Troubleshooting

### "OTP not found or expired"

- Ensure PhoneVerification table has the record
- Check if 10 minutes have passed since OTP request
- Verify OTP value matches exactly

### "Registration token invalid or expired"

- Registration token is cached for 30 minutes
- Ensure user completes registration within time window
- Check cache driver (Redis/file) is working

### "Email verification expires_at is null"

- Ensure email_verification_expires_at is set during registration
- Should be now() + 7 days
- Check User model fillable array includes this field

### JWT Token Not Working

- Verify JWT_SECRET in .env is set
- Check Authorization header format: `Bearer <token>`
- Ensure token is not expired (check JWT_TTL in config/jwt.php)
- Verify auth:api middleware is applied to protected routes

### Database Connection Errors

- Confirm DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env
- Ensure adorss_local database exists
- Run `php artisan migrate` to apply migrations
- Check MySQL is running on localhost:3306

---

## Security Considerations

1. **OTP Security**
    - 6-digit OTP: 1 million possible values
    - 10-minute expiry prevents brute force
    - Rate limit: max 3 requests per phone per hour
    - Log failed OTP attempts

2. **Email Verification**
    - 64-character random token (Str::random(64))
    - URL-safe token in email link
    - 7-day deadline enforced
    - Automatic account lockout if not verified

3. **JWT Security**
    - HS256 algorithm with secret key
    - 1-hour TTL (configurable)
    - Custom claims include role and verification status
    - Blacklist for revocation (if enabled)

4. **Account Lockout**
    - Failed login attempts tracked
    - Auto-lock after 7-day email deadline
    - Manual unlock via support/admin

5. **Password Security**
    - Bcrypt hashing (Laravel's Hash facade)
    - Minimum 8 characters (configurable)
    - No plaintext password transmission
    - HTTPS recommended in production

---

## References

- [Laravel 12 Documentation](https://laravel.com/docs/12)
- [tymon/jwt-auth Documentation](https://jwt-auth.readthedocs.io/)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
