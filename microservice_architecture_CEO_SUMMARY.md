# Mobile Platform Strategy: 2-App Approach

**Project Timeline:** January 2026 - April 2026 (4 months)

---

## The Problem with One App

The original plan was to build **one large all-in-one app** for everyone (teachers, students, parents, drivers).

**Why this won't work:**

- **Too complicated** - Teachers see parent features, students see driver features
- **Takes longer** - Everything delays everything else
- **Hard to test** - Too many moving parts
- **Annoying for users** - Cluttered with irrelevant features
- **Updates are risky** - One bug breaks it for everyone
- **Support nightmare** - Support team has to understand everything

---

## The Solution: 2 Focused Apps

Build **2 apps, each optimized for its users:**

### **App 1: Education Hub**

**For:** Teachers, Students, and Parents  
**What it does:** Everything school-related

**Key features:**

- Teachers: Post assignments, grade students, mark attendance, message parents
- Students: View assignments, submit work, check grades, see timetable, view results
- Parents: Track child's progress, pay fees, see attendance, message teachers, track transport pickup/dropoff
- Push notifications keep everyone updated

### **App 2: Driver Hub**

**For:** School drivers and transportation contractors  
**What it does:** Everything driving-related

**Key features:**

- Drivers: Manage student pickups, real-time location tracking, confirm arrivals
- Multiple driver types: School drivers, independent contractors, personal drivers, fleet managers
- Automatic arrival notifications to parents
- Emergency alerts

### **Web Portal 3: School Management Portal**

**For:** School administrators  
**What it does:** School administration and teacher management

**Key features:**

- Register school and configure settings
- Add/onboard teachers to school
- Manage classes and timetables
- View school-wide analytics and reports
- Manage fees and billing
- Student enrollment management

---

## The 3-Platform Approach

| Platform                       | Users                       | Purpose                                          |
| ------------------------------ | --------------------------- | ------------------------------------------------ |
| **Education Hub** (Mobile App) | Teachers, Students, Parents | Daily school activities, learning, communication |
| **Driver Hub** (Mobile App)    | Drivers                     | Transportation and student tracking              |
| **School Portal** (Web)        | School Admins               | School management and teacher onboarding         |

---

## Why 2 Apps is Better

### **Faster Development**

- Developers work on focused problems (app 1 team vs app 2 team)
- No confusion about priorities
- Each team moves independently
- **Ship 4 months instead of 6+**

### **Better User Experience**

- Teachers see teacher tools, not parent features
- Students get a clean, simple interface
- Parents get only what they need to monitor their child
- Apps are faster (smaller codebase = smaller download)
- Clear, intuitive navigation

### **Easier to Maintain**

- One bug doesn't break everything
- Can fix driver app without risking education app
- Support team learns one problem at a time
- Updates happen faster and safer

### **Cost Efficient**

- Less complex = fewer bugs
- Smaller development team can handle it
- Easier to onboard new developers
- Lower maintenance costs long-term

### **App Store Benefits**

- Separate app store listings = separate marketing
- Can update each app independently
- Teachers can update without affecting parent users
- Can gather separate analytics per user type

---

## What Each App Does

### Education Hub Detailed Breakdown

**Teachers can:**

- Create and post assignments
- Grade student submissions with comments
- Mark daily attendance
- Post class announcements
- Message parents, students, and post class announcement
- Upload course materials
- Share exam results

**Students can:**

- See their assignments and deadlines
- Submit assignments
- Check their grades and results
- View their timetable
- See their attendance
- Download course materials
- Receive notifications about new assignments

**Parents can:**

- Monitor 1+ child's progress
- See attendance (is my child in school?)
- View assignment status (submitted? graded?)
- Check grades and exam results
- Pay school fees online
- See when child arrives/leaves school (live tracking)
- Message teachers, school admin, and see school anouncements
- Get notifications (grade posted, fees due, child left school)

---

### Driver Hub Detailed Breakdown

**School Drivers can:**

- See their assigned routes and student pickup lists
- Confirm student pickups and dropoffs
- Share live location with parents
- Send "student arrived at school" alerts
- Access emergency alert button
- See trip history

