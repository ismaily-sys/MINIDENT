# MMS - Maintenance Management System

## 🎯 Overview

MMS is a **scenario-driven simulation engine** for maintenance workflows. It is **NOT** a CRUD system or management tool.

### Core Principle
- Users select a scenario
- Click "Exécuter"
- The system executes steps sequentially with real-time validation
- A timeline displays results showing success or rejection at each step

## 🏗️ Architecture

```
src/mms/
├── components/
│   └── MMSLayout.jsx          # Layout for MMS pages
├── pages/
│   ├── Scenarios.jsx          # Page 1: Scenario list + execution
│   └── Executions.jsx         # Page 2: Timeline visualization
├── services/
│   └── ExecutionEngine.js     # Core simulation logic
├── data/                       # Static data (future)
└── utils/                      # Helper functions
```

## 👥 Roles & Permissions

| Role | Permissions |
|------|-------------|
| MANAGER | view_all_work_orders, manage_subscription |
| ENGINEER | analyze_failure, auto_approve, create_work_order |
| CHEF_D_ATELIER | create_work_order, approve_work_order, create_preventive_plan |
| SOUS_CHEF_D_ATELIER | create_work_order, approve_work_order, create_preventive_plan |
| CHEF_D_EQUIPE | assign_work_order (downward hierarchy only) |
| TECHNICIEN_LEAD | execute_task, validate_execution |
| TECHNICIEN_EXECUTIF | execute_task, view_own_tasks |

## 🏭 Services Structure

- **PRODUCTION**: Trigger source only (report_issue)
- **INSPECTION**: Independent service (inspect, analyze, create_work_order)
- **MAINTENANCE_MECHANICAL**: Full operational capabilities
- **MAINTENANCE_ELECTRICAL_REGULATION**: Full operational + specializations (ELECTRICAL, REGULATION)

## ⚙️ Execution Engine

### Validation Flow
1. **RBAC Check**: Does the role have permission for this action?
2. **Service Match**: Does user.service match step.service?
3. **Specialization Check**: If required, does user have the specialization?
4. **Hierarchy Check**: For CHEF_D_EQUIPE, can they assign to this level?

### Failure Rule
If ANY validation fails:
- `status = rejected`
- Execution STOPS immediately
- Error displayed in timeline

## 🧩 Scenarios

Stored as JSON in database:

```json
{
  "name": "Maintenance Corrective",
  "trigger_type": "failure_event",
  "steps": [
    {"step": 1, "actor": "ENGINEER", "service": "INSPECTION", "action": "analyze_failure"},
    {"step": 2, "actor": "CHEF_D_ATELIER", "service": "MAINTENANCE_MECHANICAL", "action": "approve_work_order"},
    {"step": 3, "actor": "CHEF_D_EQUIPE", "service": "MAINTENANCE_MECHANICAL", "action": "assign_work_order"},
    {"step": 4, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_MECHANICAL", "action": "execute_task"},
    {"step": 5, "actor": "TECHNICIEN_LEAD", "service": "MAINTENANCE_MECHANICAL", "action": "validate_execution"}
  ]
}
```

### Trigger Types
- `failure_event`: Corrective maintenance
- `scheduled_event`: Preventive maintenance
- `prediction_signal`: Predictive maintenance

## 📊 Timeline Events

Each step generates:
```json
{
  "step_index": 1,
  "actor_role": "ENGINEER",
  "actor_service": "INSPECTION",
  "action": "analyze_failure",
  "status": "success | rejected",
  "validation": "allowed | denied",
  "message": "Human-readable result",
  "timestamp": "ISO timestamp",
  "metadata": {"user_id": "...", "user_name": "..."}
}
```

## 🗄️ Database Tables

- `mms_users`: Users with role, service, specialization
- `mms_role_permissions`: RBAC definitions
- `mms_scenarios`: Scenario definitions (JSON steps)
- `mms_executions`: Execution records
- `mms_timeline_events`: Step-by-step results

## 🎨 UI Pages

### Page 1: Scénarios (`/mms`)
- List of available scenarios
- "Exécuter" button per scenario
- Real-time execution modal with progress

### Page 2: Exécutions (`/mms/executions`)
- Historical executions list
- Detailed timeline view
- Color-coded status (🟢 success, 🔴 rejected)

## ⚡ UX Behavior
- Delay between steps: 300–800ms
- Active step highlighted
- Progress indicator: "Step X / Y"
- Auto-refresh timeline

## 🚫 What This Is NOT
- ❌ Not a CRUD system
- ❌ No forms for data creation
- ❌ No dashboards with metrics
- ❌ No full org hierarchy simulation
- ❌ Not a work order management system

## ✅ What This IS
- ✅ A simulation engine
- ✅ Reveals operational failures
- ✅ Validates organizational logic
- ✅ Displays execution truth via timeline

## 🚀 Getting Started

1. Run database migration:
```bash
psql -f database/mms_schema.sql
```

2. Start development server:
```bash
npm run dev
```

3. Navigate to `/mms` to access the simulation interface.

## 🌐 Routes

- `/mms` - Scenario selection and execution
- `/mms/executions` - Execution history and timeline

## 🇫🇷 Language

Interface is **French only** as specified.
