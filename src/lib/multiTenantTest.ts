import { supabase } from './supabaseClient'

/**
 * Multi-tenant access tests
 * Verifies that users only see their own clinic data via RLS policies
 */

export interface MultiTenantTestResult {
  testName: string
  passed: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Test 1: Verify user can access their own clinic
 */
export const testOwnClinicAccess = async (): Promise<MultiTenantTestResult> => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return {
        testName: 'Own Clinic Access',
        passed: false,
        message: 'Not authenticated',
        error: 'User must be logged in',
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('clinic_id, role')
      .eq('id', session.session.user.id)
      .single()

    if (error) {
      return {
        testName: 'Own Clinic Access',
        passed: false,
        message: 'Failed to fetch profile',
        error: error.message,
      }
    }

    return {
      testName: 'Own Clinic Access',
      passed: true,
      message: `User assigned to clinic: ${data.clinic_id}`,
      data,
    }
  } catch (err) {
    return {
      testName: 'Own Clinic Access',
      passed: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test 2: Verify clinic isolation - can only see own clinic data
 */
export const testClinicIsolation = async (): Promise<MultiTenantTestResult> => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return {
        testName: 'Clinic Isolation',
        passed: false,
        message: 'Not authenticated',
      }
    }

    // Get user's clinic
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', session.session.user.id)
      .single()

    if (profileError || !profile) {
      return {
        testName: 'Clinic Isolation',
        passed: false,
        message: 'Could not determine user clinic',
        error: profileError?.message,
      }
    }

    // Try to access clinics table
    const { data: clinics, error: clinicsError, count } = await supabase
      .from('clinics')
      .select('*', { count: 'exact' })

    if (clinicsError) {
      return {
        testName: 'Clinic Isolation',
        passed: false,
        message: clinicsError.message,
        error: 'RLS might be blocking access (expected if not admin)',
      }
    }

    const clinicMatches = clinics?.every(c => c.id === profile.clinic_id)

    return {
      testName: 'Clinic Isolation',
      passed: clinicMatches !== false,
      message: `Retrieved ${count || clinics?.length || 0} clinic(s)`,
      data: { userClinicId: profile.clinic_id, count },
    }
  } catch (err) {
    return {
      testName: 'Clinic Isolation',
      passed: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test 3: Verify patients are filtered by clinic
 */
export const testPatientClinicFilter = async (): Promise<MultiTenantTestResult> => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return {
        testName: 'Patient Clinic Filter',
        passed: false,
        message: 'Not authenticated',
      }
    }

    // Get user's clinic
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', session.session.user.id)
      .single()

    if (profileError || !profile) {
      return {
        testName: 'Patient Clinic Filter',
        passed: false,
        message: 'Could not determine user clinic',
      }
    }

    // Get patients
    const { data: patients, error: patientsError, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .limit(1)

    if (patientsError) {
      return {
        testName: 'Patient Clinic Filter',
        passed: false,
        message: patientsError.message,
      }
    }

    // Verify all patients belong to user's clinic
    const allBelongToClinic = patients?.every(p => p.clinic_id === profile.clinic_id) ?? true

    return {
      testName: 'Patient Clinic Filter',
      passed: allBelongToClinic,
      message: `Retrieved ${count || patients?.length || 0} patient(s) from clinic`,
      data: { userClinicId: profile.clinic_id, patientCount: count },
    }
  } catch (err) {
    return {
      testName: 'Patient Clinic Filter',
      passed: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test 4: Verify appointments are filtered by clinic
 */
export const testAppointmentClinicFilter = async (): Promise<MultiTenantTestResult> => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return {
        testName: 'Appointment Clinic Filter',
        passed: false,
        message: 'Not authenticated',
      }
    }

    // Get user's clinic
    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', session.session.user.id)
      .single()

    if (!profile) {
      return {
        testName: 'Appointment Clinic Filter',
        passed: false,
        message: 'Could not determine user clinic',
      }
    }

    // Get appointments
    const { data: appointments, error, count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      return {
        testName: 'Appointment Clinic Filter',
        passed: false,
        message: error.message,
      }
    }

    const allBelongToClinic = appointments?.every(a => a.clinic_id === profile.clinic_id) ?? true

    return {
      testName: 'Appointment Clinic Filter',
      passed: allBelongToClinic,
      message: `Retrieved ${count || appointments?.length || 0} appointment(s) from clinic`,
      data: { userClinicId: profile.clinic_id, appointmentCount: count },
    }
  } catch (err) {
    return {
      testName: 'Appointment Clinic Filter',
      passed: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test 5: Verify invoices are filtered by clinic
 */
export const testInvoiceClinicFilter = async (): Promise<MultiTenantTestResult> => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      return {
        testName: 'Invoice Clinic Filter',
        passed: false,
        message: 'Not authenticated',
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', session.session.user.id)
      .single()

    if (!profile) {
      return {
        testName: 'Invoice Clinic Filter',
        passed: false,
        message: 'Could not determine user clinic',
      }
    }

    const { data: invoices, error, count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      return {
        testName: 'Invoice Clinic Filter',
        passed: false,
        message: error.message,
      }
    }

    const allBelongToClinic = invoices?.every(i => i.clinic_id === profile.clinic_id) ?? true

    return {
      testName: 'Invoice Clinic Filter',
      passed: allBelongToClinic,
      message: `Retrieved ${count || invoices?.length || 0} invoice(s) from clinic`,
      data: { userClinicId: profile.clinic_id, invoiceCount: count },
    }
  } catch (err) {
    return {
      testName: 'Invoice Clinic Filter',
      passed: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Run all multi-tenant tests
 */
export const runAllMultiTenantTests = async () => {
  console.log('\n═══════════════════════════════════════')
  console.log('  Multi-Tenant Access Tests')
  console.log('═══════════════════════════════════════\n')

  const tests = [
    testOwnClinicAccess,
    testClinicIsolation,
    testPatientClinicFilter,
    testAppointmentClinicFilter,
    testInvoiceClinicFilter,
  ]

  const results: MultiTenantTestResult[] = []
  let passedCount = 0
  let failedCount = 0

  for (const test of tests) {
    try {
      const result = await test()
      results.push(result)

      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.testName}`)
      console.log(`   ${result.message}`)

      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }

      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data)}`)
      }

      if (result.passed) {
        passedCount++
      } else {
        failedCount++
      }

      console.log()
    } catch (err) {
      console.error(`❌ ${test.name} - Unexpected error`)
      console.error(`   ${err}\n`)
      failedCount++
    }
  }

  console.log('═══════════════════════════════════════')
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`)
  console.log('═══════════════════════════════════════\n')

  return {
    passed: failedCount === 0,
    results,
    summary: { passed: passedCount, failed: failedCount },
  }
}

/**
 * Detailed clinic data inspection
 */
export const inspectClinicData = async () => {
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session?.user) {
      console.log('❌ Not authenticated')
      return
    }

    console.log('\n📊 Clinic Data Inspection')
    console.log('═══════════════════════════════════════\n')

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.session.user.id)
      .single()

    console.log('👤 User Profile:')
    console.log(`   ID: ${profile?.id}`)
    console.log(`   Clinic ID: ${profile?.clinic_id}`)
    console.log(`   Role: ${profile?.role}`)
    console.log()

    // Get clinic data
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', profile?.clinic_id)
      .single()

    console.log('🏥 Clinic:')
    console.log(`   Name: ${clinic?.name}`)
    console.log(`   ID: ${clinic?.id}`)
    console.log()

    // Count entities
    const [patientsCount, appointmentsCount, invoicesCount] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
    ])

    console.log('📈 Data Summary:')
    console.log(`   Patients: ${patientsCount.count || 0}`)
    console.log(`   Appointments: ${appointmentsCount.count || 0}`)
    console.log(`   Invoices: ${invoicesCount.count || 0}`)
    console.log()
  } catch (err) {
    console.error('Error inspecting clinic data:', err)
  }
}
