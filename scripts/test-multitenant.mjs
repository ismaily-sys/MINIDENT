#!/usr/bin/env node

/**
 * Multi-Tenant Access Test CLI
 * Run: npm run test:multitenant
 */

import { runAllMultiTenantTests, inspectClinicData } from '../src/lib/multiTenantTest'

async function main() {
  try {
    const results = await runAllMultiTenantTests()
    
    // Optional: Show detailed data inspection
    if (process.argv.includes('--inspect')) {
      await inspectClinicData()
    }

    process.exit(results.passed ? 0 : 1)
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

main()
