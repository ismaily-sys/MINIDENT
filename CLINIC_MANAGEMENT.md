# 🏥 Clinic Management System

Complete SaaS clinic management system with multi-tenant support, team management, and subscription features.

## 📋 Features

- ✅ **Clinic Management** - Create, update, and manage clinic details
- ✅ **Team Management** - Invite and manage team members with roles
- ✅ **Multi-Tenant** - Complete data isolation by clinic
- ✅ **Subscription Tracking** - Support for different subscription tiers
- ✅ **Activity Logging** - Audit trail for all clinic activities
- ✅ **Setup Wizard** - Guided clinic creation for new users

## 🗂️ File Structure

```
src/
├── services/
│   └── clinics.service.ts          # Clinic CRUD operations
├── hooks/
│   └── useClinic.ts                # Clinic state management hook
├── pages/
│   ├── Settings/
│   │   └── ClinicSettings.tsx       # Clinic settings page
│   └── Auth/
│       └── ClinicSetupWizard.tsx    # Clinic onboarding wizard
└── database/
    └── clinic_schema.sql            # Database schema + RLS
```

## 🚀 Quick Start

### 1. Setup Database

Apply the schema in your Supabase SQL editor:

```bash
# In Supabase Dashboard → SQL Editor → paste clinic_schema.sql
```

This creates:
- ✅ Clinics table
- ✅ Profiles table (user-clinic linking)
- ✅ All RLS policies
- ✅ Activity log table
- ✅ Indexes for performance

### 2. Use Clinic Service

```typescript
import { clinicsService } from '@/services/clinics.service'

// Get current user's clinic
const clinic = await clinicsService.getCurrentClinic()

// Update clinic details
await clinicsService.updateClinic(clinicId, {
  name: "Updated Clinic Name",
  phone: "+1-555-0000"
})

// Get clinic statistics
const stats = await clinicsService.getClinicStats(clinicId)
console.log(stats.patients, stats.appointments, stats.revenue)

// Add team member
await clinicsService.addTeamMember(clinicId, 'user@example.com', 'assistant')

// Get team members
const team = await clinicsService.getTeamMembers(clinicId)
```

### 3. Use Clinic Hook

```typescript
import { useClinic } from '@/hooks/useClinic'

export function MyComponent() {
  const { clinic, stats, team, createClinic, updateClinic, addTeamMember } = useClinic()

  return (
    <div>
      <h1>{clinic?.name}</h1>
      <p>Patients: {stats?.patients}</p>
      <button onClick={() => addTeamMember(clinic?.id, 'new@example.com', 'assistant')}>
        Add Member
      </button>
    </div>
  )
}
```

### 4. Add Pages to App

```typescript
// In App.tsx
import { ClinicSettings } from '@/pages/Settings/ClinicSettings'
import { ClinicSetupWizard } from '@/pages/Auth/ClinicSetupWizard'

<Routes>
  {/* After login */}
  <Route path="/settings/clinic" element={<ClinicSettings />} />
  
  {/* During signup */}
  <Route path="/clinic/setup" element={<ClinicSetupWizard />} />
</Routes>
```

## 📊 Database Schema

### Clinics Table

```javascript
{
  id: UUID,                          // Primary key
  name: string,                      // Clinic name
  description: string,               // Optional description
  phone: string,                     // Contact phone
  email: string,                     // Contact email
  address: string,                   // Street address
  city: string,                      // City
  postal_code: string,               // Postal code
  country: string,                   // Country
  website: string,                   // Website URL
  owner_id: UUID,                    // Owner's user ID
  subscription_plan: enum,           // free|starter|pro|enterprise
  subscription_status: enum,         // active|cancelled|expired
  max_users: number,                 // User limit
  max_patients: number,              // Patient limit
  created_at: timestamp,
  updated_at: timestamp
}
```

### Profiles Table (links users to clinics)

```javascript
{
  id: UUID,                          // References auth.users
  clinic_id: UUID,                   // References clinics
  full_name: string,
  email: string,
  role: enum,                        // admin|assistant
  avatar_url: string,
  created_at: timestamp
}
```

## 🎯 Clinic Setup Wizard

Three-step wizard for new clinic owners:

