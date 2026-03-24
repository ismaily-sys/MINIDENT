// Database Types - Match Supabase Schema Exactly

// ============================================
// Core Database Types
// ============================================

export interface Clinic {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  full_name: string | null;
  role: 'admin' | 'assistant';
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  date: string;  // timestamp with time zone
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  // Joined data
  patient?: Patient;
}

export interface DentalCode {
  code: string;  // PRIMARY KEY - no id field
  description: string;
  category: string | null;
  default_price: number | null;
  created_at: string;
}

export interface Treatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  code: string | null;  // References dental_codes.code
  description: string;
  price: number;
  created_at: string;
  // Joined data
  patient?: Patient;
  dental_code?: DentalCode;
  appointment?: Appointment;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  total: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
  // Joined data
  patient?: Patient;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  treatment_id: string | null;
  description: string;
  price: number;
  created_at: string;
}

// ============================================
// Form Data Types
// ============================================

export interface PatientFormData {
  name: string;
  phone?: string;
  email?: string;
}

export interface AppointmentFormData {
  patient_id: string;
  date: string;      // ISO date string: '2024-01-15'
  time: string;      // Time string: '14:30'
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TreatmentFormData {
  patient_id: string;
  appointment_id?: string;
  code: string;      // Dental code reference
  description: string;
  price: number;
}

export interface InvoiceFormData {
  patient_id: string;
  items: InvoiceItemFormData[];
  notes?: string;
}

export interface InvoiceItemFormData {
  treatment_id?: string;
  description: string;
  price: number;
}

// ============================================
// Auth Types
// ============================================

export interface AuthContextType {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  clinic: Clinic | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
}

export interface TodayAppointment extends Appointment {
  patient: Patient;
  time: string;  // Extracted time for display
}

// ============================================
// Utility Types
// ============================================

export type AppointmentStatus = 'pending' | 'completed' | 'cancelled';
export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled';
export type UserRole = 'admin' | 'assistant';

// Type for creating new records (omit auto-generated fields)
export type CreatePatientInput = Omit<Patient, 'id' | 'clinic_id' | 'created_at'>;
export type CreateAppointmentInput = Omit<Appointment, 'id' | 'clinic_id' | 'created_at'>;
export type CreateTreatmentInput = Omit<Treatment, 'id' | 'clinic_id' | 'created_at'>;
export type CreateInvoiceInput = Omit<Invoice, 'id' | 'clinic_id' | 'created_at'>;

// Type for updating records (make fields optional)
export type UpdatePatientInput = Partial<CreatePatientInput>;
export type UpdateAppointmentInput = Partial<Omit<Appointment, 'id' | 'clinic_id' | 'patient_id' | 'created_at'>>;
export type UpdateTreatmentInput = Partial<Omit<Treatment, 'id' | 'clinic_id' | 'created_at'>>;
export type UpdateInvoiceInput = Partial<Omit<Invoice, 'id' | 'clinic_id' | 'created_at'>>;
