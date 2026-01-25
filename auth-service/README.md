# ADORSS Auth Service - Phone-First Authentication

## Quick Overview

A JWT-based authentication service implementing the user-specified phone-first registration flow with email verification and dual-login support.

### Status: ✅ Ready for Frontend Integration

---

## What This Does

### Registration Flow

1. User selects role (student/parent/teacher)
2. Enters phone, receives OTP via SMS (currently returned in dev)
3. Enters personal info (email, name) and password
4. Account created, email verification link sent
5. User must verify email within 7 days (or account gets locked)

### Login Options

- **Email + Password**: Traditional login
- **Phone + OTP**: SMS-based login with fresh OTP

### Email Verification

- Link sent after registration
- Must verify within 7 days
- Auto-lockout if deadline missed
- User can still use app while unverified (marked in profile)

---

## Project Structure

```
📁 auth-service/
├── 📄 README.md (this file)
├── 📄 IMPLEMENTATION_SUMMARY.md ⭐ Start here for overview
├── 📄 PHONE_AUTH_API.md - Detailed API reference with examples
├── 📄 IMPLEMENTATION_GUIDE.md - Architecture & setup guide
├── 📄 FLUTTER_INTEGRATION_GUIDE.md - Frontend integration guide
├── 📁 app/
│   ├── Http/Controllers/
│   │   ├── AuthController.php (legacy)
│   │   └── PhoneAuthController.php (NEW - phone OTP auth)
│   └── Models/
│       ├── User.php
│       ├── PhoneVerification.php
│       └── EmailVerification.php
├── 📁 routes/
│   └── api.php (all endpoints)
├── 📁 database/migrations/
│   ├── *_create_users_table.php
│   ├── *_add_auth_fields_to_users_table.php
│   ├── *_create_phone_verifications_table.php
│   └── *_create_email_verifications_table.php
└── 📁 config/
    ├── auth.php (guard configuration)
    └── jwt.php (JWT settings)
```

---

## API Endpoints

### Registration & Login (Public)

```
POST /auth/phone/request-otp           Send OTP to phone
POST /auth/phone/verify-otp            Verify OTP, get registration token
POST /auth/phone/complete-registration Create user account
POST /auth/phone/login                 Login with phone + OTP
POST /auth/login                       Login with email + password
POST /auth/verify-email                Verify email with token
```

### Profile & Management (Protected)

```
GET  /auth/me                          Get current user profile
POST /auth/refresh                     Get new JWT token
POST /auth/logout                      Logout
```

---

## Quick Start

### Setup

```bash
cd /g:/Dev/apiv2/microservices/auth-service

# Install PHP dependencies
composer install

# Configure .env (database, JWT secret already set)
cat .env | grep DB_

# Run database migrations
php artisan migrate

# Start dev server
php artisan serve --port=8000
```

### Test Registration

```bash
# Step 1: Request OTP
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "role": "student"}'

# Returns: { "success": true, "otp": "123456" } in dev

# Step 2: Verify OTP
curl -X POST "http://localhost:8000/api/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "123456", "role": "student"}'

# Returns: { "success": true, "registration_token": "..." }

# Step 3: Complete Registration
curl -X POST "http://localhost:8000/api/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_token": "...",
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123!"
  }'

# Returns: { "success": true, "token": "jwt_token_here" }
```

---

## Key Features

✅ Phone-first OTP registration
✅ Email verification with 7-day deadline
✅ Dual login (email+password OR phone+OTP)
✅ JWT authentication with custom claims
✅ Account lockout for unverified emails
✅ Multi-role support (student/parent/teacher/driver/admin/etc.)
✅ Last login tracking
✅ Comprehensive error handling
✅ Secure password hashing (Bcrypt)

---

## Documentation Files

| File                             | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| **IMPLEMENTATION_SUMMARY.md**    | Executive summary, status, tech stack ⭐      |
| **PHONE_AUTH_API.md**            | Complete API reference with all endpoints     |
| **IMPLEMENTATION_GUIDE.md**      | Architecture, database schema, checklist      |
| **FLUTTER_INTEGRATION_GUIDE.md** | Frontend integration guide with code examples |

👉 **Start with IMPLEMENTATION_SUMMARY.md** for a complete overview.

---

## Technology Stack

- **Language**: PHP 8.3+
- **Framework**: Laravel 12
- **Database**: MySQL (adorss_local)
- **Authentication**: JWT (tymon/jwt-auth v2.2.1)
- **Encryption**: HS256 (HMAC with SHA-256)

