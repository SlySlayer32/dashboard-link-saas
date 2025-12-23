import { readFileSync, readdirSync } from 'fs'
import { extname, join } from 'path'
import { describe, expect, it } from 'vitest'

describe('Placeholder Detection Tests', () => {
  const sourceDir = join(__dirname, '../')
  const filesToCheck: string[] = []

  // Recursively find all TypeScript/JavaScript files
  function findFiles(dir: string) {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = require('fs').statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findFiles(fullPath)
      } else if (stat.isFile() && (extname(item) === '.ts' || extname(item) === '.tsx')) {
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

  it('should not contain @ts-expect-error statements', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')

      // Check for @ts-expect-error
      if (content.includes('@ts-expect-error')) {
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (line.includes('@ts-expect-error')) {
            violations.push(`${file}:${index + 1} - ${line.trim()}`)
          }
        })
      }
    }

    if (violations.length > 0) {
      console.error('\nFound @ts-expect-error statements:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should not contain console.log statements in production code', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('vite.config.'))
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

  it('should not contain mock or placeholder data in production code', () => {
    const violations: string[] = []
    const mockPatterns = [
      /mockData/i,
      /dummyData/i,
      /placeholderData/i,
      /fakeData/i,
      /lorem ipsum/i,
      /xxx-xxx-xxx/i,
      /test-@/i,
    ]

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('test/')) continue

      const content = readFileSync(file, 'utf-8')

      mockPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          const lines = content.split('\n')
          lines.forEach((line, index) => {
            if (pattern.test(line) && !line.includes('// ignore:')) {
              violations.push(`${file}:${index + 1} - ${line.trim()}`)
            }
          })
        }
      })
    }

    if (violations.length > 0) {
      console.error('\nFound mock/placeholder data:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })

  it('should not have empty functions without implementation', () => {
    const violations: string[] = []

    for (const file of filesToCheck) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Check for empty function bodies
        if (line.includes('()') && line.includes('{') && !line.includes('// TODO')) {
          const nextLine = lines[index + 1]
          if (
            nextLine &&
            nextLine.trim() === '}' &&
            !line.includes('throw') &&
            !line.includes('return')
          ) {
            violations.push(
              `${file}:${index + 1} - Empty function without implementation: ${line.trim()}`
            )
          }
        }
      })
    }

    if (violations.length > 0) {
      console.error('\nFound empty functions:')
      violations.forEach((v) => console.error(`  - ${v}`))
    }

    expect(violations).toHaveLength(0)
  })
})
