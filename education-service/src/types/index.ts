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
}

export interface ParentDashboard {
  children: ChildSummary[];
  recentAnnouncements: any[];
  upcomingEvents: any[];
  pendingFees?: {
    total: number;
    dueDate?: Date;
  };
  unreadMessages: number;
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
