# Preservation Property Tests - Task 2 Implementation

## Overview

This document describes the preservation property tests created for Task 2 of the customer creation field mismatch bugfix.

## Test File Location

`src/pages/CustomersPage.preservation.test.js`

## Purpose

These tests verify that existing customer operations (fetch, update, delete, display, email handling, validation) remain functional and are not affected by the bug fix. The tests capture the baseline behavior on UNFIXED code to ensure no regressions occur when the fix is implemented.

## Test Coverage

### 1. Customer Retrieval Operations (Requirement 3.3)
- **Property**: For all valid GET /api/customers requests, the response contains customers with correct field mappings (fullName, phone, email)
- **Tests**:
  - Verifies backend returns customers with correct field structure
  - Property-based test generates 50 customer records to verify field mapping consistency
- **Expected**: PASS on unfixed code (existing fetch operations already work correctly)

### 2. Customer Update Operations (Requirement 3.4)
- **Property**: For all valid update payloads with correct field names, customer updates succeed without field mapping issues
- **Tests**:
  - Verifies update payloads use fullName and phone fields
  - Property-based test generates 50 update requests to verify field structure
- **Expected**: PASS on unfixed code (existing update operations already work correctly)

### 3. Customer Delete Operations (Requirement 3.4)
- **Property**: For all valid customer IDs, delete operations succeed without being affected by field name changes
- **Tests**:
  - Verifies delete operations only require customer ID
  - Property-based test generates 50 delete requests with various IDs
- **Expected**: PASS on unfixed code (delete operations are independent of field names)

### 4. Customer Table Display (Requirement 3.2)
- **Property**: For all existing customer records, table display correctly maps and renders data using the correct field names
- **Tests**:
  - Verifies backend returns customers with fullName, phone fields
  - Property-based test generates arrays of 0-100 customers to verify display rendering
  - Tests optional field handling (empty phone, null email)
- **Expected**: PASS on unfixed code (backend already returns correct field structure)

### 5. Optional Email Field Handling (Requirement 3.1)
- **Property**: For all customer creation attempts with email field, email is correctly saved
- **Tests**:
  - Verifies email field uses correct name (no mismatch)
  - Property-based test generates 50 customer records with optional email
- **Expected**: PASS on unfixed code (email field is already correctly named)

### 6. Form Validation Rules (Requirement 3.5)
- **Property**: Form validation rules (e.g., name cannot be empty) continue to function
- **Tests**:
  - Verifies required field validation enforces non-empty fullName
  - Property-based test generates 50 valid inputs to verify validation consistency
  - Tests optional phone field (can be empty)
- **Expected**: PASS on unfixed code (validation logic already works correctly)

### 7. End-to-End Preservation Verification
- **Integration test**: Verifies complete data flow for fetch → display → update → delete operations
- **Expected**: PASS on unfixed code (all existing operations work correctly)

## Test Framework

- **Test Runner**: Vitest
- **Property-Based Testing**: fast-check
- **Number of Property Test Runs**: 50 per property (configurable)

## Running the Tests

```bash
cd frontend
npm test preservation
```

or run all tests:

```bash
cd frontend
npm test
```

## Expected Outcomes

### On UNFIXED Code (Current State)
All tests in `CustomersPage.preservation.test.js` should **PASS**, which confirms:
- Customer retrieval returns correct field structure (fullName, phone, email)
- Customer update operations use correct field names
- Customer delete operations work independently of field names
- Customer table display receives correct field structure from backend
- Optional email field handling works correctly
- Form validation rules enforce required fields

### On FIXED Code (After Task 3)
All tests should continue to **PASS**, which proves:
- No regressions were introduced
- Existing operations remain unchanged
- Data structure consistency is maintained
- Only customer CREATION payload mapping is fixed
- All other operations continue to work exactly as before

## Observations Documented

Based on the test implementation and design document analysis:

1. **Backend Field Structure**: Backend Customer entity uses `fullName`, `phone`, `email` fields (NOT `name`, `contact`)

2. **Existing Operations**: All non-creation operations already work correctly with proper field names:
   - GET /api/customers returns `{ id, fullName, phone, email, ... }`
   - Update operations accept `{ fullName, phone, email }`
   - Delete operations only require customer ID

3. **Table Display**: The table has defensive fallback logic (`c.name || c.FullName || '—'`) but backend always returns correct `fullName` field

4. **Bug Scope**: The bug ONLY affects customer creation payload field mapping. The frontend form uses `name`/`contact` fields which don't map to backend `fullName`/`phone` fields.

5. **Email Field**: Already correctly named (no mismatch) - not affected by the bug

6. **Validation**: The form validates that name (fullName after fix) cannot be empty - this behavior must be preserved

## Property-Based Testing Strategy

The tests use property-based testing (PBT) with fast-check to:

1. **Generate Many Test Cases**: Each property test runs 50 times with randomly generated data
2. **Increase Confidence**: Tests across wide input domain, not just specific examples
3. **Catch Edge Cases**: Random generation may find edge cases missed by manual unit tests
4. **Verify Consistency**: Ensures behavior is consistent across all possible inputs

### Generators Used

- `fc.string({ minLength, maxLength })` - Generates random customer names
- `fc.emailAddress()` - Generates valid email addresses
- `fc.option(generator, { nil: null })` - Generates optional fields (null or value)
- `fc.integer({ min, max })` - Generates customer IDs for delete/update operations
- `fc.array(generator, { minLength, maxLength })` - Generates arrays of customers for table display
- `fc.record({ ... })` - Generates structured customer objects

## Success Criteria for Task 2

✅ **Task Complete When**:
1. Preservation tests are written covering all 5 preservation requirements (3.1-3.5)
2. Tests use property-based testing approach with fast-check
3. Tests are run on UNFIXED code
4. All tests PASS (confirming baseline behavior to preserve)
5. Tests are documented and ready for re-running after fix implementation

## Next Steps

After Task 2 completion:
- **Task 3**: Implement the fix (update CustomerModal form fields from name/contact to fullName/phone)
- **Task 3.4**: Re-run bug condition exploration tests (should PASS after fix)
- **Task 3.5**: Re-run preservation tests (should still PASS after fix, proving no regressions)

## Notes

- These tests capture the BASELINE behavior that must be preserved
- The tests verify that existing operations already use correct field names
- Only customer CREATION has the field name mismatch bug
- The fix will update the CustomerModal component to use fullName/phone fields
- After the fix, both bug condition tests and preservation tests should pass
