# Plugin Tests

This directory contains comprehensive tests for all plugin adapters in the CleanConnect plugin system.

## Test Coverage

### Manual Adapter Tests (`manual.test.ts`)
- ✅ Plugin identity verification
- ✅ Database fetching operations
- ✅ Data transformation logic
- ✅ Configuration validation
- ✅ Error handling scenarios
- ✅ Standardized response format

### Google Calendar Adapter Tests (`google-calendar.test.ts`)
- ✅ Plugin identity verification
- ✅ Google Calendar API integration
- ✅ Event fetching with date ranges
- ✅ Event transformation (all-day and timed events)
- ✅ Access token validation
- ✅ API error handling
- ✅ URL encoding for calendar IDs

### Airtable Adapter Tests (`airtable.test.ts`)
- ✅ Plugin identity verification
- ✅ Airtable API integration
- ✅ Schedule and task record fetching
- ✅ Custom table and field names
- ✅ Filter formula construction
- ✅ Priority and status mapping
- ✅ Configuration validation

### Notion Adapter Tests (`notion.test.ts`)
- ✅ Plugin identity verification
- ✅ Notion API integration
- ✅ Database query filtering
- ✅ Property extraction and transformation
- ✅ Priority and status mapping
- ✅ Custom property names
- ✅ Configuration validation

## Test Structure

Each test file follows a consistent structure:

```typescript
describe('PluginAdapter', () => {
  describe('Plugin Identity', () => {
    // Test plugin metadata
  })

  describe('fetchExternalSchedule', () => {
    // Test external API calls
  })

  describe('fetchExternalTasks', () => {
    // Test external API calls
  })

  describe('transformScheduleItem', () => {
    // Test data transformation logic
  })

  describe('transformTaskItem', () => {
    // Test data transformation logic
  })

  describe('validateConfig', () => {
    // Test configuration validation
  })

  describe('getSchedule', () => {
    // Test standardized response format
  })

  describe('getTasks', () => {
    // Test standardized response format
  })
})
```

## Running Tests

```bash
# Run all plugin tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific plugin tests
npm test manual.test.ts
npm test google-calendar.test.ts
npm test airtable.test.ts
npm test notion.test.ts
```

## Mocking Strategy

Tests use comprehensive mocking to avoid external dependencies:

- **Global fetch**: Mocked for all HTTP requests
- **Supabase**: Mocked for Manual adapter database operations
- **External APIs**: Mocked responses for Google Calendar, Airtable, and Notion

## Test Scenarios Covered

### Happy Path
- Successful data fetching
- Proper data transformation
- Valid configuration acceptance

### Error Handling
- Network failures
- API authentication errors
- Invalid configuration
- Missing required fields
- Malformed responses

### Edge Cases
- Empty data responses
- Missing optional fields
- Invalid data formats
- Special characters in IDs
- Different priority/status values

## Data Transformation Testing

Each adapter's transformation logic is thoroughly tested:

1. **Standard Items**: Complete valid records
2. **Minimal Items**: Records with only required fields
3. **Invalid Items**: Records missing required data
4. **Edge Cases**: Special characters, null values, undefined fields

## Configuration Testing

Configuration validation tests cover:

1. **Valid Configurations**: All required fields present
2. **Missing Fields**: Each required field individually missing
3. **Invalid Credentials**: Failed API connections
4. **Network Errors**: Connection timeouts and failures

## Benefits

These tests ensure:

- **Reliability**: Plugins handle all scenarios gracefully
- **Maintainability**: Easy to identify and fix issues
- **Confidence**: Safe refactoring and updates
- **Documentation**: Tests serve as usage examples
- **Regression Prevention**: Catch breaking changes early
