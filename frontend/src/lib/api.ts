import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Response shapes ────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  rol: string;
  nombre: string;
}

export interface TodayClass {
  horario_id: number;
  materia: string;
  grupo: string;
  aula: string;
  hora_inicio: string;
  hora_fin: string;
  sesion_activa_id: number | null;
}

export interface StartSessionResponse {
  session_id: number;
  qr_base64: string;
  token: string;
  expires_in: number;
}

export interface QRResponse {
  qr_base64: string;
  token: string;
  expires_in: number;
}

export interface AttendanceRecord {
  estudiante_id: number;
  no_control: string;
  nombre: string;
  timestamp: string | null;
  estado: string;
}

export interface SessionStats {
  presentes: number;
  pendientes: number;
  total: number;
  students: AttendanceRecord[];
}

export interface SessionInfo {
  lat_docente: number | null;
  lng_docente: number | null;
  radio_metros: number;
  materia: string;
  grupo: string;
  aula: string;
}

export interface AttendResponse {
  ok: boolean;
  mensaje: string;
  materia: string;
  grupo: string;
  aula: string;
  timestamp: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('rol');
          localStorage.removeItem('nombre');
          window.location.href = '/login';
        }
        if (error.response?.status === 423) {
          const msg = error.response?.data?.detail ?? 'Cuenta bloqueada temporalmente. Intenta en 15 minutos.';
          alert(msg);
        }
        return Promise.reject(error);
      },
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(no_control: string, password: string): Promise<LoginResponse> {
    const { data } = await this.client.post<LoginResponse>('/api/auth/login', { no_control, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('nombre', data.nombre);
    return data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // ── Teacher ───────────────────────────────────────────────────────────────

  async getClassesToday(all = false): Promise<TodayClass[]> {
    const { data } = await this.client.get<TodayClass[]>('/api/teacher/classes/today', {
      params: all ? { all: 'true' } : {},
    });
    return data;
  }

  async startSession(horario_id: number, lat: number, lng: number): Promise<StartSessionResponse> {
    const { data } = await this.client.post<StartSessionResponse>('/api/teacher/session/start', {
      horario_id,
      lat,
      lng,
    });
    return data;
  }

  async getSessionQR(sessionId: number): Promise<QRResponse> {
    const { data } = await this.client.get<QRResponse>(`/api/teacher/session/${sessionId}/qr`);
    return data;
  }

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    const { data } = await this.client.get<SessionStats>(`/api/teacher/session/${sessionId}/stats`);
    return data;
  }

  async closeSession(sessionId: number): Promise<void> {
    await this.client.post(`/api/teacher/session/${sessionId}/close`);
  }

  async updateAttendance(asistenciaId: number, estado: string): Promise<void> {
    await this.client.patch(`/api/teacher/attendance/${asistenciaId}`, { estado });
  }

  // ── Student ───────────────────────────────────────────────────────────────

  async getSessionInfo(token_qr: string): Promise<SessionInfo> {
    const { data } = await this.client.get<SessionInfo>('/api/student/session-info', {
      params: { token_qr },
    });
    return data;
  }

  async attend(token_qr: string, lat: number, lng: number): Promise<AttendResponse> {
    const { data } = await this.client.post<AttendResponse>('/api/student/attend', {
      token_qr,
      lat,
      lng,
    });
    return data;
  }
}

export const apiClient = new APIClient();
