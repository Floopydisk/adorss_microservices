/**
 * Auth Service Client
 *
 * Internal service-to-service client for validating tokens and checking
 * user permissions against the Auth Service.
 *
 * Usage:
 *   import authServiceClient from './services/authServiceClient';
 *
 *   // Validate a token
 *   const user = await authServiceClient.validateToken(token);
 *
 *   // Check permission
 *   const allowed = await authServiceClient.checkPermission(token, 'messages', 'send');
 */

// Auth Service URL - direct internal communication (not through API Gateway)
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:8000";

// ==========================================
// Response Types
// ==========================================

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string;
  name: string;
  role: string;
  status: string;
  school_id: number | null;
  phone_verified: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenValidationResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  error?: {
    code: string;
    message: string;
  };
}

export interface PermissionCheckResponse {
  success: boolean;
  allowed: boolean;
  resource?: string;
  action?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ==========================================
// Auth Service Client
// ==========================================

class AuthServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AUTH_SERVICE_URL;
    console.log(`🔐 Auth Service Client initialized: ${this.baseUrl}`);
  }

  /**
   * Validate a JWT token against the Auth Service
   * Returns the user data if token is valid, null if invalid
   */
  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `Token validation failed: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const result = (await response.json()) as TokenValidationResponse;

      if (!result.success) {
        console.warn(`Token validation failed: ${result.error?.message}`);
        return null;
      }

      return result.user || null;
    } catch (error) {
      console.error("Auth service error:", error);
      return null;
    }
  }

  /**
   * Get user details from token
   */
  async getUser(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = (await response.json()) as {
        success: boolean;
        user?: AuthUser;
      };

      if (!result.success || !result.user) {
        return null;
      }

      return result.user;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }

  /**
   * Check if user has a specific permission
   */
  async checkPermission(
    token: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/permissions/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resource, action }),
      });

      if (!response.ok) {
        return false;
      }

      const result = (await response.json()) as PermissionCheckResponse;
      return result.allowed === true;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(
    token: string,
    permissions: Array<{ resource: string; action: string }>,
  ): Promise<Record<string, boolean>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/auth/permissions/check-many`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        },
      );

      if (!response.ok) {
        // Return all false if check fails
        return permissions.reduce(
          (acc, p) => {
            acc[`${p.resource}:${p.action}`] = false;
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }

      const result = (await response.json()) as {
        success: boolean;
        results: Record<string, boolean>;
      };

      return result.results || {};
    } catch (error) {
      console.error("Permissions check failed:", error);
      return {};
    }
  }

  /**
   * Health check for Auth Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export default new AuthServiceClient();
