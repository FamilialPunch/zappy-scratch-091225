import axios, { AxiosInstance, AxiosError } from 'axios';
import { authService } from './auth';

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get access token from our auth service
        const accessToken = authService.getAccessToken();
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await authService.refreshToken();
          
          if (refreshed && error.config) {
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return this.client.request(error.config);
          }
          
          // If refresh failed, logout and redirect
          await authService.logout();
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    registerPatient: (data: any) => this.client.post('/api/auth/register/patient', data),
    login: (data: any) => this.client.post('/api/auth/login', data),
    getProfile: () => this.client.get('/api/auth/profile'),
  };

  // Consultation endpoints
  consultations = {
    create: (data: FormData) => this.client.post('/api/consultations', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getById: (id: string) => this.client.get(`/api/consultations/${id}`),
    getPatientConsultations: (patientId: string, params?: any) => 
      this.client.get(`/api/consultations/patient/${patientId}`, { params }),
    getProviderQueue: (params?: any) => 
      this.client.get('/api/consultations/provider/queue', { params }),
    accept: (id: string) => this.client.post(`/api/consultations/${id}/accept`),
    complete: (id: string, data: any) => this.client.post(`/api/consultations/${id}/complete`, data),
  };

  // Message endpoints
  messages = {
    send: (data: FormData) => this.client.post('/api/messages', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getByConsultation: (consultationId: string, params?: any) =>
      this.client.get(`/api/messages/consultation/${consultationId}`, { params }),
    markAsRead: (consultationId: string) =>
      this.client.post(`/api/messages/consultation/${consultationId}/read`),
    getUnreadCount: () => this.client.get('/api/messages/unread-count'),
  };

  // Patient endpoints
  patients = {
    getProfile: (id: string) => this.client.get(`/api/patients/${id}`),
    updateProfile: (id: string, data: any) => this.client.put(`/api/patients/${id}`, data),
    getConsultations: (id: string) => this.client.get(`/api/patients/${id}/consultations`),
  };

  // Provider endpoints
  providers = {
    getAll: () => this.client.get('/api/providers'),
    getById: (id: string) => this.client.get(`/api/providers/${id}`),
    getConsultations: (id: string) => this.client.get(`/api/providers/${id}/consultations`),
  };

  // File endpoints
  files = {
    upload: (data: FormData) => this.client.post('/api/files/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    download: (id: string) => this.client.get(`/api/files/${id}/download`, {
      responseType: 'blob',
    }),
  };

  // Prescriptions endpoints
  prescriptions = {
    getById: (id: string) => this.client.get(`/api/prescriptions/${id}`),
    requestRefill: (id: string, data?: any) => this.client.post(`/api/prescriptions/${id}/refill`, data),
    getRefillHistory: (id: string) => this.client.get(`/api/prescriptions/${id}/refills`),
  };

  // Admin endpoints
  admin = {
    getDashboard: () => this.client.get('/api/admin/dashboard'),
    getAuditLogs: () => this.client.get('/api/admin/audit-logs'),
  };
}

export const apiClient = new ApiClient();

// Export a simpler api object for easier use
export const api = {
  // Ensure requests hit backend '/api' mount when callers use shorthand paths like '/patients/me'
  get: (url: string, config?: any) => apiClient.client.get(withApiPrefix(url), config),
  post: (url: string, data?: any, config?: any) => apiClient.client.post(withApiPrefix(url), data, config),
  put: (url: string, data?: any, config?: any) => apiClient.client.put(withApiPrefix(url), data, config),
  delete: (url: string, config?: any) => apiClient.client.delete(withApiPrefix(url), config),
  // Direct access to client for complex operations
  client: apiClient.client,
};

// Helper: add '/api' prefix when missing for relative paths
function withApiPrefix(url: string): string {
  // Leave absolute URLs untouched
  if (/^https?:\/\//i.test(url)) return url;
  // Already has '/api' prefix
  if (url.startsWith('/api/')) return url;
  // Normalize leading slash
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `/api${normalized}`;
}
