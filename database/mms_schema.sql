-- MMS (Maintenance Management System) Database Schema
-- Scenario-driven simulation engine

-- ============================================
-- ROLES AND PERMISSIONS
-- ============================================

CREATE TYPE mms_role AS ENUM (
  'MANAGER',
  'ENGINEER',
  'CHEF_D_ATELIER',
  'SOUS_CHEF_D_ATELIER',
  'CHEF_D_EQUIPE',
  'TECHNICIEN_LEAD',
  'TECHNICIEN_EXECUTIF'
);

CREATE TYPE mms_service AS ENUM (
  'PRODUCTION',
  'INSPECTION',
  'MAINTENANCE_MECHANICAL',
  'MAINTENANCE_ELECTRICAL_REGULATION'
);

CREATE TYPE mms_specialization AS ENUM (
  'ELECTRICAL',
  'REGULATION'
);

CREATE TYPE mms_action_type AS ENUM (
  'report_issue',
  'inspect_condition',
  'analyze_issue',
  'analyze_failure',
  'create_work_order',
  'approve_work_order',
  'assign_work_order',
  'execute_task',
  'validate_execution',
  'view_all_work_orders',
  'manage_subscription',
  'auto_approve',
  'view_own_tasks'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE mms_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role mms_role NOT NULL,
  service mms_service NOT NULL,
  specialization mms_specialization,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROLE PERMISSIONS TABLE
-- ============================================

CREATE TABLE mms_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role mms_role NOT NULL,
  action mms_action_type NOT NULL,
  UNIQUE(role, action)
);

-- ============================================
-- SCENARIOS TABLE
-- ============================================

CREATE TYPE mms_trigger_type AS ENUM (
  'failure_event',
  'scheduled_event',
  'prediction_signal'
);

CREATE TABLE mms_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type mms_trigger_type NOT NULL,
  steps JSONB NOT NULL, -- Array of step objects: {actor, service, action, specialization?}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXECUTIONS TABLE
-- ============================================

CREATE TYPE mms_execution_status AS ENUM (
  'running',
  'completed',
  'rejected',
  'failed'
);

CREATE TABLE mms_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES mms_scenarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES mms_users(id) ON DELETE SET NULL,
  status mms_execution_status NOT NULL DEFAULT 'running',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TIMELINE EVENTS TABLE
-- ============================================

CREATE TYPE mms_event_status AS ENUM (
  'success',
  'rejected',
  'pending'
);

CREATE TYPE mms_validation_result AS ENUM (
  'allowed',
  'denied'
);

