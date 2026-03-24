# Multi-Tenant Access Testing Guide

## 🎯 Overview

Multi-tenant access testing verifies that:
1. ✅ Users can only access their own clinic data
2. ✅ RLS policies are correctly enforcing clinic isolation
3. ✅ No data leakage between clinics
4. ✅ Authentication is properly linked to clinic

## 🧪 Available Tests

### Test 1: Own Clinic Access
**Purpose:** Verify user is assigned to a clinic
- ✅ Gets user's profile
- ✅ Confirms clinic_id is assigned
- ✅ Checks user role (admin/assistant)

### Test 2: Clinic Isolation
**Purpose:** Verify clinic-level data isolation
- ✅ Confirms RLS policies filter clinics table
- ✅ Ensures user only sees own clinic data

### Test 3: Patient Clinic Filter
**Purpose:** Verify RLS filters patient data by clinic
- ✅ All patients belong to user's clinic
- ✅ No cross-clinic patient access
- ✅ Counts match expected clinic data

### Test 4: Appointment Clinic Filter
**Purpose:** Verify RLS filters appointment data by clinic
- ✅ All appointments belong to user's clinic
- ✅ No cross-clinic appointment access

### Test 5: Invoice Clinic Filter
**Purpose:** Verify RLS filters invoice data by clinic
- ✅ All invoices belong to user's clinic
- ✅ No cross-clinic invoice access

## 🚀 Running Tests

### Via CLI (Recommended)

**Quick test:**
```bash
npm run test:multitenant
```

**With data inspection:**
```bash
npm run test:multitenant:inspect
```

**Expected Output:**
```
═══════════════════════════════════════
  Multi-Tenant Access Tests
═══════════════════════════════════════

✅ Own Clinic Access
   User assigned to clinic: abc123...

✅ Clinic Isolation
   Retrieved 1 clinic(s) from clinic

✅ Patient Clinic Filter
   Retrieved 5 patient(s) from clinic

✅ Appointment Clinic Filter
   Retrieved 12 appointment(s) from clinic

✅ Invoice Clinic Filter
   Retrieved 8 invoice(s) from clinic

═══════════════════════════════════════
Results: 5 passed, 0 failed
═══════════════════════════════════════
```

### Programmatic Usage

```typescript
import { runAllMultiTenantTests, inspectClinicData } from '@/lib/multiTenantTest'

// Run all tests
const results = await runAllMultiTenantTests()
console.log(results.passed) // true or false

// Inspect specific clinic data
await inspectClinicData()
```

## 🎨 UI Component

Add to your admin dashboard:

```tsx
import { MultiTenantTestPanel } from '@/components/MultiTenantTestPanel'

export function AdminPage() {
  return (
    <div>
      <MultiTenantTestPanel />
    </div>
  )
}
```

Features:
- 🧪 One-click testing
- 📊 Visual results with pass/fail
- 🔍 Data inspection button
- 📝 Detailed test information
- 🎯 Color-coded results

## 🔍 What to Look For

### ✅ Successful Test Output

```
✅ Own Clinic Access
   User assigned to clinic: hfze...clinic...clinic

✅ Clinic Isolation
   Retrieved 1 clinic(s) from clinic
   Data: {"userClinicId":"hfze...","count":1}
```

**This means:**
- ✅ User is authenticated
- ✅ User is linked to exactly 1 clinic
- ✅ RLS is filtering correctly

### ❌ Failed Test Output

```
❌ Patient Clinic Filter
   Error: Could not determine user clinic
```

**Possible causes:**
- User not authenticated
- Profile not created for user
- clinic_id is NULL in profiles table

## 🛠️ Troubleshooting

### Problem: "Not authenticated"
**Solution:** Log in first
```bash
# In your app, use the login page or:
npm run dev  # Start dev server and login
```

### Problem: "Could not determine user clinic"
**Solution:** Ensure user profile exists in database
```sql
-- Check profiles table
SELECT id, clinic_id, role FROM profiles WHERE id = 'user-id';

-- If missing, insert profile
INSERT INTO profiles (id, clinic_id, role)
VALUES ('user-id', 'clinic-id', 'admin');
```

### Problem: "RLS blocking access"
**Solution:** Check RLS policies on tables
```bash
# In Supabase dashboard:
# 1. Go to Authentication > RLS
# 2. Check each table has proper policies
# 3. Verify clinic_id column exists
```

### Problem: Data from other clinics visible
**CRITICAL SECURITY ISSUE** - Contact support
- ❌ RLS policy is misconfigured
- ❌ Data may be leaking to wrong clinic
- ❌ Do not use in production until fixed

## 📋 RLS Policies Checklist

Verify these policies exist in Supabase:

- [ ] `patients` - SELECT by clinic_id
- [ ] `patients` - UPDATE by clinic_id
- [ ] `patients` - DELETE by admin only + clinic_id
- [ ] `appointments` - SELECT by clinic_id
- [ ] `appointments` - DELETE by admin only + clinic_id
- [ ] `invoices` - SELECT by clinic_id
- [ ] `treatments` - SELECT by clinic_id
- [ ] `treatments` - DELETE by admin only
- [ ] `dental_codes` - Admin only
- [ ] `clinics` - Own clinic only

## 🔐 Manual Security Test

### Scenario: Verify clinic 1 can't access clinic 2 data

1. **Create two test users:**
   - User A in Clinic 1
   - User B in Clinic 2

2. **Add test patient to Clinic 1:**
   ```sql
   INSERT INTO patients (clinic_id, name, email, phone)
   VALUES ('clinic-1-id', 'Test Patient', 'test@clinic1.com', '555-0001');
   ```

3. **Verify isolation:**
   - Log in as User A → Should see Test Patient ✅
   - Log in as User B → Should NOT see Test Patient ✅

4. **If User B CAN see Test Patient:**
   - 🚨 **SECURITY BREACH** - Fix RLS immediately
   - Check clinic_id filter in RLS policy
   - Ensure WHERE clause uses clinic_id

## 📊 Performance Notes

Tests run quickly:
- ⚡ < 100ms average per test
- 📈 Minimal database load
- 🔄 Safe to run multiple times

## 🎓 Learning Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenant SaaS Best Practices](https://supabase.com/docs/guides/realtime-saas)
- [Database Security](https://supabase.com/docs/guides/auth/authorizing-requests)

## ❓ FAQ

**Q: How often should I run tests?**
A: Run before deploying, after RLS changes, or when adding new tables

**Q: What if tests fail?**
A: Check RLS policies, ensure clinic_id exists in all tables, verify user profile exists

**Q: Can I run tests in production?**
A: Yes, they only read data and are safe, but use sparingly to avoid log bloat

**Q: How do I add a new table to multi-tenant testing?**
A: Add new test function in `multiTenantTest.ts`, follow existing pattern

## 🚀 Next Steps

1. ✅ Run: `npm run test:multitenant`
2. ✅ Verify all tests pass
3. ✅ Add MultiTenantTestPanel to admin dashboard
4. ✅ Schedule regular security tests
5. ✅ Monitor for any RLS violations
