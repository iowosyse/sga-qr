import axios, { AxiosInstance } from 'axios';
import type { AuthResponse, Attendance, ClassSession, QRToken } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await this.refresh(refreshToken);
              this.setTokens(response.access_token, refreshToken);
              // Retry original request
              return this.client(error.config);
            } catch (refreshError) {
              this.clearTokens();
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth endpoints
  async login(no_control: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', {
      no_control,
      password,
    });
    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  // Student endpoints
  async attend(sessionId: string, qrToken: string, lat: number, lng: number): Promise<Attendance> {
    const response = await this.client.post<Attendance>('/api/student/attend', {
      session_id: sessionId,
      token_qr: qrToken,
      lat,
      lng,
    });
    return response.data;
  }

  async getStudentHistory(): Promise<Attendance[]> {
    const response = await this.client.get<Attendance[]>('/api/student/history');
    return response.data;
  }

  // Teacher endpoints
  async startSession(horarioId: string): Promise<ClassSession> {
    const response = await this.client.post<ClassSession>('/api/teacher/session/start', {
      horario_id: horarioId,
    });
    return response.data;
  }

  async getSessionQR(sessionId: string): Promise<QRToken> {
    const response = await this.client.get<QRToken>(`/api/teacher/session/${sessionId}/qr`);
    return response.data;
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.client.post(`/api/teacher/session/${sessionId}/close`);
  }

  async getClassesForDay(): Promise<ClassSession[]> {
    const response = await this.client.get<ClassSession[]>('/api/teacher/classes');
    return response.data;
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    this.accessToken = accessToken;
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessToken = null;
  }

  logout(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const apiClient = new APIClient();