**Independent Drivers can:**

- Accept ride requests (like Uber)
- Set rates and vehicle type
- Track earnings
- Access navigation

**Personal Drivers can:**

- Share location with their employer/family
- See assigned tasks for the day
- Confirm task completion

**Fleet Managers can:**

- See all drivers on a map
- Assign routes and tasks
- Monitor driver performance

---

### School Portal Detailed Breakdown

**School Administrators can:**

- Register school and set up school details
- Add and manage teachers (invite existing or create new accounts)
- Assign teachers to classes
- Manage student enrollment
- Set fees and payment due dates
- View analytics (attendance, grades, payment status)
- Generate reports (performance, attendance, finances)
- Manage timetables and schedules
- View all messages and communications

**Key Features:**

- One-click teacher onboarding (send invitation, teacher joins immediately)
- Real-time dashboards showing school performance
- Payment collection and reconciliation
- Student enrollment and class assignments
- Communication hub with teachers and parents

---

## Independent Teachers & Marketplace (After MVP)

### Why This Matters

Currently, only school-employed teachers can use the system. In the future, we'll open up a **marketplace** where:

- **Independent Teachers** can offer tutoring and lessons directly to students
- **Parents** can hire verified teachers for supplementary education
- **Teachers** earn additional income outside of schools
- **Quality Control:** All independent teachers go through strict verification (KYC - Know Your Customer)

### How It Works

**For Independent Teachers:**

- Register through Education Hub (not through a school)
- Submit credentials: Teaching degree, certifications, background check
- Admin verification team reviews qualifications
- Once approved, can accept students and set own rates
- Build portfolio and earn ratings

**For Parents Hiring Independent Teachers:**

- Search marketplace by subject, qualifications, and rates
- Book trial lessons
- For students under 18: Parent/Guardian must approve teacher
- Parent can set spending limits and get weekly reports
- Secure payment through our platform

**Revenue Model:**

- School takes transaction fee from independent teacher payments (10-15%)
- Ensures quality control and platform sustainability
- Teachers keep majority of earnings

---

## Technical Foundation (Simple Explanation)

We could build this with **5 backend services**:

1. **Auth Service (Master Service)** - Handles login, verifies identity, decides what each user can see, controls access to all other services
2. **Education Service** - Stores assignments, grades, attendance, marketplace listings
3. **Messaging Service** - Handles notifications and messages
4. **Mobility Service** - Handles location tracking and routes
5. **Finance Service** - Handles payments, fees, and teacher earnings

Each service is independent, so if one has a problem, it doesn't crash everything else.

**Why this matters:** Services can be updated, scaled, or fixed independently.

### System Architecture

The **Auth Service is the master controller** - all requests flow through it first:

```
                        USERS (Teachers, Students, Parents, Drivers)
                                        ↓
                              [Mobile Apps]
                     [Education Hub]     [Driver Hub]
                                        ↓
                    ┌─────────────────────────────────────────────┐
                    │   AUTH SERVICE (Master Gate)                │
                    │  - Login/Registration                       │
                    │  - Verify identity                          │
                    │  - Check permissions                        │
                    │  - Allow/block access                       │
                    └─────────────┬───────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────┬────────────┐
              ↓                    ↓                ↓            ↓
        ┌──────────────┐    ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐
        │ Education    │    │   Messaging      │  │   Mobility     │  │   Finance    │
        │ Service      │    │   Service        │  │   Service      │  │   Service    │
        └──────────────┘    └──────────────────┘  └────────────────┘  └──────────────┘
      (Assignments,       (Notifications,        (Location,          (Payments,
       Grades,            Messages)              Routes)             Fees)
       Attendance)
```

**How it works:** When a user does anything, the app first asks Auth Service "Is this user allowed?" Only if Auth Service says YES does the app connect to Education, Messaging, Mobility, or Finance services.

---

## How Apps & Backend Services Interact

### Which Services Does Each App Use?

