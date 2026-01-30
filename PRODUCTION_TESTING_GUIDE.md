# Production Endpoints Testing Guide

**Date:** January 28, 2026  
**Environment:** Production  
**Test Coverage:** Auth → Education → Finance

---

## API Gateway URL

```
https://api.adorss.ng
```

All requests go through the API Gateway, which routes to:

- **Auth Service:** Internal (cPanel)
- **Education Service:** https://edu.adorss.ng
- **Finance Service:** https://finance-service-5t22.onrender.com

---

## STEP 1: AUTHENTICATION

### 1.1 Register Parent User

```bash
curl -X POST https://api.adorss.ng/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "testparent@adorss.ng",
    "phone": "+2348012345678",
    "password": "SecurePassword123!",
    "role": "parent"
  }'
```

**Optional Parameters:**

- `organization_id` - School ID (if parent is pre-registering for a specific school)
- `organization_type` - Default: "school" (other options: "fleet", "independent")

**Note:** Organization linking typically happens through the Education Service when children are enrolled, not during initial registration.

**Expected Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid",
    "email": "testparent@adorss.ng",
    "role": "parent",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.2 Login with Email & Password

```bash
curl -X POST https://api.adorss.ng/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testparent@adorss.ng",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "testparent@adorss.ng",
      "role": "parent"
    }
  }
}
```

**⚠️ Save the token - you'll need it for all other requests**

### 1.3 Register with Phone OTP

```bash
# Step 1: Request OTP
curl -X POST https://api.adorss.ng/auth/phone/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "role": "parent"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "OTP sent to your phone. It will expire in 10 minutes.",
#   "expires_in_minutes": 10
# }

# Step 2: Verify OTP
# 🚀 DEVELOPMENT MODE: Use static OTP "123456" (no SMS needed)
curl -X POST https://api.adorss.ng/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "otp": "123456",
    "role": "parent"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "OTP verified",
#   "registration_token": "abc123..."
# }

# Step 3: Complete Registration with email and password
curl -X POST https://api.adorss.ng/auth/phone/complete-registration \
  -H "Content-Type: application/json" \
  -d '{
    "registration_token": "abc123...",
    "email": "testparent@adorss.ng",
    "name": "Test Parent",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!"
  }'
```

### 1.4 Login with Phone OTP

```bash
# Step 1: Request Login OTP
curl -X POST https://api.adorss.ng/auth/phone/request-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "role": "parent"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "OTP sent to your phone. It will expire in 10 minutes.",
#   "expires_in_minutes": 10
# }

# Step 2: Login with OTP
# 🚀 DEVELOPMENT MODE: Use static OTP "123456" (no SMS needed)
curl -X POST https://api.adorss.ng/auth/phone/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "otp": "123456",
    "role": "parent"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Login successful",
#   "user": {
#     "id": "user-uuid",
#     "name": "Test Parent",
#     "email": "testparent@adorss.ng",
#     "role": "parent"
#   },
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "expires_in": 3600
# }
```

---

## STEP 2: EDUCATION SERVICE ENDPOINTS

**Base Path:** `/api/education/parent`  
**Auth Header:** `Authorization: Bearer YOUR_TOKEN_HERE`

### 2.1 Get All Children (Across All Schools)

```bash
curl -X GET https://api.adorss.ng/api/education/parent/children \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "student-uuid",
      "userId": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "schoolId": "school-uuid",
      "schoolName": "Lekki High School",
      "schoolCode": "LHS-001",
      "className": "Senior Secondary 3",
      "grade": "SSS3",
      "section": "A",
      "relationship": "son",
      "permissions": {
        "viewAssignments": true,
        "viewGrades": true,
        "viewAttendance": true
      },
      "enrollmentDate": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### 2.2 Get Parent Dashboard

```bash
curl -X GET https://api.adorss.ng/api/education/parent/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "children": [
      {
        "studentId": "student-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "className": "Senior Secondary 3",
        "grade": "SSS3",
        "relationship": "son",
        "attendanceToday": {
          "status": "present",
          "checkInTime": "2026-01-28T08:00:00.000Z"
        },
        "pendingAssignments": 3,
        "recentGrades": [
          {
            "subject": "Mathematics",
            "score": 85,
            "maxScore": 100,
            "date": "2026-01-20T00:00:00.000Z"
          }
        ]
      }
    ],
    "recentAnnouncements": [],
    "upcomingEvents": [],
    "unreadMessages": 0
  }
}
```

### 2.3 Get Child's Assignments

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/children/{STUDENT_ID}/assignments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "assignment-uuid",
      "title": "Mathematics Problem Set Chapter 5",
      "description": "Solve all problems from 5.1 to 5.10",
      "subjectId": "math",
      "dueDate": "2026-02-05T17:00:00.000Z",
      "totalMarks": 100,
      "status": "published",
      "isOverdue": false,
      "submission": {
        "submittedAt": "2026-01-28T10:30:00.000Z",
        "grade": 85,
        "feedback": "Excellent work!",
        "gradedAt": "2026-01-28T14:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 2.4 Get Child's Grades

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/children/{STUDENT_ID}/grades?academicYear=2025-2026" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "grades": [
      {
        "id": "grade-uuid",
        "studentId": "student-uuid",
        "subjectId": "mathematics",
        "academicYear": "2025-2026",
        "term": "1",
        "percentage": 85,
        "letterGrade": "A",
        "assessments": [
          {
            "name": "Quiz 1",
            "score": 18,
            "maxScore": 20,
            "date": "2026-01-15T00:00:00.000Z"
          },
          {
            "name": "Midterm",
            "score": 82,
            "maxScore": 100,
            "date": "2026-01-20T00:00:00.000Z"
          }
        ]
      }
    ],
    "summary": {
      "totalSubjects": 8,
      "overallPercentage": 82.5,
      "assessmentCount": 24
    }
  }
}
```

