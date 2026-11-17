// ──────────────────────────────────────────────────────────────
//  AulaControl — Global Types & Interfaces
// ──────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────

export enum AttendanceStatus {
  PRESENTE = 'PRESENTE',
  AUSENTE  = 'AUSENTE',
  TARDANZA = 'TARDANZA',
  EXCUSA   = 'EXCUSA',
}

export enum Role {
  ADMIN   = 'ADMIN',
  TEACHER = 'TEACHER',
}

// ── User ──────────────────────────────────────────────────────

export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      Role;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Student ───────────────────────────────────────────────────

export interface Student {
  id:          string;
  firstName:   string;
  lastName:    string;
  code:        string;         // e.g. student ID / enrollment number
  email?:      string | null;
  phone?:      string | null;
  birthDate?:  Date   | null;
  courseId:    string;
  createdAt:   Date;
  updatedAt:   Date;
}

// ── Course ────────────────────────────────────────────────────

export interface Course {
  id:          string;
  name:        string;
  code:        string;
  description?: string | null;
  teacherId:   string;
  teacher?:    User;
  students?:   Student[];
  createdAt:   Date;
  updatedAt:   Date;
}

// ── Attendance ────────────────────────────────────────────────

export interface Attendance {
  id:        string;
  studentId: string;
  courseId:  string;
  date:      Date;
  status:    AttendanceStatus;
  note?:     string | null;
  student?:  Student;
  course?:   Course;
  createdAt: Date;
  updatedAt: Date;
}

// ── Grade ─────────────────────────────────────────────────────

export interface Grade {
  id:          string;
  studentId:   string;
  courseId:    string;
  period:      string;         // e.g. "Trimestre 1", "Bimestre 2"
  score:       number;         // 0–20 or 0–100 depending on school config
  maxScore:    number;
  description?: string | null;
  student?:    Student;
  course?:     Course;
  createdAt:   Date;
  updatedAt:   Date;
}

// ── Pagination ────────────────────────────────────────────────

export interface PaginationMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── API Responses ─────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data:    T;
  message?: string;
}

export interface ApiError {
  success: false;
  error:   string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Attendance summary (for reports) ─────────────────────────

export interface AttendanceSummary {
  studentId:   string;
  studentName: string;
  total:       number;
  presente:    number;
  ausente:     number;
  tardanza:    number;
  excusa:      number;
  percentage:  number;         // 0–1 attendance rate (PRESENTE + TARDANZA)
}


