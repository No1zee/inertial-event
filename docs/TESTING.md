# NovaStream Testing Guide

This document provides comprehensive information about the testing infrastructure set up for the NovaStream project.

## Overview

The NovaStream project includes a multi-layered testing approach:

- **Unit Tests**: Test individual functions, components, and services in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test complete user workflows in a real browser environment

## Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── components/         # React component tests
│   ├── services/           # Service layer tests
│   ├── hooks/              # Custom hook tests
│   └── store/              # State management tests
├── integration/            # API integration tests
├── e2e/                    # End-to-end tests
├── utils/                  # Test utilities and helpers
└── setup/                  # Test setup and configuration
```

## Testing Frameworks

### Frontend Tests
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom DOM matchers

### Backend Tests
- **Jest**: Node.js testing framework
- **Supertest**: HTTP assertion testing
- **MongoDB Memory Server**: In-memory MongoDB for testing

### E2E Tests
- **Playwright**: Browser automation framework
- **Playwright Test**: Test runner and assertions

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode (Unit Tests)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### E2E Tests with Browser UI
```bash
npm run test:e2e:headed
```

## Configuration Files

- `jest.config.js`: Main Jest configuration for frontend tests
- `jest.backend.config.js`: Jest configuration for backend tests
- `playwright.config.ts`: Playwright E2E test configuration
- `.env.test`: Test environment variables

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'
import { renderWithProviders } from '../utils/testUtils'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### Integration Test Example

```typescript
import request from 'supertest'
import { setupTestDatabase, teardownTestDatabase } from '../utils/apiTestUtils'

describe('API Endpoint', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it('returns correct response', async () => {
    const response = await request(app)
      .get('/api/content')
      .expect(200)
    
    expect(response.body).toHaveProperty('data')
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user can search for content', async ({ page }) => {
  await page.goto('/')
  
  await page.click('[data-testid="search-button"]')
  await page.fill('[data-testid="search-input"]', 'test movie')
  
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
})
```

## Test Utilities

### `renderWithProviders`
Wraps components with necessary providers (React Query, Theme Provider, etc.)

```typescript
import { renderWithProviders } from '../utils/testUtils'

renderWithProviders(<MyComponent />)
```

### `createMockContent`
Creates mock content data for testing

```typescript
const mockContent = createMockContent({
  title: 'Custom Title',
  type: 'series'
})
```

### API Test Helpers
Utilities for setting up test database and authentication

```typescript
import { 
  setupTestDatabase, 
  createTestUser, 
  generateTestToken 
} from '../utils/apiTestUtils'

const user = await createTestUser()
const token = generateTestToken(user._id)
```

## Coverage

The project is configured with a coverage threshold of 70%. Coverage reports are generated in:

- HTML: `coverage/lcov-report/index.html`
- LCOV: `coverage/lcov.info`
- Text: Console output

## CI/CD Integration

The testing infrastructure is integrated with GitHub Actions (`.github/workflows/ci.yml`):

1. **Frontend Tests**: Unit tests with coverage
2. **Backend Tests**: Integration tests
3. **E2E Tests**: Browser automation tests
4. **Build & Deploy**: Only runs if all tests pass

## Best Practices

### Writing Tests

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Meaningful Assertions**: Be specific about what you're testing
3. **Mock External Dependencies**: Isolate the code being tested
4. **Test Edge Cases**: Don't just test the happy path
5. **Keep Tests Simple**: Each test should have one clear purpose

### Component Testing

1. **User Interactions**: Test clicks, inputs, and keyboard navigation
2. **State Changes**: Verify component responds correctly to props and state
3. **Accessibility**: Use `screen.getByRole()` where possible
4. **Responsive Design**: Test different viewport sizes

### API Testing

1. **Status Codes**: Test success and error responses
2. **Data Validation**: Verify request/response shapes
3. **Authentication**: Test protected endpoints
4. **Error Handling**: Test error scenarios

### E2E Testing

1. **Critical Paths**: Focus on important user workflows
2. **Real Data**: Use realistic test data
3. **Multiple Browsers**: Test cross-browser compatibility
4. **Performance**: Monitor for slow interactions

## Environment Setup

### Test Database
Tests use MongoDB Memory Server for isolated, fast database operations.

### Mock Services
External APIs are mocked to ensure tests are reliable and fast.

### Browser Testing
Playwright supports Chrome, Firefox, and Safari testing.

## Troubleshooting

### Common Issues

1. **Import Errors**: Check `jest.config.js` moduleNameMapping
2. **Timeout Errors**: Increase test timeout in configuration
3. **Mock Issues**: Verify mocks are properly set up in `jest.setup.js`
4. **Browser Failures**: Ensure Playwright browsers are installed

### Debugging

```bash
# Debug unit tests
npm run test:unit -- --no-cache --verbose

# Debug E2E tests with inspector
npm run test:e2e -- --debug

# Run specific test
npm run test:unit -- ContentCard.test.ts
```

## Future Enhancements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Testing**: Add load testing for API endpoints
3. **Accessibility Testing**: Integrate automated accessibility testing
4. **Component Storybook**: Interactive component testing environment