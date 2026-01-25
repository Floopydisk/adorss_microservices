import axios from "axios";

const API_URL = process.env.API_GATEWAY_URL || "http://localhost:3000";

class GatewayTestClient {
  private token: string | null = null;

  async register(name: string, email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });
      if (response.data.token) {
        this.token = response.data.token;
      }
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: error.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      if (response.data.token) {
        this.token = response.data.token;
      }
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: error.message };
    }
  }

  async getStudents() {
    try {
      const response = await axios.get(`${API_URL}/api/students`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: error.message };
    }
  }

  async getTeachers() {
    try {
      const response = await axios.get(`${API_URL}/api/teachers`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: error.message };
    }
  }

  async getFinance() {
    try {
      const response = await axios.get(`${API_URL}/api/finance`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: error.message };
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }
}

export default GatewayTestClient;
