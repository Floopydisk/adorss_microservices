# Education Service API Documentation

**Base URL:** `https://api.adorss.ng`  
**Authentication:** All endpoints require JWT Bearer token in Authorization header

```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Ward Management](#ward-management)
2. [Transport Tracking](#transport-tracking) _(via Mobility Service)_
3. [Parent Dashboard & Academic](#parent-dashboard--academic)
4. [Mobility Service Endpoints](#mobility-service-endpoints) _(Fleet & Drivers)_

---

## Ward Management

Base path: `/api/parent/wards`

### Get All Wards

Returns all children linked to the authenticated parent.

```
GET /api/parent/wards
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeTransport` | boolean | No | Include transport details (default: false) |
| `includeAcademic` | boolean | No | Include academic summary (default: false) |

**Response:**

```json
{
  "success": true,
  "data": {
    "wards": [
      {
        "studentId": "string",
        "firstName": "string",
        "lastName": "string",
        "dateOfBirth": "2015-03-15",
        "gender": "male|female|other",
        "profileImage": "string|null",
        "school": {
          "id": "string",
          "name": "string",
          "address": "string"
        },
        "class": {
          "id": "string",
          "name": "string",
          "section": "string",
          "academicYear": "string"
        },
        "enrollmentDate": "2024-01-15",
        "status": "active|inactive|suspended|graduated",
        "permissions": {
          "viewGrades": true,
          "viewAttendance": true,
          "viewAssignments": true,
          "trackLocation": true,
          "contactTeachers": true,
          "receiveAlerts": true
        },
        "transport": {
          "hasTransport": true,
          "routeName": "string",
          "stopName": "string",
          "pickupTime": "07:30",
          "dropoffTime": "15:30"
        },
        "academic": {
          "currentGPA": 3.5,
          "attendanceRate": 95.5,
          "pendingAssignments": 2
        }
      }
    ],
    "totalCount": 1
  }
}
```

---

### Get Ward Details

Returns detailed information for a specific ward.

```
GET /api/parent/wards/:studentId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "2015-03-15",
      "gender": "string",
      "profileImage": "string|null",
      "admissionNumber": "string",
      "bloodGroup": "string|null",
      "allergies": ["string"],
      "medicalConditions": ["string"],
      "emergencyContact": {
        "name": "string",
        "relationship": "string",
        "phone": "string"
      }
    },
    "school": {
      "id": "string",
      "name": "string",
      "address": "string",
      "phone": "string",
      "email": "string"
    },
    "class": {
      "id": "string",
      "name": "string",
      "section": "string",
      "academicYear": "string",
      "classTeacher": {
        "name": "string",
        "email": "string"
      }
    },
    "transport": {
      "hasTransport": true,
      "route": {
        "id": "string",
        "name": "string",
        "vehicle": {
          "number": "string",
          "type": "string"
        },
        "driver": {
          "name": "string",
          "phone": "string"
        }
      },
      "stop": {
        "name": "string",
        "pickupTime": "07:30",
        "dropoffTime": "15:30",
        "location": {
          "latitude": 6.5244,
          "longitude": 3.3792
        }
      }
    },
    "permissions": {
      "viewGrades": true,
      "viewAttendance": true,
      "viewAssignments": true,
      "trackLocation": true,
      "contactTeachers": true,
      "receiveAlerts": true
    },
    "settings": {
      "notifications": {
        "attendance": true,
        "grades": true,
        "assignments": true,
        "transport": true,
        "announcements": true
      },
      "alerts": {
        "lowGrade": true,
        "lowGradeThreshold": 50,
        "missedAssignment": true,
        "absence": true,
        "transportDelay": true,
        "transportDelayMinutes": 10
      }
    }
  }
}
```

---

### List Enrollment Requests

Returns all enrollment requests submitted by the parent.

```
GET /api/parent/wards/enrollment/requests
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `pending`, `under_review`, `approved`, `rejected`, `withdrawn` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10, max: 50) |

**Response:**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "string",
        "status": "pending",
        "studentInfo": {
          "firstName": "string",
          "lastName": "string",
          "dateOfBirth": "2015-03-15"
        },
        "schoolId": "string",
        "schoolName": "string",
        "classRequested": "string",
        "submittedAt": "2024-01-15T10:30:00Z",
        "lastUpdated": "2024-01-16T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### Create Enrollment Request

