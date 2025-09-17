/**
 * Authentication Service for DTC Telehealth Platform
 * Handles patient, provider, and admin authentication
 * Following Hims/Ro patterns - simple, direct, conversion-focused
 */

import { api } from './api';

// User roles enum
export enum UserRole {
  PATIENT = 'patient',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  GUEST = 'guest'
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  verified?: boolean;
  subscriptionStatus?: string;
  licenseNumber?: string;
  statesLicensed?: string[];
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Local storage keys
const TOKEN_KEY = 'telehealth_access_token';
const REFRESH_TOKEN_KEY = 'telehealth_refresh_token';
const USER_KEY = 'telehealth_user';

/**
 * Main Authentication Service
 * Handles all auth operations with backend API
 */
class AuthService {
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Patient Registration (Hims/Ro style - minimal friction)
   */
  async registerPatient(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZip?: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register/patient', data);
    
    if (response.data?.data) {
      this.setTokens(response.data.data);
      this.setUser(response.data.data.user);
      this.scheduleTokenRefresh(response.data.data.expiresIn);
      return response.data.data;
    }
    
    throw new Error('Registration failed');
  }

  /**
   * Patient Login (Simple email/password)
   */
  async loginPatient(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login/patient', { email, password });
    
    if (response.data?.data) {
      this.setTokens(response.data.data);
      this.setUser(response.data.data.user);
      this.scheduleTokenRefresh(response.data.data.expiresIn);
      return response.data.data;
    }
    
    throw new Error('Login failed');
  }

  /**
   * Provider Login (Medical professionals)
   */
  async loginProvider(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login/provider', { email, password });
    
    if (response.data?.data) {
      this.setTokens(response.data.data);
      this.setUser(response.data.data.user);
      this.scheduleTokenRefresh(response.data.data.expiresIn);
      return response.data.data;
    }
    
    throw new Error('Login failed');
  }

  /**
   * Admin Login (with optional 2FA)
   */
  async loginAdmin(email: string, password: string, twoFactorCode?: string): Promise<AuthResponse | { requiresTwoFactor: boolean }> {
    const response = await api.post('/api/auth/login/admin', { 
      email, 
      password, 
      twoFactorCode 
    });
    
    // Check if 2FA is required
    if (response.data?.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }
    
    if (response.data?.data) {
      this.setTokens(response.data.data);
      this.setUser(response.data.data.user);
      this.scheduleTokenRefresh(response.data.data.expiresIn);
      return response.data.data;
    }
    
    throw new Error('Login failed');
  }

  /**
   * Submit Patient Intake (No account required - Hims/Ro style)
   * This is the main conversion flow - no login needed
   */
  async submitIntake(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZip?: string;
    allergies?: string[];
    currentMedications?: string[];
    medicalConditions?: string[];
    chiefComplaint: string;
    symptoms?: string[];
    symptomDuration?: string;
    severity?: string;
  }): Promise<{
    consultationId: string;
    submittedAt: string;
    message: string;
  }> {
    const response = await api.post('/api/auth/intake', data);
    return response.data?.data || response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await api.post('/api/auth/refresh', { refreshToken });
      
      if (response.data?.data) {
        this.setTokens(response.data.data);
        this.scheduleTokenRefresh(response.data.data.expiresIn);
        return response.data.data;
      }
    } catch (error) {
      // If refresh fails, clear auth and redirect to login
      this.logout();
      return null;
    }

    return null;
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string, userType: UserRole): Promise<void> {
    await api.post('/api/auth/forgot-password', { email, userType });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string, userType: UserRole): Promise<void> {
    await api.post('/api/auth/reset-password', { token, password, userType });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    const storedUser = this.getUser();
    
    if (!token || !storedUser) {
      return null;
    }

    try {
      const response = await api.get('/api/auth/me');
      
      if (response.data?.data) {
        this.setUser(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      // If getting user fails, try to refresh token
      const refreshed = await this.refreshToken();
      
      if (refreshed) {
        const response = await api.get('/api/auth/me');
        if (response.data?.data) {
          this.setUser(response.data.data);
          return response.data.data;
        }
      }
      
      return null;
    }

    return storedUser;
  }

  /**
   * Logout user and clear all auth data
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
    }

    this.clearTokens();
    this.clearUser();
    this.clearRefreshTimer();
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Check if user is provider
   */
  isProvider(): boolean {
    return this.hasRole(UserRole.PROVIDER);
  }

  /**
   * Check if user is patient
   */
  isPatient(): boolean {
    return this.hasRole(UserRole.PATIENT);
  }

  // Token management methods
  private setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  // User management methods
  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  private clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Token refresh scheduling
  private scheduleTokenRefresh(expiresIn: number): void {
    this.clearRefreshTimer();
    
    // Refresh token 5 minutes before expiration
    const refreshTime = (expiresIn - 300) * 1000;
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Initialize auth service on app load
   * Check for existing session and refresh if needed
   */
  async initialize(): Promise<User | null> {
    const token = this.getAccessToken();
    
    if (!token) {
      return null;
    }

    // Try to get current user, which will refresh token if needed
    return await this.getCurrentUser();
  }

  /**
   * Subscribe to auth state changes
   * Useful for React components
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    // Simple implementation - can be enhanced with event emitter
    const checkAuth = () => {
      const user = this.getUser();
      callback(user);
    };

    // Check immediately
    checkAuth();

    // Check periodically (every 10 seconds)
    const interval = setInterval(checkAuth, 10000);

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export default for convenience
export default authService;

// Legacy Supabase export for compatibility (null since we're using custom auth)
export const supabase = null;
