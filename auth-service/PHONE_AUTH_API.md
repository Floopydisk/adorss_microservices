# Phone-First Authentication API Documentation

## Overview

This API implements a multi-step phone-first registration flow with OTP verification and email verification, supporting the following use cases:

1. **Phone-based Registration**: Role selection → Phone OTP → Personal info → Password
2. **Email + Password Login**: Traditional email and password login
3. **Phone + OTP Login**: Alternative login using phone number and OTP
4. **Email Verification**: 7-day deadline with account lockout enforcement

---

## Base URL

```
http://localhost:8000/api
```

---

## Authentication Endpoints

### 1. Request OTP for Registration

**Endpoint**: `POST /auth/phone/request-otp`

**Public**: Yes (No authentication required)

**Request Body**:

```json
{
    "phone": "+1234567890",
    "role": "student"
}
```

**Roles Supported**: `student`, `parent`, `teacher`

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "OTP sent to phone",
    "otp": "123456",
    "expires_in_minutes": 10
}
```

**Response (Dev/Test Only)**: OTP is returned in dev/testing environments. In production, OTP is sent via SMS only.

**Response (Duplicate Phone - 409)**:

```json
{
    "success": false,
    "message": "Phone number already registered for this role"
}
```

**Response (Validation Error - 422)**:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "phone": ["The phone format is invalid"],
        "role": ["The role must be one of: student, parent, teacher"]
    }
}
```

---

### 2. Verify OTP and Get Registration Token

**Endpoint**: `POST /auth/phone/verify-otp`

**Public**: Yes

**Request Body**:

```json
{
    "phone": "+1234567890",
    "otp": "123456",
    "role": "student"
}
```

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "OTP verified",
    "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: The `registration_token` is valid for 30 minutes and cached in Redis (or file cache in dev).

**Response (Invalid OTP - 401)**:

```json
{
    "success": false,
    "message": "Invalid or expired OTP"
}
```

**Response (OTP Not Found - 404)**:

```json
{
    "success": false,
    "message": "OTP not found or expired. Request a new one."
}
```

---

### 3. Complete Registration

**Endpoint**: `POST /auth/phone/complete-registration`

**Public**: Yes (Uses registration token)

**Request Body**:

```json
{
    "registration_token": "temp_token_from_step_2",
    "email": "student@example.com",
    "name": "John Student",
    "password": "SecurePassword123!"
}
```

**Response (Success - 201)**:

```json
{
    "success": true,
    "message": "Registration completed. Verify your email within 7 days.",
    "user": {
        "id": 1,
        "name": "John Student",
        "email": "student@example.com",
        "phone": "+1234567890",
        "phone_verified": true,
        "email_verified": false,
        "role": "student",
        "status": "active",
        "email_verification_expires_at": "2025-02-07T12:34:56.000000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "email_verification_required": true,
    "email_verification_expires_in_days": 7
}
```

**Response (Invalid Email - 422)**:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["The email has already been taken"],
        "password": ["The password must be at least 8 characters"]
    }
}
```

**Response (Expired Token - 401)**:

```json
{
    "success": false,
    "message": "Registration token invalid or expired"
}
```

---

### 4. Login with Email + Password (Legacy)

**Endpoint**: `POST /auth/login`

**Public**: Yes

**Request Body**:

```json
{
    "email": "student@example.com",
    "password": "SecurePassword123!",
    "role": "student"
}
```

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": 1,
        "name": "John Student",
        "email": "student@example.com",
        "email_verified": false,
        "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
}
```

---

### 5. Login with Phone + OTP

**Endpoint**: `POST /auth/phone/login`

**Public**: Yes

**Request Body**:

```json
{
    "phone": "+1234567890",
    "otp": "123456",
    "role": "student"
}
```

**Workflow**:

