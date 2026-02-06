import axios from "axios";

class AuthServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async register(payload: { name: string; email: string; password: string }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/register`,
        payload,
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/login`,
        {
          email,
          password,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async checkEmail(email: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/check-email`,
        {
          email,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async requestPhoneOtp(phone: string, role: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/request-otp`,
        {
          phone,
          role,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async verifyPhoneOtp(phone: string, otp: string, role: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/verify-otp`,
        {
          phone,
          otp,
          role,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async completePhoneRegistration(payload: {
    registration_token: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/complete-registration`,
        payload,
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async loginWithPhone(phone: string, otp: string, role: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/login`,
        {
          phone,
          otp,
          role,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async requestLoginOtp(phone: string, role: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/request-login-otp`,
        {
          phone,
          role,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async verifyEmail(email: string, code: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/verify-email`,
        {
          email,
          code,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/resend-verification-email`,
        {
          email,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/forgot-password`,
        {
          email,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }

  async resetPassword(
    email: string,
    token: string,
    password: string,
    passwordConfirmation: string,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/reset-password`,
        {
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        },
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }
}

export default AuthServiceClient;