**Education Hub (Mobile App) connects to:**
- ✅ Auth Service (login, permissions)
- ✅ Education Service (assignments, grades, attendance)
- ✅ Messaging Service (notifications, messages)
- ✅ Mobility Service (location tracking, bus pickup alerts)
- ✅ Finance Service (fee payments)

**Driver Hub (Mobile App) connects to:**
- ✅ Auth Service (login, permissions)
- ✅ Mobility Service (location tracking, routes, trips)
- ✅ Messaging Service (notifications, parent alerts)
- ✅ Finance Service (earnings, payments)

**School Portal (Web) connects to:**
- ✅ Auth Service (admin login, teacher invitations)
- ✅ Education Service (classes, students, timetables)
- ✅ Messaging Service (announcements)
- ✅ Finance Service (fee setup, payments)

---

### Data Flow Example: When a Parent Pays School Fees

```
Parent clicks "Pay Fees" in Education Hub
                    ↓
1. App asks Auth Service: "Is this parent allowed to pay?"
                    ↓
2. Auth Service confirms: "Yes, they can pay" ✓
                    ↓
3. App connects to Finance Service: "Get fees for child XYZ"
                    ↓
4. Finance Service returns: "Tuition: $500, Transport: $100"
                    ↓
5. Parent enters payment details
                    ↓
6. App sends to Finance Service: "Process payment"
                    ↓
7. Finance Service processes payment (Paystack/Stripe)
                    ↓
8. Finance Service tells Messaging Service: "Send receipt"
                    ↓
9. Messaging Service sends: Email receipt + Push notification
                    ↓
10. Education Service updates: "Payment received"
                    ↓
11. Parent sees: "Payment successful!" + Receipt
```

---

## Development Timeline: What Gets Built Each Week

### Week 1-2: Foundation (Critical First Steps)

**Backend:**
- Auth Service: User models, login/register endpoints, JWT tokens
- API Gateway: Request routing structure
- **Target: 2-3 components**

**Mobile (Both Apps):**
- Login/Register screens UI
- Navigation structure
- **Target: 2 components**

**Total: 4-6 components**

---

### Week 3-4: Core Services Launch

**Backend:**
- Auth Service: Complete (multi-role support, role switching)
- Education Service: Basic structure, classes/timetables endpoints
- Finance Service: Fee structure endpoints
- **Target: 8-10 components**

**Mobile:**
- Education Hub: Teacher dashboard (view classes)
- Education Hub: Student dashboard (view assignments)
- Education Hub: Parent dashboard (view child profile)
- **Target: 3 components**

**Total: 11-13 components**

---

### Week 5-6: Feature Development Accelerates

**Backend:**
- Education Service: Assignments (create, submit, grade)
- Messaging Service: Basic messaging endpoints
- Mobility Service: Location tracking setup
- **Target: 10-12 components**

**Mobile:**
- Education Hub: Assignment submission
- Education Hub: Messaging/chat screen
- Driver Hub: Login & registration
- **Target: 3 components**

**Total: 13-15 components**

---

### Week 7-8: Heavy Lifting

**Backend:**
- Education Service: Attendance, results endpoints
- Messaging Service: Push notifications integration
- Mobility Service: Trip management, route assignment
- Finance Service: Payment processing integration
- **Target: 15-18 components**

**Mobile:**
- Education Hub: Grades/results viewing
- Education Hub: Attendance calendar view
- Driver Hub: Route dashboard, pickup list
- Driver Hub: Location tracking (background)
- **Target: 4 components**

**Total: 19-22 components**

---

### Week 9-10: Services Near Complete

**Backend:**
- Finance Service: Complete with reports
- Messaging Service: Complete with templates
- Mobility Service: All driver modes setup
- **Target: 12-15 components**

**Mobile:**
- Education Hub: Fee payment screen
- Education Hub: Push notifications display
- Driver Hub: Pickup/dropoff confirmation
- Driver Hub: Emergency alerts
- **Target: 4 components**

**Total: 16-19 components**

---

### Week 11-12: Apps Feature Complete

**Backend:**
- All services polished, optimization
- Cross-service communication tested
- **Target: 8-10 components (optimization/refinement)**

