export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student' | 'parent' | 'driver' | 'admin';
  name: string;
}

export interface AuthRequest extends Request {
  user?: User;
}
