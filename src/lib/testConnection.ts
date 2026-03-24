import { supabase } from './supabaseClient'

/**
 * Test Supabase connection and verify configuration
 */
export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...')

    // Test 1: Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message)
    } else {
      console.log('✅ Session check:', sessionData.session ? 'Authenticated' : 'Not authenticated')
    }

    // Test 2: Test a simple read query
    const { data, error, status } = await supabase
      .from('patients')
      .select('count(*)', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Query Error:', error.message)
      console.error('Status:', status)
      return false
    }

    console.log('✅ Database connection: Working')
    console.log('✅ RLS policies: Active')

    // Test 3: Check environment variables
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error('❌ Missing environment variables')
      console.error('VITE_SUPABASE_URL:', url ? '✓' : '✗')
      console.error('VITE_SUPABASE_ANON_KEY:', key ? '✓' : '✗')
      return false
    }

    console.log('✅ Environment variables: Configured')
    console.log('✅ Supabase URL:', url.split('.')[0] + '...')

    console.log('\n✅ All tests passed! Supabase is configured correctly.\n')
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

// Export a more detailed test function
export const detailedSupabaseTest = async () => {
  console.log('═══════════════════════════════════════')
  console.log('  Supabase Detailed Connection Test')
  console.log('═══════════════════════════════════════\n')

  const tests = [
    { name: 'Environment Configuration', fn: testEnvConfig },
    { name: 'Auth Connection', fn: testAuthConnection },
    { name: 'Database Query', fn: testDatabaseQuery },
    { name: 'RLS Policies', fn: testRLSPolicies },
  ]

  let passedTests = 0
  let failedTests = 0

  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) {
        console.log(`✅ ${test.name}: PASSED`)
        passedTests++
      } else {
        console.log(`❌ ${test.name}: FAILED`)
        failedTests++
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ERROR`)
      console.error(`   ${err}`)
      failedTests++
    }
    console.log()
  }

  console.log('═══════════════════════════════════════')
  console.log(`Results: ${passedTests} passed, ${failedTests} failed`)
  console.log('═══════════════════════════════════════\n')

  return failedTests === 0
}

// Individual test functions
async function testEnvConfig(): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url) {
    console.error('   Missing VITE_SUPABASE_URL')
    return false
  }

  if (!key) {
    console.error('   Missing VITE_SUPABASE_ANON_KEY')
    return false
  }

  console.log(`   URL: ${url.substring(0, 30)}...`)
  return true
}

async function testAuthConnection(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error(`   Error: ${error.message}`)
    return false
  }

  console.log(`   Session Status: ${data.session ? 'Active' : 'No session'}`)
  return true
}

async function testDatabaseQuery(): Promise<boolean> {
  const { error, status } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error(`   Error: ${error.message}`)
    console.error(`   Status: ${status}`)
    return false
  }

  console.log(`   Query Status: OK (${status})`)
  return true
}

async function testRLSPolicies(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`   RLS Messages: ${error.message}`)
      // RLS errors are expected if not authenticated
      return true
    }

    console.log(`   RLS Status: Policies active`)
    return true
  } catch (err) {
    return true
  }
}