### 2.5 Get Child's Attendance

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/children/{STUDENT_ID}/attendance?month=01&year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "attendance-uuid",
        "studentId": "student-uuid",
        "date": "2026-01-28T00:00:00.000Z",
        "status": "present",
        "checkInTime": "2026-01-28T07:45:00.000Z",
        "checkOutTime": "2026-01-28T15:00:00.000Z"
      }
    ],
    "stats": {
      "totalDays": 20,
      "present": 18,
      "absent": 1,
      "late": 1,
      "excused": 0,
      "attendanceRate": 95.0
    }
  }
}
```

### 2.6 Get Child's Timetable

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/children/{STUDENT_ID}/timetable" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "timetable-uuid",
    "classId": "class-uuid",
    "academicYear": "2025-2026",
    "term": "2",
    "effectiveFrom": "2026-01-20T00:00:00.000Z",
    "effectiveTo": "2026-04-10T00:00:00.000Z",
    "schedule": [
      {
        "day": "Monday",
        "periods": [
          {
            "startTime": "08:00",
            "endTime": "09:00",
            "subject": "Mathematics",
            "teacher": "Mr. Adeyemi"
          }
        ]
      }
    ]
  }
}
```

### 2.7 Get Child's Results

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/children/{STUDENT_ID}/results?academicYear=2025-2026&term=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "result-uuid",
      "studentId": "student-uuid",
      "academicYear": "2025-2026",
      "term": "1",
      "examType": "midterm",
      "position": 5,
      "totalStudents": 120,
      "gpa": 3.8,
      "results": [
        {
          "subjectId": "mathematics",
          "score": 85,
          "maxScore": 100,
          "grade": "A"
        }
      ],
      "publishedAt": "2026-01-28T00:00:00.000Z"
    }
  ]
}
```

### 2.8 Get Announcements

```bash
curl -X GET "https://api.adorss.ng/api/education/parent/announcements?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "announcement-uuid",
      "title": "School Holiday Notice",
      "content": "School will be closed on February 14 for Valentine's Day",
      "type": "notice",
      "targetAudience": ["parents", "students"],
      "isPinned": true,
      "publishAt": "2026-01-28T10:00:00.000Z",
      "expiresAt": "2026-02-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

## STEP 3: FINANCE SERVICE ENDPOINTS

**Base Path:** `/api/finance/parent`  
**Auth Header:** `Authorization: Bearer YOUR_TOKEN_HERE`

### 3.1 Get All Fees (Grouped by School)

```bash
curl -X GET "https://api.adorss.ng/api/finance/parent/fees" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "schoolId": "school-uuid",
      "schoolName": "Lekki High School",
      "totalFees": 150000,
      "totalPaid": 100000,
      "totalBalance": 50000,
      "currency": "NGN",
      "children": [
        {
          "studentId": "student-uuid",
          "studentName": "John Doe",
          "className": "SSS3",
          "totalFees": 150000,
          "totalPaid": 100000,
          "balance": 50000,
          "pendingItems": 2,
          "overdueItems": 1
        }
      ]
    }
  ]
}
```

### 3.2 Get Specific Child's Fees

