# Supabase Connection Testing Guide

## 📋 Prerequisites

Ensure you have:
1. ✅ Node.js installed
2. ✅ `.env.local` file with Supabase credentials
3. ✅ `npm install` completed

## 🔧 Setup

### Step 1: Create `.env.local`

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Your `.env.local` should look like:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these values from:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - Anon public key (VITE_SUPABASE_ANON_KEY)

### Step 2: Test the Connection

Run the connection test:

```bash
npm run test:connection
```

### Expected Output (✅ Success)

```
═══════════════════════════════════════
  Supabase Detailed Connection Test
═══════════════════════════════════════

✅ Environment Configuration: PASSED
   URL: https://hfzewcibtfffsljoiexx...

✅ Auth Connection: PASSED
   Session Status: No session

✅ Database Query: PASSED
   Query Status: OK (200)

✅ RLS Policies: PASSED
   RLS Status: Policies active

═══════════════════════════════════════
Results: 4 passed, 0 failed
═══════════════════════════════════════
```

## 🐛 Troubleshooting

### ❌ "Missing environment variables"

**Solution:** Make sure `.env.local` exists with correct values:

```bash
# Check if .env.local exists
ls -la .env.local

# If not, create it
cp .env.example .env.local
```

### ❌ "Authentication required" Error

**This is NORMAL** - You're not logged in. The test checks if RLS is working.

### ❌ "Connection refused" or "Network error"

**Solution:** Check your Supabase URL:

```bash
# Should be in format: https://xxxxx.supabase.co
echo $VITE_SUPABASE_URL
```

### ❌ "Invalid API key"

**Solution:** Verify your anon key from Supabase dashboard:

```bash
# Make sure the key starts with eyJ...
echo $VITE_SUPABASE_ANON_KEY | head -c 20
```

## ✅ In Your Code

Use the test functions in your code:

```typescript
import { testSupabaseConnection, detailedSupabaseTest } from '@/lib/testConnection'

// Quick test
await testSupabaseConnection()

// Detailed test with all checks
await detailedSupabaseTest()
```

## 📊 Available Tests

| Test | Purpose |
|------|---------|
| Environment Configuration | Verify env variables are set |
| Auth Connection | Check Supabase auth service |
| Database Query | Test database connectivity |
| RLS Policies | Verify row-level security |

## 🚀 Next Steps

Once tests pass:

1. Run dev server: `npm run dev`
2. Login with Supabase auth
3. Start using the app!

## 💡 Tips

- Always run `npm run test:connection` after changing `.env.local`
- Use `.env.local` for local development (never commit this file)
- Use `.env.example` as template for CI/CD environments
- Keep your anon key secret but shareable; never expose service role key publicly

For more help, check [Supabase Documentation](https://supabase.com/docs)
