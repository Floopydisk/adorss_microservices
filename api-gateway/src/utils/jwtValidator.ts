import axios from "axios";
import jwt from "jsonwebtoken";

interface DecodedToken {
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

class JWTValidator {
  private authServiceUrl: string;

  constructor(authServiceUrl: string) {
    this.authServiceUrl = authServiceUrl;
  }

  decodeToken(token: string): DecodedToken | null {
    try {
      const decoded = jwt.decode(token) as DecodedToken | null;
      if (!decoded) return null;

      // Check expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return null;
    }
    return parts[1];
  }

  async verifyToken(token: string): Promise<DecodedToken | null> {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    try {
      // Call auth service to verify token signature
      await axios.post(
        `${this.authServiceUrl}/auth/verify-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );
      return decoded;
    } catch (error) {
      console.error(
        "Token verification failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  async checkPermission(
    token: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/auth/permissions/check`,
        {
          resource,
          action,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );
      return response.data.allowed === true;
    } catch (error) {
      console.error(
        "Permission check failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    }
  }

  async checkManyPermissions(
    token: string,
    permissions: string[],
  ): Promise<Record<string, boolean>> {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/auth/permissions/check-many`,
        { permissions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );
      return response.data.results || {};
    } catch (error) {
      console.error(
        "Batch permission check failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return {};
    }
  }

  async getUserInfo(token: string) {
    try {
      const response = await axios.get(`${this.authServiceUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error(
        "User info retrieval failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }
}

export default JWTValidator;
export type { DecodedToken };