Creates a new enrollment request (initially as draft).

```
POST /api/parent/wards/enrollment/requests
```

**Request Body:**

```json
{
  "studentInfo": {
    "firstName": "string", // Required
    "lastName": "string", // Required
    "middleName": "string", // Optional
    "dateOfBirth": "2015-03-15", // Required (YYYY-MM-DD)
    "gender": "male|female|other", // Required
    "bloodGroup": "string", // Optional
    "allergies": ["string"], // Optional
    "medicalConditions": ["string"] // Optional
  },
  "schoolId": "string", // Required
  "classRequested": "string", // Required (e.g., "Grade 1", "JSS 1")
  "academicYear": "string", // Required (e.g., "2024/2025")
  "previousSchool": {
    // Optional
    "name": "string",
    "address": "string",
    "lastClassAttended": "string",
    "reasonForLeaving": "string"
  },
  "documents": [
    // Optional
    {
      "type": "birth_certificate|report_card|transfer_certificate|immunization|passport_photo|other",
      "url": "string",
      "name": "string"
    }
  ],
  "transportRequired": false, // Optional (default: false)
  "preferredPickupLocation": {
    // Optional, required if transportRequired is true
    "address": "string",
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "emergencyContact": {
    // Required
    "name": "string",
    "relationship": "string",
    "phone": "string",
    "alternatePhone": "string" // Optional
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "status": "draft",
    "message": "Enrollment request created as draft. Submit when ready."
  }
}
```

---

### Get Enrollment Request Details

```
GET /api/parent/wards/enrollment/requests/:requestId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestId` | string | Yes | The enrollment request ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "pending",
    "studentInfo": { ... },
    "schoolId": "string",
    "school": {
      "name": "string",
      "address": "string"
    },
    "classRequested": "string",
    "academicYear": "string",
    "previousSchool": { ... },
    "documents": [ ... ],
    "transportRequired": false,
    "preferredPickupLocation": { ... },
    "emergencyContact": { ... },
    "statusHistory": [
      {
        "status": "draft",
        "timestamp": "2024-01-15T10:30:00Z",
        "note": "Request created"
      }
    ],
    "adminNotes": "string|null",
    "rejectionReason": "string|null",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:00:00Z"
  }
}
```

---

### Update Draft Enrollment Request

Updates a draft enrollment request. Only drafts can be updated.

```
PATCH /api/parent/wards/enrollment/requests/:requestId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestId` | string | Yes | The enrollment request ID |

**Request Body:** Same as Create Enrollment Request (all fields optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "status": "draft",
    "message": "Enrollment request updated"
  }
}
```

---

### Submit Enrollment Request

Submits a draft request for review.

```
PATCH /api/parent/wards/enrollment/requests/:requestId/submit
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestId` | string | Yes | The enrollment request ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "status": "pending",
    "message": "Enrollment request submitted for review"
  }
}
```

**Errors:**

- `400` - Request is not in draft status
- `400` - Required fields missing (validation errors returned)

---

### Get Ward Settings

```
GET /api/parent/wards/:studentId/settings
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "studentId": "string",
    "notifications": {
      "attendance": true,
      "grades": true,
      "assignments": true,
      "transport": true,
      "announcements": true,
      "emergencies": true
    },
    "alerts": {
      "lowGrade": true,
      "lowGradeThreshold": 50,
      "missedAssignment": true,
      "absence": true,
      "transportDelay": true,
      "transportDelayMinutes": 10,
      "approachingStop": true,
      "approachingStopMinutes": 5
    },
    "communicationPreferences": {
      "email": true,
      "sms": true,
      "pushNotification": true
    }
  }
}
```

---

### Update Ward Settings

```
PUT /api/parent/wards/:studentId/settings
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Request Body:**

