// Database Types - Match Supabase Schema Exactly

// ============================================
// Core Database Types
// ============================================

export interface Clinic {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  owner_id?: string;
  subscription_plan?: 'free' | 'starter' | 'pro' | 'enterprise';
  subscription_status?: 'active' | 'cancelled' | 'expired';
  max_users?: number;
  max_patients?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string | null;
  full_name: string | null;
  email: string;
  role: 'admin' | 'assistant';
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: Patient;
}

export interface DentalCode {
  code: string;
  clinic_id: string;
  description: string;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  clinic_id: string;
  code: string;
  name: string;
  description?: string | null;
  cost: number | null;
  duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  total: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: Patient;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  treatment_code: string;
  price: number;
  quantity: number;
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
  appointment_date: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TreatmentFormData {
  code: string;
  name: string;
  description?: string;
  cost?: number;
  duration_minutes?: number;
}

export interface InvoiceFormData {
  patient_id: string;
  items: InvoiceItemFormData[];
  notes?: string;
}

export interface InvoiceItemFormData {
  treatment_code: string;
  price: number;
  quantity?: number;
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
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  updateClinic: (updates: Partial<Clinic>) => Promise<Clinic>;
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

export interface ClinicStats {
  patients: number;
  appointments: number;
  users: number;
  revenue: number;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
}

export interface TodayAppointment extends Appointment {
  patient: Patient;
}

// ============================================
// Utility Types
// ============================================

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled';
export type UserRole = 'admin' | 'assistant';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

// Type for creating new records (omit auto-generated fields)
export type CreatePatientInput = Omit<Patient, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>;
export type CreateAppointmentInput = Omit<Appointment, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>;
export type CreateTreatmentInput = Omit<Treatment, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>;
export type CreateInvoiceInput = Omit<Invoice, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>;

// Type for updating records (make fields optional)
export type UpdatePatientInput = Partial<CreatePatientInput>;
export type UpdateAppointmentInput = Partial<Omit<Appointment, 'id' | 'clinic_id' | 'patient_id' | 'created_at' | 'updated_at'>>;
export type UpdateTreatmentInput = Partial<Omit<Treatment, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>>;
export type UpdateInvoiceInput = Partial<Omit<Invoice, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>>;
