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

  async requestPhoneOtp(phone: string, countryCode: string = "+1") {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/request-otp`,
        {
          phone,
          country_code: countryCode,
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

  async verifyPhoneOtp(phone: string, otp: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/verify-otp`,
        {
          phone,
          otp,
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
    phone: string;
    otp: string;
    name: string;
    email: string;
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

  async loginWithPhone(phone: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/phone/login`,
        {
          phone,
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
}

export default AuthServiceClient;
