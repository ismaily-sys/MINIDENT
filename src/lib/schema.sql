-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clinics Table
create table clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table (links auth.users to clinics)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  clinic_id uuid references clinics(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'assistant')) default 'assistant',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Dental Codes Table (Reference data - shared across all clinics, no clinic_id)
create table dental_codes (
  code text primary key,           -- Primary key is code, not id
  description text not null,
  category text,
  default_price decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Patients Table
create table patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments Table
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  date timestamp with time zone not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Treatments Table
create table treatments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete set null,
  code text references dental_codes(code),  -- References dental_codes.code
  description text not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices Table
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  total decimal(10,2) not null,
  status text check (status in ('unpaid', 'paid', 'cancelled')) default 'unpaid',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoice Items Table (links invoices to treatments)
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  treatment_id uuid references treatments(id) on delete set null,
  description text not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default dental codes
insert into dental_codes (code, description, category, default_price) values
  ('CONSULT', 'Consultation', 'General', 200.00),
  ('XRAY', 'Dental X-Ray', 'Diagnostic', 150.00),
  ('CLEAN', 'Teeth Cleaning', 'Preventive', 300.00),
  ('FILL', 'Filling', 'Conservative', 400.00),
  ('ROOT', 'Root Canal', 'Conservative', 800.00),
  ('EXTRACT', 'Extraction', 'Surgery', 500.00),
  ('CROWN', 'Crown', 'Prosthetic', 1500.00),
  ('IMPLANT', 'Dental Implant', 'Surgery', 5000.00),
  ('BRIDGE', 'Dental Bridge', 'Prosthetic', 3000.00),
  ('WHITEN', 'Teeth Whitening', 'Cosmetic', 600.00),
  ('VENEER', 'Veneer', 'Cosmetic', 800.00),
  ('DENTURE', 'Denture', 'Prosthetic', 1200.00);

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

-- Enable RLS on all tables
alter table clinics enable row level security;
alter table profiles enable row level security;
alter table dental_codes enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table treatments enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- ============================================
-- Clinics Policies
-- ============================================
create policy "Users can see their own clinic"
on clinics for select
using ( id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Admins can update their clinic"
on clinics for update
using ( id in (
  select clinic_id from profiles where id = auth.uid() and role = 'admin'
));

-- ============================================
-- Profiles Policies
-- ============================================
create policy "Users can see profiles in their clinic"
on profiles for select
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can update their own profile"
on profiles for update
using ( id = auth.uid() );

create policy "Admins can insert profiles in their clinic"
on profiles for insert
with check ( clinic_id in (
  select clinic_id from profiles where id = auth.uid() and role = 'admin'
));

-- ============================================
-- Dental Codes Policies (Read-only for all authenticated users)
-- ============================================
create policy "All authenticated users can read dental codes"
on dental_codes for select
using ( auth.uid() is not null );

-- ============================================
-- Patients Policies
-- ============================================
create policy "Users can see patients in their clinic"
on patients for select
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can insert patients in their clinic"
on patients for insert
with check ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can update patients in their clinic"
on patients for update
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can delete patients in their clinic"
on patients for delete
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

-- ============================================
-- Appointments Policies
-- ============================================
create policy "Users can see appointments in their clinic"
on appointments for select
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can insert appointments in their clinic"
on appointments for insert
with check ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can update appointments in their clinic"
on appointments for update
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can delete appointments in their clinic"
on appointments for delete
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

-- ============================================
-- Treatments Policies
-- ============================================
create policy "Users can see treatments in their clinic"
on treatments for select
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can insert treatments in their clinic"
on treatments for insert
with check ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can update treatments in their clinic"
on treatments for update
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can delete treatments in their clinic"
on treatments for delete
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

-- ============================================
-- Invoices Policies
-- ============================================
create policy "Users can see invoices in their clinic"
on invoices for select
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can insert invoices in their clinic"
on invoices for insert
with check ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can update invoices in their clinic"
on invoices for update
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

create policy "Users can delete invoices in their clinic"
on invoices for delete
using ( clinic_id in (
  select clinic_id from profiles where id = auth.uid()
));

-- ============================================
-- Invoice Items Policies
-- ============================================
create policy "Users can see invoice items in their clinic"
on invoice_items for select
using ( invoice_id in (
  select id from invoices where clinic_id in (
    select clinic_id from profiles where id = auth.uid()
  )
));

create policy "Users can insert invoice items in their clinic"
on invoice_items for insert
with check ( invoice_id in (
  select id from invoices where clinic_id in (
    select clinic_id from profiles where id = auth.uid()
  )
));

create policy "Users can update invoice items in their clinic"
on invoice_items for update
using ( invoice_id in (
  select id from invoices where clinic_id in (
    select clinic_id from profiles where id = auth.uid()
  )
));

create policy "Users can delete invoice items in their clinic"
on invoice_items for delete
using ( invoice_id in (
  select id from invoices where clinic_id in (
    select clinic_id from profiles where id = auth.uid()
  )
));

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to automatically create a clinic for new users if they don't have one
create or replace function public.handle_new_user_with_clinic()
returns trigger as $$
declare
  new_clinic_id uuid;
begin
  -- Check if user already has a clinic_id in profile
  if new.clinic_id is null then
    -- Create a new clinic
    insert into public.clinics (name)
    values (coalesce(new.full_name || '''s Clinic', 'My Clinic'))
    returning id into new_clinic_id;
    
    -- Update profile with new clinic_id
    update public.profiles
    set clinic_id = new_clinic_id, role = 'admin'
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Index for better performance
create index if not exists idx_patients_clinic_id on patients(clinic_id);
create index if not exists idx_appointments_clinic_id on appointments(clinic_id);
create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_treatments_clinic_id on treatments(clinic_id);
create index if not exists idx_treatments_code on treatments(code);
create index if not exists idx_invoices_clinic_id on invoices(clinic_id);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);
