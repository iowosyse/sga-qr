// User roles
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

// Attendance status
export enum AttendanceStatus {
  PRESENT = 'present',
  PENDING = 'pending',
  MANUAL = 'manual',
  ABSENT = 'absent',
  JUSTIFIED = 'justified',
}

// Session state
export enum SessionState {
  IDLE = 'idle',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

// Auth
export interface User {
  id: string;
  no_control: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  rol: UserRole;
}

export interface JWTPayload {
  sub: string;
  rol: UserRole;
  iat: number;
  exp: number;
}

// Class session
export interface ClassSession {
  id: string;
  materia: string;
  grupo: string;
  aula: string;
  horario: string;
  docente: string;
  activa: boolean;
  inicio_at: string;
  fin_at?: string;
}

// Attendance
export interface Attendance {
  id: string;
  estudiante_id: string;
  sesion_id: string;
  timestamp: string;
  metodo: 'qr' | 'manual';
  estado: AttendanceStatus;
}

// Student with attendance in session
export interface StudentInSession {
  id: string;
  no_control: string;
  nombre: string;
  status: AttendanceStatus;
}

// QR token (TOTP)
export interface QRToken {
  token: string;
  expires_in: number; // seconds
}