```json
{
  "notifications": {
    // Optional - partial updates allowed
    "attendance": true, // Optional
    "grades": true, // Optional
    "assignments": true, // Optional
    "transport": true, // Optional
    "announcements": true, // Optional
    "emergencies": true // Optional
  },
  "alerts": {
    // Optional - partial updates allowed
    "lowGrade": true, // Optional
    "lowGradeThreshold": 50, // Optional (0-100)
    "missedAssignment": true, // Optional
    "absence": true, // Optional
    "transportDelay": true, // Optional
    "transportDelayMinutes": 10, // Optional (1-60)
    "approachingStop": true, // Optional
    "approachingStopMinutes": 5 // Optional (1-30)
  },
  "communicationPreferences": {
    // Optional - partial updates allowed
    "email": true, // Optional
    "sms": true, // Optional
    "pushNotification": true // Optional
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Settings updated successfully",
    "settings": { ... }
  }
}
```

---

### Update Emergency Contact

```
PATCH /api/parent/wards/:studentId/emergency-contact
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Request Body:**

```json
{
  "name": "string", // Required
  "relationship": "string", // Required
  "phone": "string", // Required
  "alternatePhone": "string" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Emergency contact updated",
    "emergencyContact": {
      "name": "string",
      "relationship": "string",
      "phone": "string",
      "alternatePhone": "string|null"
    }
  }
}
```

---

### Get Pickup Authorizations

```
GET /api/parent/wards/:studentId/pickup-authorizations
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `active`, `expired`, `used`, `cancelled` |
| `includeExpired` | boolean | No | Include expired authorizations (default: false) |

**Response:**

```json
{
  "success": true,
  "data": {
    "authorizations": [
      {
        "id": "string",
        "authorizedPerson": {
          "name": "string",
          "relationship": "string",
          "phone": "string",
          "idNumber": "string",
          "photo": "string|null"
        },
        "validFrom": "2024-01-20T00:00:00Z",
        "validUntil": "2024-01-20T23:59:59Z",
        "verificationCode": "ABC123",
        "status": "active",
        "reason": "string|null",
        "usedAt": "2024-01-20T15:30:00Z|null",
        "createdAt": "2024-01-19T10:00:00Z"
      }
    ]
  }
}
```

---

### Create Pickup Authorization

Creates a temporary authorization for someone else to pick up the child.

```
POST /api/parent/wards/:studentId/pickup-authorizations
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Request Body:**

```json
{
  "authorizedPerson": {
    "name": "string", // Required
    "relationship": "string", // Required
    "phone": "string", // Required
    "idNumber": "string", // Optional - ID/License number for verification
    "photo": "string" // Optional - URL to photo
  },
  "validFrom": "2024-01-20T00:00:00Z", // Required (ISO 8601)
  "validUntil": "2024-01-20T23:59:59Z", // Required (ISO 8601)
  "reason": "string" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "authorizationId": "string",
    "verificationCode": "ABC123",
    "message": "Pickup authorization created. Share the verification code with the authorized person.",
    "validFrom": "2024-01-20T00:00:00Z",
    "validUntil": "2024-01-20T23:59:59Z"
  }
}
```

**Notes:**

- Verification code is 6 characters (alphanumeric)
- School staff will verify this code before releasing the child
- Maximum validity period is 7 days

---

### Cancel Pickup Authorization

```
DELETE /api/parent/wards/:studentId/pickup-authorizations/:authorizationId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |
| `authorizationId` | string | Yes | The authorization ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Pickup authorization cancelled"
  }
}
```

---

## Transport Tracking

Base path: `/api/parent/transport`

### Get Transport Overview

Returns transport status overview for all wards.

```
GET /api/parent/transport/overview
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "studentId": "string",
      "studentName": "string",
      "hasTransport": true,
      "currentStatus": "awaiting_pickup|in_transit|on_bus|at_school|dropped_off|picked_up|not_scheduled",
      "route": {
        "id": "string",
        "name": "string"
      },
      "nextEvent": {
        "type": "pickup|dropoff",
        "scheduledTime": "07:30",
        "eta": "07:25",
        "stop": "string"
      },
      "vehicle": {
        "number": "string",
        "hasLiveTracking": true
      }
    }
  ]
}
```

---

### Get Transport Status

Returns current transport status for a specific ward.

```
GET /api/parent/transport/wards/:studentId/status
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "studentId": "string",
    "studentName": "string",
    "status": "awaiting_pickup|in_transit|on_bus|at_school|dropped_off|picked_up|not_scheduled",
    "statusDescription": "Waiting for morning pickup",
    "lastUpdated": "2024-01-20T07:15:00Z",
    "schedule": {
      "type": "morning|afternoon",
      "scheduledPickupTime": "07:30",
      "scheduledDropoffTime": "08:00",
      "actualPickupTime": "07:28|null",
      "actualDropoffTime": "null"
    },
    "route": {
      "id": "string",
      "name": "string",
      "currentStopIndex": 3,
      "totalStops": 8,
      "studentStopIndex": 5
    },
    "vehicle": {
      "number": "string",
      "type": "bus|van",
      "driver": {
        "name": "string",
        "phone": "string"
      }
    },
    "location": {
      "available": true,
      "latitude": 6.5244,
      "longitude": 3.3792,
      "heading": 180,
      "speed": 25,
      "updatedAt": "2024-01-20T07:15:00Z"
    },
    "eta": {
      "minutes": 12,
      "arrivalTime": "07:27",
      "confidence": "high|medium|low",
      "delayMinutes": 0
    }
  }
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `awaiting_pickup` | Waiting for bus to arrive at pickup point |
| `in_transit` | Bus is on the way |
| `on_bus` | Student has boarded the bus |
| `at_school` | Student has arrived at school |
| `dropped_off` | Student dropped off at home stop |
| `picked_up` | Student picked up by authorized person |
| `not_scheduled` | No transport scheduled for today |

