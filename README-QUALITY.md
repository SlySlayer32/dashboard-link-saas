# Code Quality Analysis Tools

This project includes two code quality analysis tools:

## jscpd - Copy/Paste Detector
jscpd is a tool for detecting duplicate code and copy/paste patterns in JavaScript/TypeScript code.

### Usage
```bash
# Basic detection
pnpm run copy:paste:detect

# Generate detailed reports (JSON, HTML, console)
pnpm run copy:paste:report
```

### Configuration
Configuration is stored in `.jscpd.json`:
- Scans `apps` and `packages` directories
- Ignores `node_modules`, `dist`, `build`, and test files
- Minimum duplication threshold: 5 tokens
- Reports generated in `reports/` directory

## PMD - Code Quality Analysis
PMD is a Java-based static code analysis tool that includes a copy/paste detector (CPD).

### Usage
```bash
# Run PMD copy/paste detection
pnpm run pmd:run

# Run both tools
pnpm run quality:check
```

### Configuration
- Analyzes all source directories in `apps` and `packages`
- Uses ECMAScript language parser
- Minimum duplication threshold: 100 tokens
- Excludes `node_modules`, `dist`, `build` directories
- XML report generated at `reports/pmd-report.xml`
- Uses 4GB Java heap space for analysis

## Reports
- **jscpd**: Reports saved to `reports/` directory (JSON, HTML formats)
- **PMD**: XML report saved to `reports/pmd-report.xml`

## Integration
Both tools are integrated into the project's npm scripts and can be run individually or together via `quality:check`.

## Notes
- PMD requires Java 17+ (already installed)
- jscpd runs on Node.js and is faster for JavaScript/TypeScript projects
- PMD's CPD is more comprehensive but slower and requires more memory
