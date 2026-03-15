/**
 * Verify API endpoint latency meets NFR-001 requirement (500ms p95 latency)
 * Run with: pnpm tsx scripts/verify-latency.ts
 */

import axios from 'axios'

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'
const TEST_TOKEN = 'test-jwt-token' // Replace with valid JWT for testing

interface LatencyResult {
  endpoint: string
  method: string
  latencies: number[]
  p50: number
  p95: number
  p99: number
  avg: number
  min: number
  max: number
  passed: boolean
}

async function measureLatency(
  method: string,
  endpoint: string,
  iterations: number = 100
): Promise<number[]> {
  const latencies: number[] = []
  const url = `${API_URL}${endpoint}`

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    try {
      await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        validateStatus: () => true, // Accept any status code
      })
    } catch (error) {
      // Ignore errors, we're measuring latency not correctness
    }
    const end = performance.now()
    latencies.push(end - start)
  }

  return latencies
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index]
}

function analyzeLatencies(endpoint: string, method: string, latencies: number[]): LatencyResult {
  const sorted = [...latencies].sort((a, b) => a - b)
  const p50 = calculatePercentile(latencies, 50)
  const p95 = calculatePercentile(latencies, 95)
  const p99 = calculatePercentile(latencies, 99)
  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const passed = p95 <= 500 // NFR-001 requirement

  return {
    endpoint,
    method,
    latencies,
    p50,
    p95,
    p99,
    avg,
    min,
    max,
    passed,
  }
}

async function main() {
  console.log('🔍 Verifying API endpoint latency (NFR-001: p95 < 500ms)\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Iterations per endpoint: 100\n`)

  const endpoints = [
    { method: 'GET', path: '/api/v1/workers' },
    { method: 'POST', path: '/api/v1/workers' },
    { method: 'GET', path: '/api/v1/workers/00000000-0000-0000-0000-000000000001' },
    { method: 'PUT', path: '/api/v1/workers/00000000-0000-0000-0000-000000000001' },
    { method: 'DELETE', path: '/api/v1/workers/00000000-0000-0000-0000-000000000001' },
  ]

  const results: LatencyResult[] = []

  for (const { method, path } of endpoints) {
    console.log(`Testing ${method} ${path}...`)
    const latencies = await measureLatency(method, path)
    const result = analyzeLatencies(path, method, latencies)
    results.push(result)
  }

  console.log('\n📊 Latency Results:\n')
  console.log(
    '┌─────────┬──────────────────────────────────────────┬─────────┬─────────┬─────────┬─────────┬────────┐'
  )
  console.log(
    '│ Method  │ Endpoint                                 │ p50 (ms)│ p95 (ms)│ p99 (ms)│ Avg (ms)│ Status │'
  )
  console.log(
    '├─────────┼──────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼────────┤'
  )

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    const endpoint = result.endpoint.padEnd(40).substring(0, 40)
    const method = result.method.padEnd(7)
    console.log(
      `│ ${method} │ ${endpoint} │ ${result.p50.toFixed(1).padStart(7)} │ ${result.p95.toFixed(1).padStart(7)} │ ${result.p99.toFixed(1).padStart(7)} │ ${result.avg.toFixed(1).padStart(7)} │ ${status}  │`
    )
  }

  console.log(
    '└─────────┴──────────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┴────────┘'
  )

  const allPassed = results.every((r) => r.passed)
  console.log(
    `\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'All endpoints meet p95 < 500ms requirement' : 'Some endpoints exceed p95 500ms threshold'}`
  )

  if (!allPassed) {
    console.log('\n⚠️  Failed endpoints:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   ${r.method} ${r.endpoint}: p95 = ${r.p95.toFixed(1)}ms (exceeds 500ms)`)
      })
  }

  process.exit(allPassed ? 0 : 1)
}

main().catch((error) => {
  console.error('Error running latency verification:', error)
  process.exit(1)
})