---

### Get Real-Time Tracking

Returns real-time tracking data with route visualization info.

```
GET /api/parent/transport/wards/:studentId/track
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "tracking": {
      "isActive": true,
      "currentLocation": {
        "latitude": 6.5244,
        "longitude": 3.3792,
        "heading": 180,
        "speed": 25,
        "accuracy": 10,
        "updatedAt": "2024-01-20T07:15:00Z"
      },
      "route": {
        "id": "string",
        "name": "string",
        "polyline": "encoded_polyline_string",
        "stops": [
          {
            "index": 0,
            "name": "Start Point",
            "latitude": 6.51,
            "longitude": 3.37,
            "scheduledTime": "07:00",
            "status": "completed",
            "actualTime": "07:02"
          },
          {
            "index": 1,
            "name": "Student Stop",
            "latitude": 6.5244,
            "longitude": 3.3792,
            "scheduledTime": "07:30",
            "status": "pending|approaching|arrived|completed",
            "isStudentStop": true,
            "eta": "07:27"
          }
        ]
      },
      "progress": {
        "completedStops": 3,
        "totalStops": 8,
        "percentComplete": 37.5,
        "distanceRemaining": 5.2,
        "distanceUnit": "km"
      },
      "delay": {
        "isDelayed": false,
        "delayMinutes": 0,
        "reason": "string|null"
      }
    },
    "refreshInterval": 10
  }
}
```

**Notes:**

- `refreshInterval` indicates recommended seconds between API calls
- `polyline` is Google-encoded polyline for map rendering
- Stop status: `pending`, `approaching`, `arrived`, `completed`, `skipped`

---

### Get ETA

Returns estimated time of arrival for the student's stop.

