-- ============================================================================
-- Dashboard Functions
-- ============================================================================
-- Optimized SQL functions for dashboard analytics and KPI calculations
-- All functions respect multi-tenant isolation via get_my_clinic_id()
-- ============================================================================

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get current user's clinic ID (already in schema, included for reference)
-- CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
-- RETURNS UUID AS $$
--   SELECT clinic_id FROM public.profiles
--   WHERE id = auth.uid()
-- $$ LANGUAGE SQL STABLE;

-- ============================================================================
-- KPI Functions (Key Performance Indicators)
-- ============================================================================

-- Get total patients count for current clinic
CREATE OR REPLACE FUNCTION public.get_total_patients()
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM public.patients
  WHERE clinic_id = public.get_my_clinic_id()
    AND deleted_at IS NULL
$$ LANGUAGE SQL STABLE;

-- Get total appointments count for current clinic
CREATE OR REPLACE FUNCTION public.get_total_appointments()
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM public.appointments
  WHERE clinic_id = public.get_my_clinic_id()
    AND deleted_at IS NULL
$$ LANGUAGE SQL STABLE;

-- Get total invoice revenue for current clinic
CREATE OR REPLACE FUNCTION public.get_total_revenue()
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices
  WHERE clinic_id = public.get_my_clinic_id()
    AND status = 'paid'
    AND deleted_at IS NULL
$$ LANGUAGE SQL STABLE;

-- Get pending revenue (unpaid invoices) for current clinic
CREATE OR REPLACE FUNCTION public.get_pending_revenue()
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices
  WHERE clinic_id = public.get_my_clinic_id()
    AND status IN ('pending', 'overdue')
    AND deleted_at IS NULL
$$ LANGUAGE SQL STABLE;

-- Get team members count for current clinic
CREATE OR REPLACE FUNCTION public.get_team_members_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM public.profiles
  WHERE clinic_id = public.get_my_clinic_id()
$$ LANGUAGE SQL STABLE;

-- Get all KPIs in one query
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis()
RETURNS TABLE(
  total_patients INTEGER,
  total_appointments INTEGER,
  total_revenue DECIMAL,
  pending_revenue DECIMAL,
  team_members INTEGER,
  active_patients INTEGER,
  upcoming_appointments INTEGER
) AS $$
  WITH clinic_data AS (
    SELECT public.get_my_clinic_id() as clinic_id
  ),
  active_patients_count AS (
    SELECT COUNT(*) as count FROM public.patients p
    WHERE p.clinic_id = (SELECT clinic_id FROM clinic_data)
      AND p.deleted_at IS NULL
      AND p.status = 'active'
  ),
  upcoming_appts AS (
    SELECT COUNT(*) as count FROM public.appointments a
    WHERE a.clinic_id = (SELECT clinic_id FROM clinic_data)
      AND a.deleted_at IS NULL
      AND a.appointment_date >= CURRENT_DATE
      AND a.status IN ('scheduled', 'confirmed')
  )
  SELECT
    public.get_total_patients()::INTEGER,
    public.get_total_appointments()::INTEGER,
    public.get_total_revenue()::DECIMAL,
    public.get_pending_revenue()::DECIMAL,
    public.get_team_members_count()::INTEGER,
    COALESCE((SELECT count FROM active_patients_count), 0)::INTEGER,
    COALESCE((SELECT count FROM upcoming_appts), 0)::INTEGER
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Growth & Trend Functions
-- ============================================================================

-- Get patient growth for the last N months
CREATE OR REPLACE FUNCTION public.get_patient_growth(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
  month TEXT,
  total_patients INTEGER,
  new_patients INTEGER
) AS $$
  WITH date_series AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, months_back - 1))::DATE as month_start
  ),
  monthly_patients AS (
    SELECT
      DATE_TRUNC('month', p.created_at)::DATE as month,
      COUNT(*) as new_count
    FROM public.patients p
    WHERE p.clinic_id = public.get_my_clinic_id()
      AND p.deleted_at IS NULL
      AND p.created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', p.created_at)
  )
  SELECT
    TO_CHAR(ds.month_start, 'YYYY-MM') as month,
    (SELECT COUNT(*) FROM public.patients p 
     WHERE p.clinic_id = public.get_my_clinic_id()
       AND p.deleted_at IS NULL
       AND p.created_at <= (ds.month_start + INTERVAL '1 month' - INTERVAL '1 day')
    )::INTEGER as total_patients,
    COALESCE(mp.new_count, 0)::INTEGER as new_patients
  FROM date_series ds
  LEFT JOIN monthly_patients mp ON ds.month_start = mp.month
  ORDER BY ds.month_start DESC