**Mobile:**
- Education Hub: All features integrated
- Education Hub: Offline support
- Driver Hub: All features integrated
- Driver Hub: Background location optimization
- **Target: 4 components**

**Total: 12-14 components**

---

### Week 13-14: Integration & Polish

**Backend:**
- End-to-end integration testing
- Performance optimization
- Load testing
- **Target: 0 new components (testing/optimization)**

**Mobile:**
- Full app testing
- Bug fixes
- Performance optimization
- App store preparation
- **Target: 0 new components (testing/polish)**

**Total: Stabilization only**

---

### Week 15-16: Final Push & Launch

**Backend:**
- Critical bug fixes only
- Security audit
- Go-live checks
- **Target: 0 new components (stability)**

**Mobile:**
- Final testing on real devices
- Bug fixes
- App store submission
- **Target: 0 new components (launch prep)**

**Total: 0 new components (launch readiness)**

---

## Weekly Completion Summary

| Week | Backend Components | Mobile Components | Total | Focus |
|------|-------------------|------------------|-------|-------|
| 1-2  | 2-3               | 2                | 4-6   | Foundation |
| 3-4  | 8-10              | 3                | 11-13 | Core Services |
| 5-6  | 10-12             | 3                | 13-15 | Features Start |
| 7-8  | 15-18             | 4                | 19-22 | Heavy Development |
| 9-10 | 12-15             | 4                | 16-19 | Services Complete |
| 11-12| 8-10              | 4                | 12-14 | App Polish |
| 13-14| 0 (testing)       | 0 (testing)      | 0     | Integration |
| 15-16| 0 (bug fixes)     | 0 (launch prep)  | 0     | Launch |
| **TOTAL** | **65-78** | **20-21** | **85-99** | **Components** |

---

## What is a "Component"?

**Backend Component Examples:**
- Login endpoint
- Create assignment endpoint
- Grade assignment endpoint
- Send notification
- Process payment
- Track location
- Update attendance

**Mobile Component Examples:**
- Login screen UI
- Assignment list screen
- Submit assignment screen
- Chat screen
- Payment screen
- Location tracking feature
- Pickup confirmation button

---

## Key Metrics for Success

**Pace Target:**
- Weeks 1-4: Slow (foundation work)
- Weeks 5-10: Fast (85-90% of features built)
- Weeks 11-14: Medium (polish & integration)
- Weeks 15-16: Stabilization (bug fixes only)

**Weekly Targets:**
- **Early weeks (1-4):** 5-6 components/week
- **Peak weeks (5-10):** 15-19 components/week
- **Late weeks (11-14):** 12-14 components/week

**Bottleneck Risks:**
- Week 1-2: If Auth Service delayed, everything blocks
- Week 5-6: If backend not ready, mobile team sits idle
- Week 7-8: Peak complexity - most likely for delays
- Week 13-14: Integration issues could cascade

**Buffer Strategy:**
- Weeks 15-16 are reserved for bugs & delays
- Non-critical features pushed to Phase 2 if needed
- Prioritize: Auth → Education → Messaging → Mobility → Finance

---

## How to Track Weekly Progress

Every Friday, measure:
1. **Completed Components:** How many finished & tested this week?
2. **Blocked Issues:** What's preventing progress?
3. **On-Track Status:** Ahead/on-track/behind?
4. **Next Week Risks:** What could go wrong?

**Success Criteria:**
- ✅ Hitting 70%+ of weekly component targets
- ✅ No more than 1 week of delays
- ✅ Critical components (Auth, core features) never delayed
- ✅ Mobile team never waiting for backend (parallel development)

---

## Real-World API Interactions: How Apps Talk to Services

### Example 1: Teacher Creating an Assignment