```
GET /api/parent/transport/wards/:studentId/eta
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | ETA type: `pickup` or `dropoff` (default: based on time of day) |

**Response:**

```json
{
  "success": true,
  "data": {
    "type": "pickup|dropoff",
    "stopName": "string",
    "scheduledTime": "07:30",
    "eta": {
      "time": "07:27",
      "minutes": 12,
      "confidence": "high|medium|low",
      "factors": {
        "traffic": "normal|light|heavy",
        "weather": "clear|rain|fog",
        "currentDelay": 0
      }
    },
    "vehicle": {
      "distanceAway": 2.5,
      "distanceUnit": "km",
      "stopsAway": 2
    },
    "calculatedAt": "2024-01-20T07:15:00Z"
  }
}
```

**Confidence Levels:**
| Level | Description |
|-------|-------------|
| `high` | Live GPS data available, vehicle moving normally |
| `medium` | GPS data available but may be stale, or traffic uncertain |
| `low` | Using scheduled times, no live data |

---

### Get Today's Transport Summary

```
GET /api/parent/transport/wards/:studentId/today
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "hasTransport": true,
    "morning": {
      "scheduled": true,
      "status": "completed|in_progress|pending|cancelled|absent",
      "pickup": {
        "stopName": "string",
        "scheduledTime": "07:30",
        "actualTime": "07:28|null",
        "status": "completed|pending"
      },
      "dropoff": {
        "location": "School Name",
        "scheduledTime": "08:00",
        "actualTime": "07:55|null",
        "status": "completed|pending"
      }
    },
    "afternoon": {
      "scheduled": true,
      "status": "pending",
      "pickup": {
        "location": "School Name",
        "scheduledTime": "15:00",
        "actualTime": null,
        "status": "pending"
      },
      "dropoff": {
        "stopName": "string",
        "scheduledTime": "15:30",
        "actualTime": null,
        "status": "pending"
      }
    },
    "notes": "string|null"
  }
}
```

---

### Get Route Information

```
GET /api/parent/transport/wards/:studentId/route
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "route": {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "type": "morning|afternoon|both",
      "vehicle": {
        "number": "string",
        "type": "bus|van",
        "capacity": 40,
        "features": ["air_conditioning", "gps_tracking", "cctv"]
      },
      "driver": {
        "name": "string",
        "phone": "string",
        "photo": "string|null"
      },
      "assistant": {
        "name": "string",
        "phone": "string"
      },
      "stops": [
        {
          "index": 0,
          "name": "string",
          "address": "string",
          "latitude": 6.5244,
          "longitude": 3.3792,
          "pickupTime": "07:30",
          "dropoffTime": "15:30",
          "isStudentStop": true,
          "studentsCount": 3
        }
      ],
      "totalDistance": 15.5,
      "estimatedDuration": 45,
      "operatingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    "studentStop": {
      "index": 3,
      "name": "string",
      "address": "string",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "morningPickupTime": "07:30",
      "afternoonDropoffTime": "15:30"
    }
  }
}
```

---

### Get Transport History

```
GET /api/parent/transport/wards/:studentId/history
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date (YYYY-MM-DD), default: 7 days ago |
| `endDate` | string | No | End date (YYYY-MM-DD), default: today |
| `type` | string | No | Filter by type: `morning`, `afternoon` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2024-01-20",
        "type": "morning|afternoon",
        "status": "completed|absent|cancelled",
        "route": {
          "id": "string",
          "name": "string"
        },
        "pickup": {
          "scheduledTime": "07:30",
          "actualTime": "07:28",
          "location": "string",
          "delayMinutes": -2
        },
        "dropoff": {
          "scheduledTime": "08:00",
          "actualTime": "07:55",
          "location": "string",
          "delayMinutes": -5
        },
        "notes": "string|null"
      }
    ],
    "summary": {
      "totalTrips": 40,
      "completedTrips": 38,
      "missedTrips": 2,
      "averagePickupDelay": 1.5,
      "averageDropoffDelay": -2.3,
      "onTimePercentage": 95
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 40,
      "pages": 2
    }
  }
}
```

---

### Notify Transport Absence

Notifies the school that the student will not use transport.

```
POST /api/parent/transport/wards/:studentId/notify-absence
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Request Body:**

```json
{
  "date": "2024-01-21", // Required (YYYY-MM-DD)
  "type": "morning|afternoon|both", // Required
  "reason": "string", // Optional
  "alternativeArrangement": "string" // Optional - e.g., "Parent will drop off"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Transport absence notification sent",
    "notificationId": "string",
    "date": "2024-01-21",
    "type": "morning",
    "acknowledged": false
  }
}
```

---

## Parent Dashboard & Academic

Base path: `/api/parent`

### Get Dashboard

```
GET /api/parent/dashboard
```

**Response:**

```json
{
  "success": true,
  "data": {
    "parent": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "children": [
      {
        "id": "string",
        "name": "string",
        "school": "string",
        "class": "string",
        "profileImage": "string|null",
        "academicSummary": {
          "currentGPA": 3.5,
          "attendanceRate": 95.5,
          "pendingAssignments": 2
        },
        "transportStatus": {
          "status": "string",
          "nextEvent": "string",
          "eta": "07:27"
        }
      }
    ],
    "recentAnnouncements": [ ... ],
    "upcomingEvents": [ ... ]
  }
}
```