---

## Current Status

### Completed (Phase 1)

- ✅ Multi-step phone registration endpoints
- ✅ OTP generation and verification
- ✅ Email verification system (token-based)
- ✅ JWT token generation with custom claims
- ✅ Dual login methods
- ✅ Account lockout mechanism
- ✅ Database schema and migrations
- ✅ API documentation (3 comprehensive guides)

### In Progress (Phase 2)

- 🔄 SMS integration (Twilio/AWS SNS)
- 🔄 Email service (Laravel Mail)
- 🔄 Scheduled job for 7-day lockout enforcement

### Pending (Phases 3-6)

- ⏳ RBAC and permissions
- ⏳ School admin invitations
- ⏳ KYC verification for drivers/teachers
- ⏳ API Gateway integration
- ⏳ Password reset flow

---

## Environment Variables

Key .env settings (already configured):

```env
APP_NAME="ADORSS Auth Service"
APP_ENV=local
DB_CONNECTION=mysql
DB_DATABASE=adorss_local
DB_USERNAME=root
DB_PASSWORD=

JWT_ALGORITHM=HS256
JWT_SECRET=LgTsrfxJitXVBoApiUBs6jY78n3qVJINwe00vnuXGiOO3hP9vE7j7lX1DwWgsS5l
JWT_TTL=60  # 1 hour
```

---

## Response Format

### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error

```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        "field": ["Error message"]
    }
}
```

---

## Security Features

🔒 Bcrypt password hashing
🔒 6-digit OTP (10-minute expiry)
🔒 JWT tokens with 1-hour TTL
🔒 Email verification required (7-day deadline)
🔒 Account lockout for unverified emails
🔒 Role-based access control ready
🔒 Secure random token generation

---

## Common Issues & Solutions

**Q: OTP not being sent via SMS?**
A: SMS integration not yet implemented. OTP is returned in dev/test environments only.

**Q: Email verification link not working?**
A: Email sending not yet implemented. Endpoints are ready, just need mail service configured.

**Q: Account locked after 7 days?**
A: Email verification deadline is tracked. Scheduled job to auto-lock not yet implemented (manual check happens at login).

**Q: How do I test with Postman?**
A: Use the provided Postman collection or follow cURL examples in FLUTTER_INTEGRATION_GUIDE.md.

---

## Frontend Integration

### For Flutter/React Native teams:

👉 See **FLUTTER_INTEGRATION_GUIDE.md** for:

- Step-by-step registration flow
- Login implementations
- Token management
- Error handling
- Code examples in Dart/JavaScript

### API Base URL

```
Development:  http://localhost:8000/api
Production:   https://api.adorss.com/api (when ready)
```

---

## Useful Commands

```bash
# Start dev server
php artisan serve --port=8000

# Run migrations
php artisan migrate

# Reset database
php artisan migrate:reset

# Create a new user manually
php artisan tinker
>>> $user = \App\Models\User::create([
      'name' => 'Test',
      'email' => 'test@example.com',
      'password' => bcrypt('password'),
      'role' => 'student'
    ]);

# Generate new JWT secret
php artisan jwt:secret

# Check database connection
php artisan db:seed
```

---

## Next Steps

1. **For Frontend Teams**:
    - Read FLUTTER_INTEGRATION_GUIDE.md
    - Start building registration UI
    - Test with provided API endpoints

2. **For Backend Teams**:
    - Integrate SMS service (Twilio/AWS SNS)
    - Implement email sending service
    - Create scheduled job for 7-day lockout
    - Add RBAC system

3. **For DevOps**:
    - Set up production database
    - Configure SSL/HTTPS
    - Set up mail relay
    - Configure SMS gateway credentials
    - Set up monitoring and logging

---

## Support Resources

- **Laravel Docs**: https://laravel.com/docs/12
- **JWT Docs**: https://jwt-auth.readthedocs.io/
- **MySQL Docs**: https://dev.mysql.com/doc/
- **Project Docs**: See IMPLEMENTATION_SUMMARY.md

---

## Questions?

Refer to the comprehensive documentation files:

- **Overall Status**: IMPLEMENTATION_SUMMARY.md
- **API Details**: PHONE_AUTH_API.md
- **Architecture**: IMPLEMENTATION_GUIDE.md
- **Frontend Guide**: FLUTTER_INTEGRATION_GUIDE.md

---

**Created**: January 31, 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Frontend Integration

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