$$ LANGUAGE SQL STABLE;

-- Get revenue trend for the last N months
CREATE OR REPLACE FUNCTION public.get_revenue_trend(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
  month TEXT,
  revenue DECIMAL,
  invoice_count INTEGER,
  average_invoice DECIMAL
) AS $$
  WITH date_series AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, months_back - 1))::DATE as month_start
  ),
  monthly_invoices AS (
    SELECT
      DATE_TRUNC('month', i.created_at)::DATE as month,
      SUM(i.total_amount) as total_revenue,
      COUNT(*) as invoice_count
    FROM public.invoices i
    WHERE i.clinic_id = public.get_my_clinic_id()
      AND i.status = 'paid'
      AND i.deleted_at IS NULL
      AND i.created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', i.created_at)
  )
  SELECT
    TO_CHAR(ds.month_start, 'YYYY-MM') as month,
    COALESCE(mi.total_revenue, 0) as revenue,
    COALESCE(mi.invoice_count, 0)::INTEGER as invoice_count,
    CASE
      WHEN mi.invoice_count > 0 THEN ROUND((mi.total_revenue / mi.invoice_count)::NUMERIC, 2)
      ELSE 0
    END as average_invoice
  FROM date_series ds
  LEFT JOIN monthly_invoices mi ON ds.month_start = mi.month
  ORDER BY ds.month_start DESC
$$ LANGUAGE SQL STABLE;

-- Get appointment trend for the last N months
CREATE OR REPLACE FUNCTION public.get_appointment_trend(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
  month TEXT,
  total_appointments INTEGER,
  completed_appointments INTEGER,
  cancelled_appointments INTEGER
) AS $$
  WITH date_series AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, months_back - 1))::DATE as month_start
  ),
  monthly_appts AS (
    SELECT
      DATE_TRUNC('month', a.appointment_date)::DATE as month,
      COUNT(*) FILTER (WHERE a.status = 'completed') as completed,
      COUNT(*) FILTER (WHERE a.status = 'cancelled') as cancelled,
      COUNT(*) as total
    FROM public.appointments a
    WHERE a.clinic_id = public.get_my_clinic_id()
      AND a.deleted_at IS NULL
      AND a.appointment_date >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', a.appointment_date)
  )
  SELECT
    TO_CHAR(ds.month_start, 'YYYY-MM') as month,
    COALESCE(ma.total, 0)::INTEGER as total_appointments,
    COALESCE(ma.completed, 0)::INTEGER as completed_appointments,
    COALESCE(ma.cancelled, 0)::INTEGER as cancelled_appointments
  FROM date_series ds
  LEFT JOIN monthly_appts ma ON ds.month_start = ma.month
  ORDER BY ds.month_start DESC
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Analysis Functions
-- ============================================================================

-- Get top N treatments by appointment count
CREATE OR REPLACE FUNCTION public.get_top_treatments(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  treatment_id UUID,
  treatment_name VARCHAR,
  appointment_count INTEGER,
  total_revenue DECIMAL,
  average_price DECIMAL
) AS $$
  SELECT
    t.id as treatment_id,
    t.name as treatment_name,
    COUNT(a.id)::INTEGER as appointment_count,
    COALESCE(SUM(ii.amount), 0) as total_revenue,
    CASE
      WHEN COUNT(a.id) > 0 THEN ROUND((COALESCE(SUM(ii.amount), 0) / COUNT(a.id))::NUMERIC, 2)
      ELSE 0
    END as average_price
  FROM public.treatments t
  LEFT JOIN public.appointments a ON t.id = a.treatment_id
    AND a.clinic_id = public.get_my_clinic_id()
    AND a.deleted_at IS NULL
  LEFT JOIN public.invoice_items ii ON a.id = ii.appointment_id
    AND ii.deleted_at IS NULL
  WHERE t.clinic_id = public.get_my_clinic_id()
    AND t.deleted_at IS NULL
  GROUP BY t.id, t.name
  ORDER BY appointment_count DESC
  LIMIT limit_count