1. Client requests OTP using `/auth/phone/request-otp`
2. Client receives OTP and calls this endpoint with OTP
3. Server validates OTP and issues JWT

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": 1,
        "name": "John Student",
        "email": "student@example.com",
        "phone": "+1234567890",
        "phone_verified": true,
        "email_verified": false,
        "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
}
```

**Response (Account Locked - 403)**:

```json
{
    "success": false,
    "message": "Account locked due to unverified email (7-day deadline passed)"
}
```

---

### 6. Verify Email with Token

**Endpoint**: `POST /auth/verify-email`

**Public**: Yes (Uses email verification token from link)

**Request Body**:

```json
{
    "token": "email_verification_token_from_link"
}
```

**Typical Usage**:

- User receives email: "Verify your email: `https://app.com/verify?token=xyz`"
- Frontend extracts token and calls this endpoint

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "Email verified successfully",
    "user": {
        "id": 1,
        "name": "John Student",
        "email": "student@example.com",
        "email_verified": true
    }
}
```

**Response (Invalid Token - 401)**:

```json
{
    "success": false,
    "message": "Verification token expired"
}
```

---

### 7. Get Authenticated User Profile

**Endpoint**: `GET /auth/me`

**Protected**: Yes (Requires JWT Bearer Token)

**Headers**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200)**:

```json
{
    "id": 1,
    "name": "John Student",
    "email": "student@example.com",
    "phone": "+1234567890",
    "phone_verified": true,
    "email_verified": false,
    "role": "student",
    "status": "active",
    "email_verification_expires_at": "2025-02-07T12:34:56.000000Z",
    "created_at": "2025-01-31T12:00:00.000000Z",
    "updated_at": "2025-01-31T12:00:00.000000Z"
}
```

---

### 8. Refresh JWT Token

**Endpoint**: `POST /auth/refresh`

**Protected**: Yes (Requires valid JWT)

**Headers**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "Token refreshed",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 9. Logout

**Endpoint**: `POST /auth/logout`

**Protected**: Yes (Requires JWT)

**Headers**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success - 200)**:

```json
{
    "success": true,
    "message": "Logout successful"
}
```

---

## JWT Token Structure

### Token Payload Example:

```json
{
    "sub": 1,
    "iat": 1706704800,
    "exp": 1706708400,
    "role": "student",
    "email": "student@example.com",
    "status": "active",
    "school_id": null,
    "phone_verified": true,
    "email_verified": false
}
```

### Custom Claims:

- `role`: User's role (student, parent, teacher, etc.)
- `email`: User's email address
- `status`: Account status (active, pending, etc.)
- `school_id`: Associated school (nullable)
- `phone_verified`: Whether phone is verified
- `email_verified`: Whether email is verified

---

## User Roles & Registration Availability

| Role                  | Registration      | Login Methods               | Notes                   |
| --------------------- | ----------------- | --------------------------- | ----------------------- |
| `student`             | Phone OTP flow    | Email+password or Phone+OTP | Active immediately      |
| `parent`              | Phone OTP flow    | Email+password or Phone+OTP | Active immediately      |
| `teacher`             | Phone OTP flow    | Email+password or Phone+OTP | Active immediately      |
| `driver`              | Phone OTP flow    | Email+password or Phone+OTP | Pending approval        |
| `admin`               | Admin portal only | Email+password              | Requires admin creation |
| `school_admin`        | Admin portal only | Email+password              | Created by admin        |
| `independent_teacher` | Phone OTP flow    | Email+password or Phone+OTP | Pending KYC approval    |

---

## Email Verification & Account Lockout

### Timeline:

1. **Registration Complete** (T+0): Email verification link sent, account **active**, `email_verified = false`
2. **User Can**: Login, use app, but marked as unverified in profile
3. **Email Verified** (T+anytime): User clicks link before deadline, `email_verified = true`, account unlocked
4. **7 Days Elapsed** (T+7 days): Scheduled job locks account if still unverified, `locked = true`, `lock_reason = "Email not verified within 7 days"`

### Lockout Enforcement:

- **Scheduled Job**: `php artisan schedule:work` (runs daily check)
- **Manual Check**: Login endpoint checks deadline and auto-locks if expired
- **Recovery**: User must verify email or contact support to unlock

---

## Error Responses

### Common HTTP Status Codes:

| Code | Meaning           | Example                      |
| ---- | ----------------- | ---------------------------- |
| 200  | Success           | Login successful             |
| 201  | Created           | Registration complete        |
| 400  | Bad Request       | Malformed JSON               |
| 401  | Unauthorized      | Invalid credentials or token |
| 403  | Forbidden         | Account locked               |
| 404  | Not Found         | User or OTP not found        |
| 409  | Conflict          | Duplicate phone/email        |
| 422  | Validation Failed | Invalid input                |
| 500  | Server Error      | Internal error               |

### Standard Error Response:

```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        "field_name": ["Validation message"]
    }
}
```

---

## Testing with cURL

### Request OTP:

```bash
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "role": "student"}'
```

### Complete Registration Flow:

```bash
# Step 1: Request OTP
curl -X POST "http://localhost:8000/api/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "role": "student"}'

# Step 2: Verify OTP (use OTP from step 1)
curl -X POST "http://localhost:8000/api/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "123456", "role": "student"}'

# Step 3: Complete Registration (use registration_token from step 2)
curl -X POST "http://localhost:8000/api/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_token": "your_token_here",
    "email": "student@example.com",
    "name": "John Student",
    "password": "SecurePassword123!"
  }'

# Step 4: Login with JWT from step 3
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Integration with Frontend

### Recommended UI Flow:

1. **Role Selection Screen**: Dropdown with student/parent/teacher
2. **Phone Entry Screen**: Input phone, button "Send OTP"
    - Call `/auth/phone/request-otp`
    - Show "OTP sent, check your SMS"
3. **OTP Verification Screen**: Input 6-digit OTP, button "Verify"
    - Call `/auth/phone/verify-otp`
    - Store `registration_token` in session/state
4. **Personal Info Screen**: Input email, name, button "Next"
    - Call `/auth/phone/complete-registration` with all data
    - Store JWT token
5. **Password Screen**: Input password, button "Complete"
    - Already handled in step 4, show confirmation
    - Redirect to dashboard
6. **Email Verification Reminder**: Show banner "Verify email within 7 days"
    - Send verification email with link
    - When user clicks link, verify email via `/auth/verify-email`

---

## Notes for Developers

- **OTP Expiry**: 10 minutes
- **Registration Token Expiry**: 30 minutes
- **Email Verification Deadline**: 7 days
- **JWT Token TTL**: 1 hour (configurable in `config/jwt.php`)
- **SMS Integration**: Currently disabled (returns OTP in dev). Integrate Twilio/AWS SNS.
- **Email Sending**: Currently disabled. Integrate Laravel Mail with queue jobs.
- **Session Storage**: Uses Cache facade (Redis or file-based in dev)
- **Account Lockout**: Automatic via scheduled job or manual on login attempt
