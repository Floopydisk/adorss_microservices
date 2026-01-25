export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  sub: number;
  id?: number;
  email: string;
  role: "teacher" | "student" | "parent" | "driver" | "admin";
  name?: string;
  status?: string;
  school_id?: number;
  phone_verified?: boolean;
  email_verified?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export interface DecodedToken {
  sub: number;
  role: string;
  email: string;
  status: string;
  school_id: number;
  phone_verified: boolean;
  email_verified: boolean;
  iat: number;
  exp: number;
}

export interface ServiceConfig {
  auth: string;
  education: string;
  messaging: string;
  mobility: string;
  finance: string;
}
