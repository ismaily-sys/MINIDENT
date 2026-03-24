import { useState } from 'react'
import { LoadingButton } from './LoadingButton'
import {
  runAllMultiTenantTests,
  inspectClinicData,
  type MultiTenantTestResult,
} from '@/lib/multiTenantTest'

export const MultiTenantTestPanel = () => {
  const [results, setResults] = useState<MultiTenantTestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleRunTests = async () => {
    setLoading(true)
    try {
      const { results: testResults } = await runAllMultiTenantTests()
      setResults(testResults)
    } finally {
      setLoading(false)
    }
  }

  const handleInspect = async () => {
    await inspectClinicData()
  }

  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.filter(r => !r.passed).length

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 Multi-Tenant Access Test</h2>
        <p className="text-gray-600">Verify that clinic isolation and RLS policies are working correctly</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <LoadingButton
          onClick={handleRunTests}
          loading={loading}
          variant="primary"
          size="lg"
        >
          🧪 Run Tests
        </LoadingButton>

        <LoadingButton
          onClick={handleInspect}
          variant="secondary"
          size="lg"
        >
          🔍 Inspect Data
        </LoadingButton>

        {results.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Tests</p>
            <p className="text-2xl font-bold text-blue-600">{results.length}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedCount}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.passed
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{result.passed ? '✅' : '❌'}</span>
                  <h4 className="font-semibold text-gray-900">{result.testName}</h4>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-2">{result.message}</p>

              {result.error && (
                <p className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">
                  {result.error}
                </p>
              )}

              {showDetails && result.data && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results Yet */}
      {results.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Click "Run Tests" to verify multi-tenant access</p>
        </div>
      )}
    </div>
  )
}