$$ LANGUAGE SQL STABLE;

-- Get top N patients by invoice count
CREATE OR REPLACE FUNCTION public.get_top_patients(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  patient_id UUID,
  patient_name VARCHAR,
  invoice_count INTEGER,
  total_spent DECIMAL,
  last_visit DATE
) AS $$
  SELECT
    p.id as patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    COUNT(i.id)::INTEGER as invoice_count,
    COALESCE(SUM(i.total_amount), 0) as total_spent,
    MAX(a.appointment_date) as last_visit
  FROM public.patients p
  LEFT JOIN public.invoices i ON p.id = i.patient_id
    AND i.clinic_id = public.get_my_clinic_id()
    AND i.deleted_at IS NULL
  LEFT JOIN public.appointments a ON p.id = a.patient_id
    AND a.clinic_id = public.get_my_clinic_id()
    AND a.deleted_at IS NULL
  WHERE p.clinic_id = public.get_my_clinic_id()
    AND p.deleted_at IS NULL
  GROUP BY p.id, p.first_name, p.last_name
  ORDER BY total_spent DESC
  LIMIT limit_count
$$ LANGUAGE SQL STABLE;

-- Get appointment status summary
CREATE OR REPLACE FUNCTION public.get_appointment_status_summary()
RETURNS TABLE(
  status VARCHAR,
  count INTEGER,
  percentage DECIMAL
) AS $$
  WITH status_counts AS (
    SELECT
      a.status,
      COUNT(*) as count
    FROM public.appointments a
    WHERE a.clinic_id = public.get_my_clinic_id()
      AND a.deleted_at IS NULL
    GROUP BY a.status
  ),
  total_count AS (
    SELECT COUNT(*) as total FROM public.appointments
    WHERE clinic_id = public.get_my_clinic_id()
      AND deleted_at IS NULL
  )
  SELECT
    sc.status,
    sc.count::INTEGER,
    ROUND((sc.count::DECIMAL / NULLIF(tc.total, 0) * 100)::NUMERIC, 2) as percentage
  FROM status_counts sc
  CROSS JOIN total_count tc
  ORDER BY sc.count DESC
$$ LANGUAGE SQL STABLE;

-- Get invoice status summary
CREATE OR REPLACE FUNCTION public.get_invoice_status_summary()
RETURNS TABLE(
  status VARCHAR,
  count INTEGER,
  amount DECIMAL,
  percentage DECIMAL
) AS $$
  WITH status_data AS (
    SELECT
      i.status,
      COUNT(*) as count,
      SUM(i.total_amount) as amount
    FROM public.invoices i
    WHERE i.clinic_id = public.get_my_clinic_id()
      AND i.deleted_at IS NULL
    GROUP BY i.status
  ),
  total_data AS (
    SELECT COUNT(*) as total, SUM(total_amount) as total_amount FROM public.invoices
    WHERE clinic_id = public.get_my_clinic_id()
      AND deleted_at IS NULL
  )
  SELECT
    sd.status,
    sd.count::INTEGER,
    COALESCE(sd.amount, 0) as amount,
    CASE
      WHEN td.total > 0 THEN ROUND((sd.count::DECIMAL / td.total * 100)::NUMERIC, 2)
      ELSE 0
    END as percentage
  FROM status_data sd
  CROSS JOIN total_data td
  ORDER BY sd.count DESC
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Comprehensive Dashboard Data Function
-- ============================================================================