```bash
curl -X GET "https://api.adorss.ng/api/finance/parent/fees/{STUDENT_ID}?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student-uuid",
      "name": "John Doe",
      "schoolName": "Lekki High School",
      "className": "SSS3"
    },
    "fees": [
      {
        "id": "fee-uuid",
        "feeName": "Tuition Fee",
        "feeType": "tuition",
        "amount": 100000,
        "discount": 0,
        "totalAmount": 100000,
        "paidAmount": 60000,
        "balance": 40000,
        "dueDate": "2026-02-28T23:59:59.000Z",
        "status": "partial",
        "academicYear": "2025-2026",
        "term": "2"
      },
      {
        "id": "fee-uuid-2",
        "feeName": "Registration Fee",
        "feeType": "registration",
        "amount": 20000,
        "discount": 0,
        "totalAmount": 20000,
        "paidAmount": 20000,
        "balance": 0,
        "dueDate": "2026-01-31T23:59:59.000Z",
        "status": "paid",
        "academicYear": "2025-2026",
        "term": "1"
      }
    ],
    "summary": {
      "totalFees": 150000,
      "totalPaid": 100000,
      "totalBalance": 50000,
      "pendingCount": 2,
      "overdueCount": 1
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 3.3 Get Payment History

```bash
curl -X GET "https://api.adorss.ng/api/finance/parent/payments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "studentFeeId": "fee-uuid",
      "studentId": "student-uuid",
      "parentId": "parent-uuid",
      "schoolId": "school-uuid",
      "amount": 50000,
      "paymentMethod": "bank_transfer",
      "paymentReference": "REF-2026-01-28-001",
      "paymentStatus": "completed",
      "transactionId": "TXN-2026-01-28-001",
      "createdAt": "2026-01-28T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

### 3.4 Get All Receipts

```bash
curl -X GET "https://api.adorss.ng/api/finance/parent/receipts?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "receipt-uuid",
      "studentId": "student-uuid",
      "parentId": "parent-uuid",
      "schoolId": "school-uuid",
      "receiptNumber": "RCP-2026-01-28-001",
      "totalAmount": 50000,
      "currency": "NGN",
      "paymentMethod": "bank_transfer",
      "receiptType": "individual_payment",
      "generatedAt": "2026-01-28T14:30:00.000Z",
      "issuedAt": "2026-01-28T14:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 3.5 Get Specific Receipt

```bash
curl -X GET "https://api.adorss.ng/api/finance/parent/receipts/{RECEIPT_ID}" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "receipt-uuid",
    "studentId": "student-uuid",
    "parentId": "parent-uuid",
    "schoolId": "school-uuid",
    "receiptNumber": "RCP-2026-01-28-001",
    "totalAmount": 50000,
    "currency": "NGN",
    "paymentMethod": "bank_transfer",
    "receiptType": "individual_payment",
    "generatedAt": "2026-01-28T14:30:00.000Z",
    "issuedAt": "2026-01-28T14:35:00.000Z",
    "downloadedAt": null
  }
}
```

---

## TESTING CHECKLIST

### Auth Service

- [ ] Register parent user (email/password)
- [ ] Login with email/password
- [ ] Register with phone OTP (use static OTP "123456")
- [ ] Login with phone OTP (use static OTP "123456")
- [ ] Verify token is returned and valid
- [ ] Test token in subsequent requests

### Education Service

- [ ] Get all children (multiple schools)
- [ ] View parent dashboard
- [ ] Get child's assignments
- [ ] Get child's grades
- [ ] Get child's attendance
- [ ] Get child's timetable
- [ ] Get child's exam results
- [ ] Get school announcements

### Finance Service

- [ ] Get all fees grouped by school
- [ ] Get specific child's fees
- [ ] Get payment history
- [ ] Get all receipts
- [ ] Get specific receipt

---

## TROUBLESHOOTING

### 401 Unauthorized

- **Issue:** Token is invalid or expired
- **Fix:** Re-login and get a new token

### 403 Forbidden

- **Issue:** Missing required permissions
- **Fix:** Verify parent has permission to view this student

### 404 Not Found

- **Issue:** Resource doesn't exist
- **Fix:** Verify the studentId/receiptId is correct

### 500 Server Error

- **Issue:** Service is down or database error
- **Fix:** Check service status in Render/cPanel dashboard

---

## NOTES

- Replace `YOUR_TOKEN_HERE` with actual JWT token from login
- Replace `{STUDENT_ID}` with actual student UUID
- Replace `{RECEIPT_ID}` with actual receipt UUID
- All dates are in ISO 8601 format
- Currency is NGN (Nigerian Naira)
- Page numbers are 1-indexed

---

## DEVELOPMENT MODE - OTP BYPASS

**🚀 Static OTP for Testing:** `123456`

In development environments, all phone OTP endpoints accept the static OTP `123456` to bypass AWS SNS configuration. This allows full testing of:

- ✅ Phone registration flows
- ✅ Phone login flows
- ✅ Password reset flows (future)

**No SMS will be sent in development mode** - the system logs OTP requests instead. Simply use `123456` for all OTP verifications.

This bypass is **automatically disabled in production** (`APP_ENV=production`).

For complete documentation, see: [DEV_OTP_BYPASS_GUIDE.md](auth-service/DEV_OTP_BYPASS_GUIDE.md)
