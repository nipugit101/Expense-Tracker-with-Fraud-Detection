import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return this.post('/auth/register', userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.post('/auth/login', credentials);
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getProfile() {
    return this.get('/auth/me');
  }

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    return this.put('/users/profile', data);
  }

  async updatePreferences(preferences: any) {
    return this.put('/users/preferences', preferences);
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.put('/users/change-password', data);
  }

  async getTransactions(filters?: any) {
    return this.get('/transactions', filters);
  }

  async createTransaction(transaction: any) {
    return this.post('/transactions', transaction);
  }

  async updateTransaction(id: string, transaction: any) {
    return this.put(`/transactions/${id}`, transaction);
  }

  async deleteTransaction(id: string) {
    return this.delete(`/transactions/${id}`);
  }

  async getCategorySpending(filters?: any) {
    return this.get('/transactions/categories/spending', filters);
  }

  async getWalletBalance() {
    return this.get('/wallet/balance');
  }

  async addFunds(amount: number, description?: string) {
    return this.post('/wallet/add-funds', { amount, description });
  }

  async transferFunds(data: {
    toEmail: string;
    amount: number;
    description: string;
  }) {
    return this.post('/wallet/transfer', data);
  }

  async getWalletTransactions(params?: any) {
    return this.get('/wallet/transactions', params);
  }

  async getWalletContacts() {
    return this.get('/wallet/contacts');
  }

  async getDashboard() {
    return this.get('/analytics/dashboard');
  }

  async getSpendingTrends(params?: any) {
    return this.get('/analytics/spending-trends', params);
  }

  async getBudgetAnalysis() {
    return this.get('/analytics/budget-analysis');
  }

  async getInsights() {
    return this.get('/analytics/insights');
  }

  async getFraudAlerts(params?: any) {
    return this.get('/fraud/alerts', params);
  }

  async reviewFraudAlert(id: string, data: {
    status: string;
    notes?: string;
  }) {
    return this.put(`/fraud/alerts/${id}/review`, data);
  }

  async getFraudSummary() {
    return this.get('/fraud/summary');
  }

  async forgotPassword(email: string) {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.post(`/auth/reset-password/${token}`, { password });
  }

  async verifyEmail(token: string) {
    return this.get(`/auth/verify-email/${token}`);
  }

  async getAnalytics(params?: { timeRange?: string }) {
    return this.get('/analytics/dashboard', params);
  }

  async exportTransactions(params?: { timeRange?: string; format?: string }) {
    const response = await this.api.get('/analytics/export', {
      params,
      responseType: 'text'
    });
    return response.data;
  }

  // ...existing methods...

  async exportUserData() {
    return this.get('/user/export');
  }

  async deleteAccount() {
    return this.delete('/user/account');
  }
}

export const apiService = new ApiService();
export default apiService;