```
SEQUENCE OF INTERACTIONS:

1. Teacher in Education Hub clicks "Create Assignment"
   ↓
2. App displays: Assignment form (title, due date, description, file upload)
   ↓
3. Teacher fills form and clicks "Post"
   ↓
4. Education Hub asks Auth Service: 
      "Can user ABC123 create assignments?" 
   ↓
5. Auth Service responds: 
      "Yes, user ABC123 is a teacher in school XYZ"
   ↓
6. Education Hub sends to Education Service: 
      POST /assignments
      {
        teacher_id: "ABC123",
        school_id: "XYZ",
        title: "Math Homework Chapter 5",
        due_date: "2026-02-01",
        description: "...",
        file_url: "s3://bucket/assignment.pdf"
      }
   ↓
7. Education Service stores in database and responds:
      {
        assignment_id: "ASSIGN_001",
        created_at: "2026-01-21",
        status: "published"
      }
   ↓
8. Education Hub asks Messaging Service:
      "Send notification: New assignment posted to class XYZ"
   ↓
9. Messaging Service sends:
      - Push notifications to all students
      - Email notification to all parents
   ↓
10. Teacher sees: "Assignment posted successfully!"
    Students see: Push notification "New assignment in Math"
    Parents see: Email "Child has new assignment due 2/1"
```

---

### Example 2: Parent Paying Fees

```
SEQUENCE OF INTERACTIONS:

1. Parent in Education Hub taps "Pay Fees"
   ↓
2. App asks Auth Service: 
      "Can parent PQR789 pay fees for child?"
   ↓
3. Auth Service responds: 
      "Yes, PQR789 is parent of student DEF456"
   ↓
4. Education Hub asks Finance Service: 
      GET /fees/student/DEF456
   ↓
5. Finance Service responds:
      {
        tuition: 500.00,
        transport: 100.00,
        extras: 50.00,
        total_due: 650.00,
        due_date: "2026-02-01"
      }
   ↓
6. Education Hub displays fees breakdown
   ↓
7. Parent selects payment method (card/bank)
   ↓
8. App sends to Finance Service:
      POST /payments/initiate
      {
        payer_id: "PQR789",
        student_id: "DEF456",
        amount: 650.00,
        payment_method: "card"
      }
   ↓
9. Finance Service connects to payment gateway (Paystack)
      → Payment successful
   ↓
10. Finance Service stores payment record
   ↓
11. Finance Service tells Messaging Service:
       "Send receipt to parent PQR789"
   ↓
12. Messaging Service sends:
       - Push notification: "Payment received"
       - Email with receipt and download link
   ↓
13. Finance Service updates Education Service:
       "Student DEF456 fees updated"
   ↓
14. Parent sees: "Payment successful! Receipt sent to email"
    School admin sees: Payment recorded in dashboard
    Student sees: "Fees up to date" in profile
```

---

### Example 3: Driver Location Update (Real-time)

```
SEQUENCE OF INTERACTIONS (happens every 10 seconds during trip):

1. Driver in Driver Hub: Route active, trip started
   ↓
2. Driver's phone continuously gets GPS location
   ↓
3. Driver Hub sends location to Mobility Service:
      POST /locations/update
      {
        driver_id: "DRV_001",
        trip_id: "TRIP_123",
        latitude: 6.5244,
        longitude: 3.3792,
        timestamp: "2026-01-21T10:30:45Z",
        accuracy: "10m"
      }
   ↓
4. Mobility Service stores location (real-time database)
   ↓
5. Mobility Service checks geofence:
       "Is driver at school pickup zone?"
   ↓
6. If YES: Mobility Service tells Messaging Service:
       "Driver arrived at school - notify parents"
   ↓
7. Messaging Service sends to all parents:
       - Push notification: "Driver arrived at school"
       - SMS: "Your child's driver has arrived"
   ↓
8. Parent in Education Hub can ask Mobility Service:
       GET /locations/live/child_DEF456
   ↓
9. Mobility Service responds:
       {
         driver_location: {latitude: 6.5244, longitude: 3.3792},
         driver_name: "John",
         vehicle: "White Van",
         eta_minutes: 5,
         last_updated: "10 seconds ago"
       }
   ↓
10. Education Hub displays map with driver's live location
    Parent sees: "Driver is 5 minutes away"
```

---

### Example 4: Student Submitting Assignment

