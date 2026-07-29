# Test Setup Instructions

## Installation Required

Before running the bug condition exploration tests, install the following dependencies:

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event fast-check
```

## Running Tests

Once dependencies are installed, run the tests with:

```bash
npm test
```

Or in watch mode:

```bash
npm run test:watch
```

Or with UI:

```bash
npm run test:ui
```

## Expected Test Behavior

### On UNFIXED Code (Current State)

The test file `src/pages/CustomersPage.test.jsx` is EXPECTED TO FAIL. This failure proves the bug exists:

- Frontend sends `{ name, contact }` payload
- Backend expects `{ fullName, phone }`
- Database constraint violation occurs (NULL not allowed for FULL_NAME column)
- Customer creation fails with 400/500 error

### On FIXED Code (After Implementing Fix)

The same tests should PASS:

- Frontend sends `{ fullName, phone }` payload
- Backend successfully maps to Customer entity
- Customer is created successfully
- Test validates the fix works correctly

## Test File Location

`src/pages/CustomersPage.test.jsx` - Bug condition exploration property-based tests
