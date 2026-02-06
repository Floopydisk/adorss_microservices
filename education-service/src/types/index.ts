import { Request } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserPayload {
  sub: string | number; // User ID (can be string or number depending on source)
  role: string;
  email?: string;
  phone?: string;
  status?: string;
  school_id?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  permissions?: string[]; // Array of permission strings like "grades:read"
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  role: "teacher" | "student" | "parent" | "driver" | "admin" | "school_admin";
  name: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
  token?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ChildSummary {
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  grade: string;
  relationship: string;
  attendanceToday?: {
    status: string;
    checkInTime?: Date;
  };
  pendingAssignments: number;
  upcomingExams: number;
  recentGrades: {
    subject: string;
    score: number;
    maxScore: number;
    date: Date;
  }[];
  // Transport status for dashboard
  transportStatus?: {
    hasTransport: boolean;
    currentStatus?: string;
    isOnBus?: boolean;
    etaMinutes?: number;
  };
}

export interface ParentDashboard {
  children: ChildSummary[];
  subjectsCount: number;
  recentAnnouncements: any[];
  upcomingEvents: any[];
  pendingFees?: {
    total: number;
    dueDate?: Date;
  };
  unreadMessages: number;
  transportAlerts?: TransportAlert[];
}

export interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface GradeReport {
  studentId: string;
  studentName: string;
  className: string;
  academicYear: string;
  term: string;
  subjects: {
    name: string;
    currentGrade: string;
    percentage: number;
    trend: "improving" | "stable" | "declining";
    assessments: {
      name: string;
      score: number;
      maxScore: number;
      date: Date;
    }[];
  }[];
  overallPercentage: number;
  overallGrade: string;
  classRank?: number;
  totalInClass?: number;
  teacherComments?: string;
}

// ==================== WARD MANAGEMENT TYPES ====================

export interface WardInfo {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: "male" | "female" | "other";
  status: "active" | "inactive" | "transferred" | "graduated";
  school: {
    id: string;
    name: string;
    code: string;
    type: string;
  } | null;
  class: {
    id: string;
    name: string;
    grade: string;
    section?: string;
  } | null;
  relationship: string;
  isPrimary: boolean;
  canPickup: boolean;
  permissions: ParentPermissions;
  transport: {
    hasTransport: boolean;
    routeId?: string;
    routeName?: string;
    routeCode?: string;
    status?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    bloodType?: string;
  };
  hasCustomSettings: boolean;
  enrollmentDate: Date;
}

export interface ParentPermissions {
  viewGrades: boolean;
  viewAttendance: boolean;
  viewAssignments: boolean;
  communicateWithTeachers: boolean;
  payFees: boolean;
  trackLocation: boolean;
}

export interface EnrollmentRequestSummary {
  id: string;
  schoolId: string;
  schoolName: string;
  wardName: string;
  requestedClass?: string;
  status: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WardSettingsPayload {
  notifications: {
    attendance: boolean;
    grades: boolean;
    assignments: boolean;
    announcements: boolean;
    transport: boolean;
    fees: boolean;
    emergencies: boolean;
  };
  transportAlerts: {
    busArriving: boolean;
    busArrivingThreshold: number;
    pickupConfirmation: boolean;
    dropoffConfirmation: boolean;
    delayAlerts: boolean;
    routeChanges: boolean;
  };
  attendanceAlerts: {
    markAbsent: boolean;
    markLate: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  gradeAlerts: {
    newGrade: boolean;
    lowGradeThreshold: number;
    resultPublished: boolean;
  };
  preferredContactMethod: "push" | "sms" | "email" | "all";
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface PickupAuthorizationInfo {
  id: string;
  authorizedPerson: {
    name: string;
    phone: string;
    relationship: string;
    idNumber?: string;
  };
  type: "one_time" | "recurring" | "temporary";
  validFrom: Date;
  validUntil: Date;
  verificationCode: string;
  status: "active" | "used" | "expired" | "cancelled";
}

// ==================== TRANSPORT TRACKING TYPES ====================

export interface TransportStatus {
  hasTransport: boolean;
  status: string;
  message: string;
  route?: {
    id: string;
    name: string;
    code: string;
  };
  schedule?: {
    id: string;
    tripType: "morning_pickup" | "afternoon_dropoff";
    status: string;
    scheduledStartTime: Date;
    actualStartTime?: Date;
    delay: number;
    delayReason?: string;
  };
  currentLocation?: GeoLocation;
  pickupLocation?: StopInfo;
  dropoffLocation?: StopInfo;
  eta?: ETAInfo;
  driver?: ContactInfo;
  attendant?: ContactInfo;
  studentOnBus?: boolean;
  events?: TransportEvent[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt?: Date;
}

export interface StopInfo {
  name: string;
  address: string;
  coordinates: GeoLocation;
  scheduledTime?: string;
  isCompleted?: boolean;
}

export interface ETAInfo {
  estimatedArrival: Date;
  actualArrival?: Date;
  source: "scheduled" | "real_time" | "calculated" | "actual";
  confidence: "high" | "medium" | "low" | "confirmed";
  minutesAway: number | null;
  stopsAway: number | null;
  delayAdjusted?: boolean;
}

export interface ContactInfo {
  name: string;
  phone?: string;
}

export interface TransportEvent {
  type: string;
  timestamp: Date;
  location?: GeoLocation;
  stopId?: string;
  notes?: string;
}

export interface RouteTrackingData {
  route: {
    id: string;
    name: string;
    code: string;
    stops: {
      stopId: string;
      name: string;
      coordinates: GeoLocation;
      order: number;
    }[];
  };
  schedule: {
    id: string;
    tripType: string;
    status: string;
    startedAt?: Date;
    delay: number;
  };
  currentLocation: GeoLocation | null;
  vehicle: {
    registrationNumber: string;
    type: string;
    make: string;
    model: string;
  } | null;
  stopProgress: StopProgress[];
  studentsOnboard: number;
  studentIsOnboard: boolean;
}

export interface StopProgress {
  stopId: string;
  name: string;
  order: number;
  scheduledTime: string;
  actualArrival?: Date;
  actualDeparture?: Date;
  status: "pending" | "approaching" | "arrived" | "completed";
  isStudentStop: boolean;
}

export interface TransportHistoryEntry {
  date: Date;
  tripType: string;
  status: string;
  pickupTime?: Date;
  dropoffTime?: Date;
  pickedUpBy?: {
    name: string;
    phone: string;
    relationship: string;
  };
  events: TransportEvent[];
}

export interface TransportAlert {
  id: string;
  type: "delay" | "arrival" | "departure" | "emergency" | "route_change";
  studentId: string;
  studentName: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface TodayTransportSummary {
  hasTransport: boolean;
  route?: {
    name: string;
    code: string;
  };
  morning: TripSummary;
  afternoon: TripSummary;
}

export interface TripSummary {
  scheduled: boolean;
  scheduleStatus?: string;
  studentStatus: string;
  pickupTime?: Date;
  dropoffTime?: Date;
  pickedUpBy?: {
    name: string;
    phone: string;
    relationship: string;
  };
  events: TransportEvent[];
  delay: number;
}

export interface TransportOverview {
  studentId: string;
  studentName: string;
  hasTransport: boolean;
  route?: {
    name: string;
    code: string;
  };
  currentStatus?: string;
  tripStatus?: string;
  isOnBus?: boolean;
  delay?: number;
}

// ==================== RESULTS TYPES ====================

export interface ResultSummary {
  id: string;
  academicYear: string;
  term: string;
  examType: "midterm" | "final" | "annual";
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  publishedAt: Date;
}

export interface DetailedResult {
  id: string;
  studentId: string;
  academicYear: string;
  term: string;
  examType: "midterm" | "final" | "annual";
  subjects: SubjectResult[];
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  principalRemarks?: string;
  classTeacherRemarks?: string;
  publishedAt: Date;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  maxScore: number;
  score: number;
  grade: string;
  teacherRemarks?: string;
}

// ==================== ATTENDANCE TYPES ====================

export interface AttendanceRecord {
  id: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
}

export interface AttendanceReportMonth {
  month: number;
  year: number;
  stats: AttendanceStats;
  records: AttendanceRecord[];
  workingDays: number;
}

export interface AttendanceTrend {
  period: string;
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
}