-- Get complete dashboard data in one query (optimized)
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS TABLE(
  -- KPIs
  total_patients INTEGER,
  total_appointments INTEGER,
  total_revenue DECIMAL,
  pending_revenue DECIMAL,
  team_members INTEGER,
  active_patients INTEGER,
  upcoming_appointments INTEGER,
  -- Additional stats
  completed_today INTEGER,
  new_patients_this_month INTEGER,
  invoices_this_month INTEGER
) AS $$
  WITH clinic_data AS (
    SELECT public.get_my_clinic_id() as clinic_id
  ),
  kpis AS (
    SELECT
      (SELECT count(*) FROM public.patients p WHERE p.clinic_id = (SELECT clinic_id FROM clinic_data) AND p.deleted_at IS NULL)::INTEGER as total_patients,
      (SELECT count(*) FROM public.appointments a WHERE a.clinic_id = (SELECT clinic_id FROM clinic_data) AND a.deleted_at IS NULL)::INTEGER as total_appointments,
      (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices i WHERE i.clinic_id = (SELECT clinic_id FROM clinic_data) AND i.status = 'paid' AND i.deleted_at IS NULL)::DECIMAL as total_revenue,
      (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices i WHERE i.clinic_id = (SELECT clinic_id FROM clinic_data) AND i.status IN ('pending', 'overdue') AND i.deleted_at IS NULL)::DECIMAL as pending_revenue,
      (SELECT count(*) FROM public.profiles WHERE clinic_id = (SELECT clinic_id FROM clinic_data))::INTEGER as team_members,
      (SELECT count(*) FROM public.patients p WHERE p.clinic_id = (SELECT clinic_id FROM clinic_data) AND p.deleted_at IS NULL AND p.status = 'active')::INTEGER as active_patients,
      (SELECT count(*) FROM public.appointments a WHERE a.clinic_id = (SELECT clinic_id FROM clinic_data) AND a.deleted_at IS NULL AND a.appointment_date >= CURRENT_DATE AND a.status IN ('scheduled', 'confirmed'))::INTEGER as upcoming_appointments
  ),
  today_stats AS (
    SELECT
      (SELECT count(*) FROM public.appointments a WHERE a.clinic_id = (SELECT clinic_id FROM clinic_data) AND a.deleted_at IS NULL AND a.status = 'completed' AND DATE(a.appointment_date) = CURRENT_DATE)::INTEGER as completed_today,
      (SELECT count(*) FROM public.patients p WHERE p.clinic_id = (SELECT clinic_id FROM clinic_data) AND p.deleted_at IS NULL AND DATE(p.created_at) >= DATE_TRUNC('month', CURRENT_DATE))::INTEGER as new_patients_this_month,
      (SELECT count(*) FROM public.invoices i WHERE i.clinic_id = (SELECT clinic_id FROM clinic_data) AND i.deleted_at IS NULL AND DATE(i.created_at) >= DATE_TRUNC('month', CURRENT_DATE))::INTEGER as invoices_this_month
  )
  SELECT
    k.total_patients,
    k.total_appointments,
    k.total_revenue,
    k.pending_revenue,
    k.team_members,
    k.active_patients,
    k.upcoming_appointments,
    t.completed_today,
    t.new_patients_this_month,
    t.invoices_this_month
  FROM kpis k, today_stats t
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Performance Optimization
-- ============================================================================

-- Create indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON public.invoices(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status) WHERE deleted_at IS NULL;

-- Composite indexes for common patterns
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, appointment_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_date ON public.invoices(clinic_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_clinic_status ON public.patients(clinic_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- Usage Examples
-- ============================================================================

/*
-- Get all KPIs
SELECT * FROM public.get_dashboard_kpis();

-- Get complete dashboard data
SELECT * FROM public.get_dashboard_data();

-- Get patient growth for last 12 months
SELECT * FROM public.get_patient_growth(12);

-- Get revenue trend
SELECT * FROM public.get_revenue_trend(6);

-- Get appointment trends
SELECT * FROM public.get_appointment_trend(12);

-- Get top treatments
SELECT * FROM public.get_top_treatments(10);

-- Get top patients
SELECT * FROM public.get_top_patients(5);

-- Get appointment status summary
SELECT * FROM public.get_appointment_status_summary();

-- Get invoice status summary
SELECT * FROM public.get_invoice_status_summary();

-- Get specific KPIs individually
SELECT public.get_total_patients() as patients;
SELECT public.get_total_revenue() as revenue;
SELECT public.get_pending_revenue() as pending;
*/