### Get Child Assignments

```
GET /api/parent/children/:studentId/assignments
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `pending`, `submitted`, `graded`, `overdue` |
| `subject` | string | No | Filter by subject ID |
| `startDate` | string | No | Filter from date (YYYY-MM-DD) |
| `endDate` | string | No | Filter to date (YYYY-MM-DD) |

### Get Child Grades

```
GET /api/parent/children/:studentId/grades
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | No | Filter by term |
| `subject` | string | No | Filter by subject ID |
| `type` | string | No | Filter: `exam`, `test`, `assignment`, `project` |

### Get Child Attendance

```
GET /api/parent/children/:studentId/attendance
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | number | No | Month (1-12) |
| `year` | number | No | Year (e.g., 2024) |
| `startDate` | string | No | Start date (YYYY-MM-DD) |
| `endDate` | string | No | End date (YYYY-MM-DD) |

### Get Child Results

```
GET /api/parent/children/:studentId/results
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | The student's unique ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | No | Filter by term |
| `academicYear` | string | No | Filter by academic year |

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**

| Code                     | HTTP Status | Description                                           |
| ------------------------ | ----------- | ----------------------------------------------------- |
| `UNAUTHORIZED`           | 401         | Missing or invalid JWT token                          |
| `FORBIDDEN`              | 403         | User doesn't have permission for this action          |
| `NOT_FOUND`              | 404         | Resource not found                                    |
| `VALIDATION_ERROR`       | 400         | Invalid request parameters                            |
| `LINK_NOT_FOUND`         | 404         | No parent-student link exists                         |
| `PERMISSION_DENIED`      | 403         | Parent doesn't have required permission for this ward |
| `TRANSPORT_NOT_ASSIGNED` | 404         | Student doesn't have transport assigned               |
| `ALREADY_EXISTS`         | 409         | Resource already exists                               |

---

## Mobility Service Endpoints

Base path: `/api/mobility`

The Mobility Service handles fleet management, drivers, vehicles, and ride-sharing functionality.
Transport tracking for parents is proxied through the Education Service endpoints above.

### Routes

#### Get All Routes

```
GET /api/mobility/routes
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | string | No | Filter by organization |
| `status` | string | No | Filter by status: `active`, `inactive` |
| `type` | string | No | Filter by type: `school`, `corporate`, `public` |

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "string",
        "organizationId": "string",
        "name": "Lekki Route A - Morning",
        "description": "string|null",
        "type": "school|corporate|public|custom",
        "status": "active|inactive",
        "vehicleId": "string|null",
        "driverId": "string|null",
        "stops": [
          {
            "id": "string",
            "index": 0,
            "name": "string",
            "address": "string",
            "location": { "latitude": 6.4298, "longitude": 3.4201 },
            "scheduledArrivalTime": "07:30",
            "estimatedWaitTime": 5,
            "isSchool": false,
            "isDepot": true
          }
        ],
        "totalDistance": 15.5,
        "estimatedDuration": 80,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

#### Get Route by ID

```
GET /api/mobility/routes/:routeId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `routeId` | string | Yes | The route ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "route": { ... },
    "driver": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "photo": "string|null",
      "rating": 4.8
    },
    "vehicle": {
      "id": "string",
      "registrationNumber": "LAG-123-ABC",
      "vehicleModel": "Coaster",
      "make": "Toyota",
      "type": "bus",
      "capacity": 30,
      "features": ["air_conditioning", "gps_tracking", "cctv"]
    }
  }
}
```

---

#### Get Route Tracking

```
GET /api/mobility/routes/:routeId/tracking
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `routeId` | string | Yes | The route ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeStops` | boolean | No | Include stop details (default: true) |
| `includeVehicle` | boolean | No | Include vehicle info (default: true) |

**Response:**

```json
{
  "success": true,
  "data": {
    "tracking": {
      "tripId": "string",
      "status": "in_progress",
      "currentLocation": {
        "latitude": 6.4541,
        "longitude": 3.4218,
        "heading": 180,
        "speed": 25,
        "updatedAt": "2024-01-20T07:15:00Z"
      },
      "currentStopIndex": 3,
      "progress": {
        "completedStops": 3,
        "totalStops": 6,
        "percentComplete": 50,
        "distanceRemaining": 7.8,
        "distanceUnit": "km"
      },
      "delay": {
        "isDelayed": true,
        "delayMinutes": 3,
        "reason": "Minor traffic"
      }
    },
    "route": { ... },
    "vehicle": { ... },
    "driver": { ... },
    "isActive": true
  }
}
```

---

### Drivers

#### Get All Drivers

```
GET /api/mobility/drivers
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | string | No | Filter by organization |
| `status` | string | No | Filter by status: `available`, `busy`, `offline`, `on_trip` |

