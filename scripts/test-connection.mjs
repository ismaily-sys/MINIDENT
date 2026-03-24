#!/usr/bin/env node

/**
 * Supabase Connection Test CLI
 * Run: npm run test:connection
 */

import { detailedSupabaseTest } from '../src/lib/testConnection'

async function main() {
  const success = await detailedSupabaseTest()
  process.exit(success ? 0 : 1)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