**Step 1: Basic Information**
- Clinic name (required)
- Email
- Phone

**Step 2: Location**
- Address
- City
- Postal code
- Country

**Step 3: Review & Create**
- Confirm all details
- Agree to terms
- Create clinic

## ⚙️ Clinic Settings Page

### General Tab
- Edit clinic name, contact info, location
- Update website, address details
- Save changes with validation

### Team Tab
- View all team members
- See member roles and join dates
- Invite new team members
- Remove team members (admin only)

### Subscription Tab
- View current plan
- See subscription status
- View plan limits (users, patients)
- Upgrade plan button

## 👥 Team Management

### Add Team Member
```typescript
await clinicsService.addTeamMember(clinicId, 'email@example.com', 'admin')
```

Roles:
- **Admin**: Full access to clinic settings, can delete data
- **Assistant**: Can add/edit patients and appointments (no delete)

### Remove Team Member
```typescript
await clinicsService.removeTeamMember(clinicId, userId)
```

## 📊 Clinic Statistics

Get insight into clinic activity:

```typescript
const stats = await clinicsService.getClinicStats(clinicId)

// Returns:
{
  patients: 45,           // Total patients
  appointments: 120,      // Total appointments
  users: 3,              // Team members
  revenue: 5250.00       // Total invoice revenue
}
```

## 🔐 Security & Multi-Tenancy

### Row Level Security (RLS)

All data is automatically filtered by clinic using `get_my_clinic_id()`:

- ✅ Users can only see their clinic data
- ✅ No cross-clinic data leakage
- ✅ RLS enforced at database level
- ✅ Admin functions require admin role

### Tested with
```bash
npm run test:multitenant
```

## 📋 Activity Logging

Track clinic activities for audit:

```typescript
await clinicsService.logActivity(clinicId, 'patient_created', {
  patient_id: 'xxx',
  patient_name: 'John Doe'
})

// Later query activity log
const log = await clinicsService.getActivityLog(clinicId)
```

## 💾 Subscription Plans

| Plan | Users | Patients | Features |
|------|-------|----------|----------|
| Free | 2 | 25 | Basic features |
| Starter | 5 | 100 | + Analytics |
| Pro | 10 | 500 | + Invoices |
| Enterprise | Unlimited | Unlimited | + API Access |

## 🔄 API Integration Flow

```
User Login
    ↓
Check Profile → clinic_id
    ↓
RLS Filters All Queries by clinic_id
    ↓
User sees only their clinic data
```

## 🧪 Testing

### Multi-Tenant Test
```bash
npm run test:multitenant
```

Verifies clinic isolation is working correctly.

### Manual Test

1. Create Clinic A with User 1
2. Create Clinic B with User 2
3. Login as User 1 → should see Clinic A data only
4. Login as User 2 → should see Clinic B data only
5. User 1 can't see User 2's data ✅

## 📚 Database Migrations

### Create Schema
```bash
# In Supabase SQL Editor
psql -f database/clinic_schema.sql
```

### Reset Schema
```sql
-- Delete all tables
DROP TABLE IF EXISTS clinic_activity_log CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS dental_codes CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;
```

## 🚨 Important Notes

⚠️ **Before Production:**
- Verify all RLS policies are enabled
- Test multi-tenant isolation
- Configure subscription webhooks
- Set up activity log monitoring
- Enable database backups

## 🆘 Troubleshooting

### "Could not determine user clinic"
- Check user profile exists in `profiles` table
- Ensure `clinic_id` is not NULL
- Verify auth session is active

### "Permission denied" on operations
- Check RLS policies are enabled
- Verify user role allows operation
- Check clinic_id matches

### Data from other clinics visible
- 🚨 **CRITICAL**: RLS policy not working
- Check `get_my_clinic_id()` function
- Verify WHERE clauses use clinic_id

## 📖 Related Documentation

- [Multi-Tenant Testing](../MULTITENANT_TESTING.md)
- [Supabase Setup](../SUPABASE_SETUP.md)
- [Database Schema](./clinic_schema.sql)

## 🎓 Learning Resources

- [Supabase Multi-Tenant Guide](https://supabase.com/docs/guides/realtime-saas)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SaaS Best Practices](https://supabase.com/docs/guides/auth/architecture)