**Response:**

```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "string",
        "firstName": "Adebayo",
        "lastName": "Okonkwo",
        "phone": "+2348023456789",
        "photo": "string|null",
        "licenseNumber": "LAG-DRV-12345",
        "status": "on_trip",
        "verificationStatus": "verified",
        "rating": 4.8,
        "totalTrips": 1250,
        "currentVehicleId": "string|null",
        "createdAt": "2023-06-01T00:00:00Z"
      }
    ],
    "total": 2
  }
}
```

---

#### Get Driver by ID

```
GET /api/mobility/drivers/:driverId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `driverId` | string | Yes | The driver ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "driver": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string|null",
      "photo": "string|null",
      "licenseNumber": "string",
      "licenseExpiry": "2027-06-30",
      "status": "on_trip",
      "verificationStatus": "verified",
      "rating": 4.8,
      "totalTrips": 1250,
      "currentLocation": {
        "latitude": 6.4541,
        "longitude": 3.4218,
        "updatedAt": "2024-01-20T07:15:00Z"
      },
      "documents": [
        {
          "type": "license",
          "verificationStatus": "verified",
          "expiryDate": "2027-06-30"
        }
      ]
    },
    "vehicle": { ... }
  }
}
```

---

### Vehicles

#### Get All Vehicles

```
GET /api/mobility/vehicles
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | string | No | Filter by organization |
| `status` | string | No | Filter by status: `active`, `maintenance`, `inactive` |
| `type` | string | No | Filter by type: `bus`, `van`, `car`, `motorcycle` |

**Response:**

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "string",
        "registrationNumber": "LAG-123-ABC",
        "vehicleModel": "Coaster",
        "make": "Toyota",
        "year": 2022,
        "type": "bus",
        "capacity": 30,
        "color": "Yellow",
        "features": ["air_conditioning", "gps_tracking", "cctv"],
        "status": "active",
        "currentDriverId": "string|null",
        "fuelType": "diesel",
        "insuranceExpiry": "2026-12-31"
      }
    ],
    "total": 2
  }
}
```

---

#### Get Vehicle Tracking

```
GET /api/mobility/vehicles/:vehicleId/tracking
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | string | Yes | The vehicle ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "vehicleId": "string",
    "location": {
      "latitude": 6.4541,
      "longitude": 3.4218,
      "heading": 180,
      "speed": 25,
      "updatedAt": "2024-01-20T07:15:00Z"
    },
    "status": "moving|stopped|idle|offline",
    "isOnRoute": true,
    "lastUpdated": "2024-01-20T07:15:00Z"
  }
}
```

---

### Ride Requests (Coming Soon)

These endpoints are planned for the ride-sharing (Uber-like) functionality:

```
POST  /api/mobility/rides          - Request a ride (NOT IMPLEMENTED)
GET   /api/mobility/rides/:rideId  - Get ride status (NOT IMPLEMENTED)
PATCH /api/mobility/rides/:rideId  - Accept/complete ride (NOT IMPLEMENTED)
```

---

## Rate Limits

| Endpoint Type      | Rate Limit          |
| ------------------ | ------------------- |
| Standard endpoints | 100 requests/minute |
| Real-time tracking | 60 requests/minute  |
| Write operations   | 30 requests/minute  |

---

## WebSocket Events (Future)

Real-time transport updates will be available via WebSocket:

```
wss://api.adorss.ng/ws/transport
```

Events:

- `transport:location_update` - Vehicle location changed
- `transport:status_change` - Trip status changed
- `transport:eta_update` - ETA recalculated
- `transport:delay_alert` - Delay detected
- `transport:approaching` - Vehicle approaching student's stop