```
SEQUENCE OF INTERACTIONS:

1. Student in Education Hub taps "Submit Assignment"
   ↓
2. Student selects file (document/image/video)
   ↓
3. Education Hub shows upload progress
   ↓
4. App uploads to AWS S3 (file storage)
   ↓
5. App asks Auth Service:
      "Can student GHI789 submit to assignment ASSIGN_001?"
   ↓
6. Auth Service responds: "Yes"
   ↓
7. Education Hub sends to Education Service:
      POST /assignments/ASSIGN_001/submit
      {
        student_id: "GHI789",
        file_url: "s3://bucket/submission_001.pdf",
        submitted_at: "2026-01-21T09:45:00Z",
        notes: "I worked on this"
      }
   ↓
8. Education Service stores submission
   ↓
9. Education Service tells Messaging Service:
      "New submission from GHI789 - notify teacher"
   ↓
10. Messaging Service sends:
       - Push to teacher: "New submission: GHI789"
   ↓
11. Student sees: "Submitted successfully!"
    Teacher sees: New submission in queue to grade
```

---

### Example 5: Independent Teacher Registering

```
SEQUENCE OF INTERACTIONS:

1. Teacher opens Education Hub, taps "Sign Up"
   ↓
2. Selects "I'm an independent teacher"
   ↓
3. Fills form:
      - Email
      - Password
      - Full name
      - Upload teaching degree
      - Upload background check consent
   ↓
4. App sends to Auth Service:
      POST /auth/register/teacher/independent
      {
        email: "teacher@example.com",
        name: "Jane Smith",
        documents: {...}
      }
   ↓
5. Auth Service stores data and flags: "pending_verification"
   ↓
6. Auth Service tells Messaging Service:
      "New independent teacher registered - notify admin"
   ↓
7. Messaging Service sends admin:
      - Email: "Review new teacher: Jane Smith"
   ↓
8. Admin logs into School Portal
   ↓
9. Reviews teacher documents and background check
   ↓
10. Admin clicks "Approve" 
   ↓
11. School Portal sends to Auth Service:
       PUT /teachers/TEACHER_001/verify
       {
         verified: true,
         verified_by: "admin_xyz",
         verified_at: "2026-01-21"
       }
   ↓
12. Auth Service updates status: "active"
   ↓
13. Auth Service tells Messaging Service:
       "Teacher approved - send notification"
   ↓
14. Messaging Service sends teacher:
       - Email: "Your account verified! You can start teaching"
       - Push notification: "Account activated"
   ↓
15. Teacher can now login and set up profile
```

---

## User Registration & Login Workflows

### School Portal: School Registration & Teacher Management

```
STEP 1: School Registration
1. SCHOOL ADMIN opens School Portal (web)
2. Taps "Register School"
3. Enters:
   - School name
   - School ID/Registration number
   - Admin name + phone
   - School address
   - Number of students
4. System verifies school details
5. Admin account created
6. Notification: "School registered! Start adding teachers"

STEP 2: Teacher Onboarding
1. School Admin taps "Add Teachers"
2. Option A: "Invite Existing Teachers"
   - Enters teacher email
   - System sends invitation
   - Teacher joins school in Education Hub
3. Option B: "Create New Teacher Account"
   - Enters teacher email + name
   - System creates account
   - Teacher sets password via email link
   - Teacher immediately active in school

STEP 3: Manage School
- View all teachers and classes
- Assign classes and students
- Set fees and payment deadlines
- View student attendance and performance
- Generate reports
```

---

### Education Hub: Teacher Registration Flow

**Path 1: School-Affiliated Teacher** (invited through School Portal)

```
1. TEACHER receives email invitation from school
2. Clicks link in email
3. Creates password
4. Account activated immediately
5. Teacher opens Education Hub
6. Assigned to school and ready to teach
```

**Path 2: Independent Teacher** (self-registration in mobile app)

