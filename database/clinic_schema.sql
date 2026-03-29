-- Clinic Management Database Schema

-- Users/Auth is handled by Supabase Auth

-- Clinics table (must be created BEFORE profiles due to FK dependency)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  owner_id UUID REFERENCES auth.users(id),
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  max_users INTEGER DEFAULT 5,
  max_patients INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table (links users to clinics)
-- clinic_id is nullable to allow user creation before clinic setup
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'assistant')) DEFAULT 'assistant',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(10, 2),
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinic_id, code)
);

-- Dental Codes table (reference codes, not clinic-specific but with clinic context)
CREATE TABLE IF NOT EXISTS dental_codes (
  code TEXT PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total NUMERIC(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('unpaid', 'paid', 'cancelled')) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_code TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clinic Activity Log (for audit trail)
CREATE TABLE IF NOT EXISTS clinic_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_clinic_id ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_clinic_id ON clinic_activity_log(clinic_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's clinic_id
-- SET search_path prevents search_path injection attacks on SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- Aggregate function: total revenue for a clinic (avoids full table scan client-side)
CREATE OR REPLACE FUNCTION get_clinic_revenue(p_clinic_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total), 0) FROM invoices WHERE clinic_id = p_clinic_id
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their clinic"
ON profiles FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- CLINICS policies
CREATE POLICY "Authenticated users can create a clinic"
ON clinics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own clinic"
ON clinics FOR SELECT
USING (id = get_my_clinic_id());

CREATE POLICY "Clinic owners can update clinic"
ON clinics FOR UPDATE
USING (
  id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- PATIENTS policies
CREATE POLICY "Users can view patients in their clinic"
ON patients FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can insert patients in their clinic"
ON patients FOR INSERT
WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can update patients in their clinic"
ON patients FOR UPDATE
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Only admin can delete patients"
ON patients FOR DELETE
USING (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- APPOINTMENTS policies
CREATE POLICY "Users can view appointments in their clinic"
ON appointments FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can insert appointments"
ON appointments FOR INSERT
WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can update appointments"
ON appointments FOR UPDATE
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Only admin can delete appointments"
ON appointments FOR DELETE
USING (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- TREATMENTS policies
CREATE POLICY "Users can view treatments in their clinic"
ON treatments FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Admins can manage treatments"
ON treatments FOR INSERT
WITH CHECK (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update treatments"
ON treatments FOR UPDATE
USING (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admin can delete treatments"
ON treatments FOR DELETE
USING (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INVOICES policies
CREATE POLICY "Users can view invoices in their clinic"
ON invoices FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can create invoices"
ON invoices FOR INSERT
WITH CHECK (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can update invoices"
ON invoices FOR UPDATE
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Only admin can delete invoices"
ON invoices FOR DELETE
USING (
  clinic_id = get_my_clinic_id() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INVOICE_ITEMS policies
CREATE POLICY "Users can view invoice items"
ON invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE id = invoice_items.invoice_id
    AND clinic_id = get_my_clinic_id()
  )
);

CREATE POLICY "Users can insert invoice items"
ON invoice_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE id = invoice_items.invoice_id
    AND clinic_id = get_my_clinic_id()
  )
);

CREATE POLICY "Users can update invoice items"
ON invoice_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE id = invoice_items.invoice_id
    AND clinic_id = get_my_clinic_id()
  )
);

CREATE POLICY "Only admin can delete invoice items"
ON invoice_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE id = invoice_items.invoice_id
    AND clinic_id = get_my_clinic_id()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ACTIVITY_LOG policies
CREATE POLICY "Users can view activity log for their clinic"
ON clinic_activity_log FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Users can insert activity log"
ON clinic_activity_log FOR INSERT
WITH CHECK (clinic_id = get_my_clinic_id());
