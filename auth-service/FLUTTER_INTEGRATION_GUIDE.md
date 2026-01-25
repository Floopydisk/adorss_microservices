# Phone-First Authentication - Integration Guide for Flutter/Frontend Teams

## Quick Start

### Endpoints Overview

| Endpoint                            | Method | Auth | Purpose                                   |
| ----------------------------------- | ------ | ---- | ----------------------------------------- |
| `/auth/phone/request-otp`           | POST   | ❌   | Request OTP for phone                     |
| `/auth/phone/verify-otp`            | POST   | ❌   | Verify OTP, get registration token        |
| `/auth/phone/complete-registration` | POST   | ❌   | Create user account with email & password |
| `/auth/phone/login`                 | POST   | ❌   | Login with phone + OTP                    |
| `/auth/verify-email`                | POST   | ❌   | Verify email with token from link         |
| `/auth/login`                       | POST   | ❌   | Login with email + password               |
| `/auth/me`                          | GET    | ✅   | Get current user profile                  |
| `/auth/refresh`                     | POST   | ✅   | Refresh JWT token                         |
| `/auth/logout`                      | POST   | ✅   | Logout                                    |

---

## User Registration Flow

### Step 1: Show Role Selection

```
Frontend: Display dropdown with roles
Options: Student, Parent, Teacher

User selects role and taps "Next"
```

### Step 2: Request OTP

```javascript
// POST /auth/phone/request-otp
{
  "phone": "+1234567890",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "OTP sent to phone",
  "expires_in_minutes": 10
}
```

**UI**: Show "OTP sent to your phone. Enter code below."
**Timer**: Display 10-minute countdown (600 seconds)
**Resend**: Allow user to request OTP again

### Step 3: Verify OTP