```
1. NEW TEACHER opens Education Hub
2. Taps "Sign Up"
3. Selects: "I'm an independent teacher (not part of a school)"
4. Enters:
   - Email
   - Password
   - Full name
   - Phone number
5. Provides verification documents:
   - Government ID (photo of passport/license)
   - Teaching qualifications (degree, certifications)
   - Background check consent (required for child safety)
6. Auth Service flags account as "pending verification"
7. Admin review team verifies credentials (KYC process)
   - Checks qualifications
   - Runs background check
   - Approves or rejects
8. Once approved:
   - Account activated
   - Teacher can create student profiles and offer services
   - Parent/Guardian approval required if student under 18
   - Can set own rates and teaching hours
9. Notification sent: "Account verified! You can now start teaching"

⚠️ Note: Independent teachers go through strict KYC verification because
they have direct access to students outside of school. Safety is paramount.
```

---

### Education Hub: Parent & Student Registration Flow

```
1. NEW PARENT opens Education Hub
2. Taps "Sign Up"
3. Enters:
   - Email
   - Password
   - Full name
4. System asks: "How are you connected to education?"
   - Option A: "My child is at a school"
   - Option B: "My child learns with independent teacher(s)"
5. If school student:
   - Enters school code + child name
   - System auto-links parent to child (verified by school)
6. If independent learning:
   - Can search and hire independent teachers
   - For students under 18: Guardian approval required
7. Account activated
8. Parent can now view child's progress
```

---

### Education Hub: Student Registration Flow

```
For SCHOOL STUDENTS:
1. Parent logs in with child's name already linked
2. Student account auto-created
3. Student opens Education Hub
4. Sees school, classes, and teachers

For INDEPENDENT LEARNERS:
1. If 18+ years old:
   - Self-registers in Education Hub
   - Can hire independent teachers
2. If under 18:
   - Parent creates account for student
   - Parent approves each independent teacher
   - Student can only learn from approved teachers
```

---

### Education Hub: General Login Flow

```
1. USER opens Education Hub
2. Taps "Login"
3. Enters email + password
4. Auth Service checks credentials
5. If user has multiple roles:
   - Shows "Pick your role" screen
   - (e.g., "Are you logging in as Teacher or Parent?")
6. Auth Service grants permission for that role
7. App shows dashboard for selected role
8. For independent teachers:
   - Shows pending students requiring guardian approval
   - Shows active students
```

---

### Driver Hub: Registration Flow

```
1. NEW DRIVER opens Driver Hub
2. Taps "Sign Up"
3. Enters:
   - Phone number
   - Full name
   - Driver license details
   - Vehicle information (if applicable)
   - Driver type (School Driver / Independent / Personal / Fleet Manager)
4. Auth Service verifies data and creates account
5. System flags account as "pending verification"
   (Admin reviews driver documents)
6. Once approved, driver can login
7. Notification sent: "Account approved, you can now start driving"
```

### Driver Hub: Login Flow

```
1. DRIVER opens Driver Hub
2. Taps "Login"
3. Enters phone + password (or biometric)
4. Auth Service checks credentials
5. If driver has multiple modes (School Driver + Uber mode):
   - Shows "Select driving mode" screen
6. Auth Service grants permission for selected mode
7. App shows dashboard with available routes/requests
8. Location tracking activates automatically
```

---

## Independent Teacher Marketplace (Future Feature)

**Phase 2 Addition - Coming after April 2026**

```
How it works:
1. Verified independent teachers can list their profiles
2. Parents can search by:
   - Subject (Math, English, Science, etc.)
   - Qualifications (degree level, certifications)
   - Hourly rate
   - Availability (times and days)
   - Student reviews and ratings
3. Parent can request or book a teacher
4. For students under 18:
   - Guardian must approve before teaching begins
   - Guardian can set spending limits
   - Guardian receives weekly progress reports
5. Payment handled through Finance Service
6. Teacher earnings tracked in Driver Hub or separate dashboard
```

## What Happens Next

### Phase 2 (After April 2026)

Once the MVP launches, we can add:

- Video classes for live teaching
- AI homework help
- Advanced analytics dashboards
- Gamification (badges, rewards)
- One-on-one ride-sharing (carpool efficiency)
- NFC card integration for attendance
- And more based on user feedback

**Prepared for:** CEO Review  
**Date:** January 20, 2026  
**Recommendation:** Review
