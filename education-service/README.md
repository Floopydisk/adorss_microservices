# EDUCATION-SERVICE

Education Service - Assignments, grades, attendance, ward management, and transport tracking

**Assigned to:** Backend Dev 2

## Port

`8001`

## Tech Stack

- TypeScript
- Express.js
- MongoDB

## Features

### Parent Features

#### 1. Ward Management

- **View Wards**: Get all linked children with detailed information
- **Ward Details**: Comprehensive information including school, class, transport, medical info
- **Enrollment Requests**: Submit and track enrollment applications for new wards
- **Ward Settings**: Configure notifications, alerts, and preferences per child
- **Pickup Authorizations**: Create temporary pickup authorizations for third parties
- **Emergency Contact Management**: Update emergency contact information

#### 2. Academic Tracking

- **Dashboard**: Overview of all children's academic status
- **Assignments**: View assignments, due dates, submission status
- **Grades**: View grades, assessments, and generate reports
- **Attendance**: View attendance records with statistics
- **Results**: View published exam results and term reports
- **Timetable**: View class schedules

#### 3. Transport Tracking (IRT - Intelligent Route Tracking)

- **Real-time Status**: Current transport status with live location
- **ETA Calculation**: Intelligent ETA based on real-time data and traffic
- **Route Information**: Full route details with all stops
- **History**: Transport history with pickup/dropoff times
- **Absence Notification**: Notify school of transport absence
- **Transport Overview**: Summary of all wards' transport status

#### 4. Announcements

- **School Announcements**: View announcements from linked schools
- **Filtered by Class**: Announcements targeted to specific classes

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start development server:

```bash
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Lint TypeScript files
- `pnpm lint:fix` - Fix linting issues

## API Endpoints

### Health Check

```
GET /health
```

### Parent Routes (`/api/parent`)

#### Dashboard & Children

```
GET  /api/parent/dashboard         - Get parent dashboard overview
GET  /api/parent/children          - Get all linked children
GET  /api/parent/announcements     - Get announcements
```

#### Child-specific Academic Data

```
GET  /api/parent/children/:studentId/assignments  - Get assignments
GET  /api/parent/children/:studentId/grades       - Get grades
GET  /api/parent/children/:studentId/attendance   - Get attendance
GET  /api/parent/children/:studentId/timetable    - Get timetable
GET  /api/parent/children/:studentId/results      - Get exam results
GET  /api/parent/children/:studentId/report       - Get comprehensive report
```

### Ward Management Routes (`/api/parent/wards`)

```
GET    /api/parent/wards                                      - Get all wards
GET    /api/parent/wards/:studentId                           - Get ward details
GET    /api/parent/wards/enrollment/requests                  - List enrollment requests
POST   /api/parent/wards/enrollment/requests                  - Create enrollment request
GET    /api/parent/wards/enrollment/requests/:requestId       - Get request details
PATCH  /api/parent/wards/enrollment/requests/:requestId       - Update draft request
PATCH  /api/parent/wards/enrollment/requests/:requestId/submit - Submit request
GET    /api/parent/wards/:studentId/settings                  - Get ward settings
PUT    /api/parent/wards/:studentId/settings                  - Update ward settings
PATCH  /api/parent/wards/:studentId/emergency-contact         - Update emergency contact
GET    /api/parent/wards/:studentId/pickup-authorizations     - Get authorizations
POST   /api/parent/wards/:studentId/pickup-authorizations     - Create authorization
DELETE /api/parent/wards/:studentId/pickup-authorizations/:id - Cancel authorization
```

### Transport Tracking Routes (`/api/parent/transport`)

```
GET  /api/parent/transport/overview                  - Overview for all wards
GET  /api/parent/transport/wards/:studentId/status   - Current transport status
GET  /api/parent/transport/wards/:studentId/track    - Real-time tracking data
GET  /api/parent/transport/wards/:studentId/eta      - Get ETA
GET  /api/parent/transport/wards/:studentId/today    - Today's summary
GET  /api/parent/transport/wards/:studentId/route    - Route information
GET  /api/parent/transport/wards/:studentId/history  - Transport history
POST /api/parent/transport/wards/:studentId/notify-absence - Notify absence
```

### Parent Link Routes

```
POST  /api/parent/link-request                    - Request to link with child
PATCH /api/parent/links/:linkId/permissions       - Update link permissions
```

## Data Models

### Core Education Models

- **Student** - Student profile and enrollment information
- **Class** - Class/section information
- **School** - School details
- **Assignment** - Homework and assignments
- **Grade** - Grade records and assessments
- **Attendance** - Daily attendance records
- **Timetable** - Class schedules
- **Result** - Term/exam results
- **Announcement** - School announcements

### Parent-Student Relationship

- **ParentStudentLink** - Links parents to students with permissions

### Ward Management Models

- **WardEnrollmentRequest** - Enrollment applications
- **WardSettings** - Per-ward notification preferences
- **PickupAuthorization** - Temporary pickup permissions

### Transport Models

- **TransportRoute** - Bus routes with stops
- **StudentTransport** - Student-to-route assignments
- **TransportSchedule** - Daily trip schedules
- **TransportLog** - Trip logs per student
- **Vehicle** - Vehicle information

## Environment Variables

```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/education-service
NODE_ENV=development
JWT_SECRET=your_jwt_secret
AUTH_SERVICE_URL=http://localhost:8000
```

## Transport Tracking Flow

### Morning Pickup Flow

1. Parent checks transport status via `/transport/wards/:id/status`
2. System returns `awaiting_pickup` status with scheduled pickup time
3. When bus starts, status changes to `in_progress`
4. Real-time location available via `/transport/wards/:id/track`
5. ETA calculated based on current location and traffic
6. When student boards, status changes to `on_bus`
7. When arriving at school, status changes to `dropped_off`

### Afternoon Dropoff Flow

1. When school day ends, schedule becomes active
2. Student boards bus, status changes to `in_transit`
3. Parent tracks via `/transport/wards/:id/track`
4. When approaching stop, parent receives alert (if enabled)
5. Student dropped off, status changes to `dropped_off`
6. If someone picks up, logged with `picked_up` status

### ETA Calculation (IRT)

- Uses real-time GPS location when available
- Factors in current speed, traffic conditions
- Considers remaining stops and average stop times
- Adjusts for current delay status
- Provides confidence level: high/medium/low

## Development Notes

- All TypeScript code in `src/` directory
- Compiled JavaScript in `dist/` directory
- Types in `src/types/`
- Tests in `tests/`
- Models in `src/models/`
- Controllers in `src/controllers/`
- Services in `src/services/`

## Team Assignment

This service is assigned to **Backend Dev 2**.
