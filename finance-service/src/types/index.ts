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
  sub: string | number;
  role: string;
  email?: string;
  phone?: string;
  status?: string;
  school_id?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  permissions?: string[];
  iat?: number;
  exp?: number;
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

export interface SchoolFeeSummary {
  schoolId: string;
  schoolName: string;
  totalFees: number;
  totalPaid: number;
  totalBalance: number;
  currency: string;
  children: ChildFeeSummary[];
}

export interface ChildFeeSummary {
  studentId: string;
  studentName: string;
  className?: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  pendingItems: number;
  overdueItems: number;
}

export interface FeeItem {
  id: string;
  feeName: string;
  feeType: string;
  amount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: Date;
  status: string;
  academicYear: string;
  term?: string;
}
