import { readFileSync, readdirSync } from 'fs'
import { extname, join } from 'path'
import { describe, expect, it } from 'vitest'

describe('Placeholder Detection Tests - API', () => {
  const sourceDir = join(__dirname, '../')
  const filesToCheck: string[] = []

  // Recursively find all TypeScript files
  function findFiles(dir: string) {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = require('fs').statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findFiles(fullPath)
      } else if (stat.isFile() && extname(item) === '.ts') {
        filesToCheck.push(fullPath)
      }
    }
  }

  findFiles(sourceDir)

  it('should not contain TODO comments in production code', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')

      // Check for TODO comments (excluding test files)
      if (content.includes('TODO') && !content.includes('TODO: Add test')) {
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (line.includes('TODO') && !line.includes('TODO: Add test')) {
            violations.push(`${file}:${index + 1} - ${line.trim()}`)
          }
        })
      }
    }

    if (violations.length > 0) {
      console.error('\nFound TODO comments in production code:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should not contain @ts-ignore statements', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')

      // Check for @ts-ignore
      if (content.includes('@ts-ignore')) {
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (line.includes('@ts-ignore')) {
            violations.push(`${file}:${index + 1} - ${line.trim()}`)
          }
        })
      }
    }

    if (violations.length > 0) {
      console.error('\nFound @ts-ignore statements:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should not contain console.log statements in production code', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('vitest.config.'))
        continue

      const content = readFileSync(file, 'utf-8')

      // Check for console.log (allow console.error)
      if (content.includes('console.log')) {
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (line.includes('console.log')) {
            violations.push(`${file}:${index + 1} - ${line.trim()}`)
          }
        })
      }
    }

    if (violations.length > 0) {
      console.error('\nFound console.log statements:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should not contain empty config objects', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Check for empty config being passed
        if (line.includes('{}') && !line.includes('// ignore:')) {
          // Check if it's a config parameter
          if (line.includes('config') || line.includes('options') || line.includes('settings')) {
            violations.push(`${file}:${index + 1} - Empty config object: ${line.trim()}`)
          }
        }
      })
    }

    if (violations.length > 0) {
      console.error('\nFound empty config objects:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should have proper error handling in all async functions', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Check for async functions without try/catch
        if (line.includes('async') && line.includes('=>')) {
          const functionStart = index
          let hasTryCatch = false
          let braceCount = 0
          let inFunction = false

          // Look ahead for try/catch within the function
          for (let i = functionStart; i < lines.length; i++) {
            const currentLine = lines[i]

            if (currentLine.includes('{')) {
              braceCount += (currentLine.match(/{/g) || []).length
              inFunction = true
            }

            if (currentLine.includes('}')) {
              braceCount -= (currentLine.match(/}/g) || []).length
              if (braceCount <= 0 && inFunction) {
                break
              }
            }

            if (currentLine.includes('try') && currentLine.includes('{')) {
              hasTryCatch = true
            }
          }

          // If it's an async function that makes API calls or database queries, it should have error handling
          if (inFunction && !hasTryCatch) {
            const functionContent = lines.slice(functionStart, functionStart + 10).join('\n')
            if (
              functionContent.includes('await') &&
              (functionContent.includes('fetch') ||
                functionContent.includes('supabase') ||
                functionContent.includes('db.') ||
                functionContent.includes('.query'))
            ) {
              violations.push(
                `${file}:${index + 1} - Async function without error handling: ${line.trim()}`
              )
            }
          }
        }
      })
    }

    if (violations.length > 0) {
      console.error('\nFound async functions without error handling:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })
})