CREATE TABLE mms_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES mms_executions(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  actor_role mms_role NOT NULL,
  actor_service mms_service NOT NULL,
  actor_specialization mms_specialization,
  action mms_action_type NOT NULL,
  status mms_event_status NOT NULL,
  validation mms_validation_result NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_mms_users_role ON mms_users(role);
CREATE INDEX idx_mms_users_service ON mms_users(service);
CREATE INDEX idx_mms_role_permissions_role ON mms_role_permissions(role);
CREATE INDEX idx_mms_scenarios_trigger ON mms_scenarios(trigger_type);
CREATE INDEX idx_mms_executions_scenario ON mms_executions(scenario_id);
CREATE INDEX idx_mms_executions_status ON mms_executions(status);
CREATE INDEX idx_mms_timeline_events_execution ON mms_timeline_events(execution_id);
CREATE INDEX idx_mms_timeline_events_step ON mms_timeline_events(step_index);

-- ============================================
-- SEED DATA: ROLE PERMISSIONS
-- ============================================

INSERT INTO mms_role_permissions (role, action) VALUES
-- MANAGER
('MANAGER', 'view_all_work_orders'),
('MANAGER', 'manage_subscription'),
-- ENGINEER
('ENGINEER', 'analyze_failure'),
('ENGINEER', 'auto_approve'),
('ENGINEER', 'create_work_order'),
-- CHEF_D_ATELIER
('CHEF_D_ATELIER', 'create_work_order'),
('CHEF_D_ATELIER', 'approve_work_order'),
('CHEF_D_ATELIER', 'create_preventive_plan'),
-- SOUS_CHEF_D_ATELIER
('SOUS_CHEF_D_ATELIER', 'create_work_order'),
('SOUS_CHEF_D_ATELIER', 'approve_work_order'),
('SOUS_CHEF_D_ATELIER', 'create_preventive_plan'),
-- CHEF_D_EQUIPE
('CHEF_D_EQUIPE', 'assign_work_order'),
-- TECHNICIEN_LEAD
('TECHNICIEN_LEAD', 'execute_task'),
('TECHNICIEN_LEAD', 'validate_execution'),
-- TECHNICIEN_EXECUTIF
('TECHNICIEN_EXECUTIF', 'execute_task'),
('TECHNICIEN_EXECUTIF', 'view_own_tasks');

-- ============================================
-- SEED DATA: SCENARIOS
-- ============================================

INSERT INTO mms_scenarios (name, description, trigger_type, steps) VALUES
('Maintenance Corrective', 'Workflow de maintenance corrective suite à une panne', 'failure_event', 
'[
  {"step": 1, "actor": "ENGINEER", "service": "INSPECTION", "action": "analyze_failure"},
  {"step": 2, "actor": "CHEF_D_ATELIER", "service": "MAINTENANCE_MECHANICAL", "action": "approve_work_order"},
  {"step": 3, "actor": "CHEF_D_EQUIPE", "service": "MAINTENANCE_MECHANICAL", "action": "assign_work_order"},
  {"step": 4, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_MECHANICAL", "action": "execute_task"},
  {"step": 5, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_MECHANICAL", "action": "validate_execution"}
]'),

('Maintenance Préventive', 'Workflow de maintenance préventive planifiée', 'scheduled_event',
'[
  {"step": 1, "actor": "CHEF_D_ATELIER", "service": "MAINTENANCE_MECHANICAL", "action": "create_work_order"},
  {"step": 2, "actor": "SOUS_CHEF_D_ATELIER", "service": "MAINTENANCE_MECHANICAL", "action": "approve_work_order"},
  {"step": 3, "actor": "CHEF_D_EQUIPE", "service": "MAINTENANCE_MECHANICAL", "action": "assign_work_order"},
  {"step": 4, "actor": "TECHNICIEN_EXECUTIF", "service": "MAINTENANCE_MECHANICAL", "action": "execute_task"},
  {"step": 5, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_MECHANICAL", "action": "validate_execution"}
]'),

('Inspection Électrique', 'Workflow d''inspection et maintenance électrique', 'prediction_signal',
'[
  {"step": 1, "actor": "ENGINEER", "service": "INSPECTION", "action": "inspect_condition"},
  {"step": 2, "actor": "ENGINEER", "service": "INSPECTION", "action": "analyze_issue"},
  {"step": 3, "actor": "CHEF_D_ATELIER", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "action": "approve_work_order"},
  {"step": 4, "actor": "CHEF_D_EQUIPE", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "specialization": "ELECTRICAL", "action": "assign_work_order"},
  {"step": 5, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "specialization": "ELECTRICAL", "action": "execute_task"},
  {"step": 6, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "specialization": "ELECTRICAL", "action": "validate_execution"}
]'),

('Signal Prédictif - Régulation', 'Workflow de maintenance prédictive pour régulation', 'prediction_signal',
'[
  {"step": 1, "actor": "ENGINEER", "service": "INSPECTION", "action": "analyze_issue"},
  {"step": 2, "actor": "CHEF_D_ATELIER", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "action": "create_work_order"},
  {"step": 3, "actor": "CHEF_D_EQUIPE", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "specialization": "REGULATION", "action": "assign_work_order"},
  {"step": 4, "actor": "TECHNICIEN_EXECUTIF", "service": "MAINTENANCE_ELECTRICAL_REGULATION", "specialization": "REGULATION", "action": "execute_task"}
]');

-- ============================================
-- SEED DATA: SAMPLE USERS
-- ============================================

INSERT INTO mms_users (email, name, role, service, specialization) VALUES
-- Manager
('manager@mms.local', 'Directeur Maintenance', 'MANAGER', 'PRODUCTION', NULL),
-- Engineers (Inspection)
('engineer1@mms.local', 'Ingénieur Inspection 1', 'ENGINEER', 'INSPECTION', NULL),
('engineer2@mms.local', 'Ingénieur Inspection 2', 'ENGINEER', 'INSPECTION', NULL),
-- Chef d''Atelier
('chef.atelier1@mms.local', 'Chef d''Atelier Mécanique', 'CHEF_D_ATELIER', 'MAINTENANCE_MECHANICAL', NULL),
('chef.atelier2@mms.local', 'Chef d''Atelier Électrique', 'CHEF_D_ATELIER', 'MAINTENANCE_ELECTRICAL_REGULATION', NULL),
-- Sous-Chef d''Atelier
('sous.chef1@mms.local', 'Sous-Chef Mécanique', 'SOUS_CHEF_D_ATELIER', 'MAINTENANCE_MECHANICAL', NULL),
-- Chef d''Équipe
('chef.equipe1@mms.local', 'Chef d''Équipe Mécanique', 'CHEF_D_EQUIPE', 'MAINTENANCE_MECHANICAL', NULL),
('chef.equipe2@mms.local', 'Chef d''Équipe Électrique', 'CHEF_D_EQUIPE', 'MAINTENANCE_ELECTRICAL_REGULATION', 'ELECTRICAL'),
('chef.equipe3@mms.local', 'Chef d''Équipe Régulation', 'CHEF_D_EQUIPE', 'MAINTENANCE_ELECTRICAL_REGULATION', 'REGULATION'),
-- Technicien Lead
('tech.lead1@mms.local', 'Technicien Lead Mécanique', 'TECHNICIEN_LEAD', 'MAINTENANCE_MECHANICAL', NULL),
('tech.lead2@mms.local', 'Technicien Lead Électrique', 'TECHNICIEN_LEAD', 'MAINTENANCE_ELECTRICAL_REGULATION', 'ELECTRICAL'),
-- Technicien Exécutif
('tech.exec1@mms.local', 'Technicien Exécutif Mécanique', 'TECHNICIEN_EXECUTIF', 'MAINTENANCE_MECHANICAL', NULL),
('tech.exec2@mms.local', 'Technicien Exécutif Électrique', 'TECHNICIEN_EXECUTIF', 'MAINTENANCE_ELECTRICAL_REGULATION', 'ELECTRICAL');