```javascript
// POST /auth/phone/verify-otp
{
  "phone": "+1234567890",
  "otp": "123456",  // 6-digit code from SMS
  "role": "student"
}

Response:
{
  "success": true,
  "message": "OTP verified",
  "registration_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Store**: Save `registration_token` in memory/session (NOT persisted)
**Error Handling**:

- "Invalid or expired OTP" → Show error, allow retry
- "OTP not found" → Show error, go back to step 2

### Step 4: Enter Personal Info

```javascript
// POST /auth/phone/complete-registration
{
  "registration_token": "stored_from_step_3",
  "email": "student@example.com",
  "name": "John Smith",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "message": "Registration completed. Verify your email within 7 days.",
  "user": {
    "id": 1,
    "name": "John Smith",
    "email": "student@example.com",
    "phone": "+1234567890",
    "phone_verified": true,
    "email_verified": false,
    "role": "student",
    "email_verification_expires_at": "2025-02-07T12:34:56.000000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Store**: Save `token` (JWT) in secure storage (Keychain/Keystore)
**Show**: Banner: "✅ Account created! Verify your email within 7 days for full access"
**Navigate**: Go to dashboard/home screen

---

## User Login Flow

### Option A: Email + Password Login

```javascript
// POST /auth/login
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

### Option B: Phone + OTP Login

**Step 1**: Request OTP (same as registration step 2)

```javascript
POST /auth/phone/request-otp
{
  "phone": "+1234567890",
  "role": "student"
}
```

**Step 2**: Verify OTP and login

```javascript
POST /auth/phone/login
{
  "phone": "+1234567890",
  "otp": "123456",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

---

## Email Verification Flow

### During Registration

After step 4, user receives email:

```
Subject: Verify Your ADORSS Account

Click the link below to verify your email:
https://app.adorss.com/verify-email?token=abc123xyz...

This link expires in 7 days.
```

### On App Side

```javascript
// When user clicks link, extract token and call:
POST /auth/verify-email
{
  "token": "abc123xyz..."
}

Response:
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": 1,
    "email_verified": true,
    ...
  }
}
```

### Timeline & UI

- **T+0 (Registration)**: Email sent, show verification reminder
- **T+anytime**: User clicks email link, email verified ✅
- **T+7 days**: If not verified, account locked (show "Account locked" error)
- **After Verification**: Show "✅ Email verified" in profile

---

## Token Management

### Storing JWT Token

```dart
// Flutter Example
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();
String token = response['token'];

// Store securely
await storage.write(key: 'jwt_token', value: token);

// Retrieve when needed
String? token = await storage.read(key: 'jwt_token');
```

### Using JWT in Requests

```dart
// Add to headers
var headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $token',
};

var response = await http.get(
  Uri.parse('http://api.adorss.com/api/auth/me'),
  headers: headers,
);
```

### Token Expiry & Refresh

```dart
// Check if token is expired
// JWT tokens are valid for 1 hour (3600 seconds)
// Refresh when nearing expiry:

POST /auth/refresh
Headers: Authorization: Bearer <existing_token>

Response:
{
  "success": true,
  "message": "Token refreshed",
  "token": "new_jwt_token"
}
```

---

## Error Handling

### Common Errors & Recovery

| Status | Error                    | Handling                           |
| ------ | ------------------------ | ---------------------------------- |
| 422    | Validation failed        | Show specific error messages       |
| 401    | Invalid credentials      | "Email/password incorrect"         |
| 401    | Invalid OTP              | "Wrong OTP, try again"             |
| 401    | Token expired            | Refresh token or re-login          |
| 403    | Account locked           | "Account locked, contact support"  |
| 404    | User not found           | "Account doesn't exist"            |
| 409    | Phone already registered | "Phone already used for this role" |

### Example Error Response

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["Email must be a valid email address"],
        "password": ["Password must be at least 8 characters"]
    }
}
```

---

## API Base URL

### Development

```
http://localhost:8000/api
```

### Production

```
https://api.adorss.com/api
```

Configure in your app's environment config.

---

## Flutter/React Native Example

### Registration Complete Example (Dart)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final String baseUrl = 'http://localhost:8000/api';

  // Step 1: Request OTP
  Future<String?> requestOtp(String phone, String role) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/phone/request-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phone': phone,
        'role': role,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success']) {
        return data['otp']; // Only in dev
      }
    }
    return null;
  }

  // Step 2: Verify OTP
  Future<String?> verifyOtp(String phone, String otp, String role) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/phone/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phone': phone,
        'otp': otp,
        'role': role,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success']) {
        return data['registration_token'];
      }
    }
    return null;
  }

  // Step 3: Complete Registration
  Future<String?> completeRegistration(
    String token,
    String email,
    String name,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/phone/complete-registration'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'registration_token': token,
        'email': email,
        'name': name,
        'password': password,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success']) {
        // Save JWT token
        await _storage.write(key: 'jwt_token', value: data['token']);
        return data['token'];
      }
    }
    return null;
  }

  // Get user profile
  Future<Map<String, dynamic>?> getProfile() async {
    final token = await _storage.read(key: 'jwt_token');
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }
}
```

---

## Testing Checklist

- [ ] Register new student with phone OTP
- [ ] Verify email link works and marks email as verified
- [ ] Login with email + password
- [ ] Login with phone + OTP
- [ ] Refresh JWT token before expiry
- [ ] Get user profile with valid token
- [ ] Attempt login with wrong password → error
- [ ] Attempt login with invalid OTP → error
- [ ] Attempt registration with duplicate email → error
- [ ] Attempt registration with duplicate phone/role → error
- [ ] Try accessing protected endpoint without token → 401 error
- [ ] Wait 7 days without verifying email → account locked

---

## Support Resources

1. **API Documentation**: See `PHONE_AUTH_API.md` for detailed endpoint specs
2. **Implementation Guide**: See `IMPLEMENTATION_GUIDE.md` for backend details
3. **Sample Postman Collection**: See `ADORSS_API_Postman_Collection.json`

---

## FAQ

**Q: What's the format for the phone number?**
A: Accept international format like "+1234567890" or local format "1234567890"

**Q: Can a user register for multiple roles?**
A: Yes, but phone + role must be unique. One phone per role.

**Q: What happens if user doesn't verify email within 7 days?**
A: Account gets locked. User must contact support to unlock or verify email immediately if not past deadline.

**Q: Can we send email verification via SMS instead?**
A: Currently email only, but can be extended to SMS.

**Q: How long is the JWT token valid?**
A: 1 hour. Call `/auth/refresh` to get a new token before expiry.

**Q: Should we persist the registration_token?**
A: No, keep it in memory only. It expires in 30 minutes.

**Q: Can users change their phone number after registration?**
A: Currently not implemented. Add `/auth/me/update-phone` endpoint if needed.
