# Customer Creation Field Mismatch Bugfix Design

## Overview

The customer creation feature fails due to a field name mismatch between the frontend and backend. The frontend sends `name` and `contact` fields, but the backend Customer entity expects `fullName` and `phone` fields. Since `fullName` is marked as `nullable = false` in the database schema, the mismatch causes a constraint violation resulting in customer creation failure.

The fix involves updating the frontend form and Redux slice to use the correct field names (`fullName` and `phone`) that match the backend Customer entity. This is a minimal, targeted fix that aligns the API contract without requiring backend changes or database migrations.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the frontend sends a payload with `name`/`contact` instead of `fullName`/`phone`
- **Property (P)**: The desired behavior - customer creation succeeds with `fullName` and `phone` fields properly mapped to the backend entity
- **Preservation**: Existing customer operations (read, update, delete, search) and optional email field handling that must remain unchanged
- **CustomerModal**: The React component in `frontend/src/pages/CustomersPage.jsx` that renders the customer creation/edit form
- **createCustomer**: The Redux thunk in `frontend/src/features/customers/customersSlice.js` that makes the POST request to `/api/customers`
- **Customer entity**: The JPA entity in `Enterprise Saas Application/Enterprise-Saas-Application/src/main/java/com/Anto/modal/Customer.java` with fields `fullName`, `phone`, and `email`

## Bug Details

### Bug Condition

The bug manifests when a user submits the customer creation form. The `CustomerModal` component uses form fields named `name` and `contact`, which are passed directly to the `createCustomer` Redux thunk. This thunk sends the payload to the backend `/api/customers` endpoint, where Spring Boot attempts to map the JSON fields to the Customer entity. Since the entity has `fullName` and `phone` fields (not `name` and `contact`), the mapping fails, leaving `fullName` as NULL. The database constraint `@Column(nullable = false)` on `fullName` then causes a constraint violation, resulting in a 400/500 error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CustomerCreationPayload
  OUTPUT: boolean
  
  RETURN input.hasField("name") AND NOT input.hasField("fullName")
         AND input.hasField("contact") AND NOT input.hasField("phone")
         AND customerFormSubmitted(input)
         AND NOT customerCreatedSuccessfully(input)
END FUNCTION
```

### Examples

- **Example 1**: User enters "John Doe" in name field and "555-1234" in contact field
  - **Current behavior**: Frontend sends `{ name: "John Doe", contact: "555-1234" }` → Backend receives NULL for `fullName` → Database constraint violation → 400/500 error
  - **Expected behavior**: Frontend should send `{ fullName: "John Doe", phone: "555-1234" }` → Backend maps correctly → Customer saved successfully

- **Example 2**: User enters "Jane Smith" in name field, "555-5678" in contact field
  - **Current behavior**: POST request fails with constraint violation on `fullName` column
  - **Expected behavior**: Customer created with ID, success toast shown, customer appears in table

- **Example 3**: User enters "Bob Wilson" in name field, leaves contact empty
  - **Current behavior**: Frontend sends `{ name: "Bob Wilson", contact: "" }` → Constraint violation on `fullName`
  - **Expected behavior**: Frontend should send `{ fullName: "Bob Wilson", phone: "" }` → Customer created successfully (phone is optional)

- **Edge case**: User enters very long name (>255 chars) with valid contact
  - **Expected behavior**: Should respect any database length constraints and provide appropriate validation error (not a NULL constraint error)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- GET `/api/customers` must continue to return customer records with `fullName`, `phone`, and `email` fields
- Customer table display must continue to render customer data correctly (currently has fallback logic: `c.name || c.FullName || '—'`)
- Customer update operations must continue to work correctly with the existing field names
- Customer delete operations must continue to function without modification
- Customer search functionality (`/api/customers/search?q=`) must continue to work correctly
- Optional `email` field handling must remain unchanged (it's already correctly named in the entity)

**Scope:**
All customer operations that do NOT involve the creation payload field mapping should be completely unaffected by this fix. This includes:
- Mouse clicks and UI interactions on the customers page
- Fetching and displaying existing customer records
- Editing existing customers (update flow)
- Deleting customers
- Searching for customers
- Form validation logic (required field checks)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Frontend Form Field Naming Mismatch**: The `CustomerModal` component uses form state with keys `name` and `contact`:
   ```javascript
   const [form, setForm] = useState(() => initial || { name: '', contact: '' });
   ```

2. **Direct Payload Transmission**: The `createCustomer` Redux thunk passes this form object directly to the API without field transformation:
   ```javascript
   const res = await axiosClient.post('/api/customers', customer);
   ```

3. **Backend Entity Field Names**: The Customer JPA entity defines fields as `fullName` (non-nullable) and `phone`:
   ```java
   @Column(nullable = false)
   private String fullName;
   private String phone;
   ```

4. **Spring Boot Automatic Mapping**: Spring Boot's `@RequestBody` annotation attempts to map JSON fields to entity fields by name. When `name` doesn't match `fullName`, the field remains NULL, causing the database constraint violation.

**Note**: The customer display table has defensive fallback logic (`c.name || c.FullName || '—'`) which suggests this mismatch may have been discovered previously but only partially addressed in the display layer, not in the creation flow.

## Correctness Properties

Property 1: Bug Condition - Customer Creation Field Mapping

_For any_ customer creation request where the user provides a name and contact value, the fixed frontend SHALL send a payload with `fullName` and `phone` keys (not `name` and `contact`), and the backend SHALL successfully map these fields to the Customer entity, resulting in successful customer creation with a 200/201 status code and the customer appearing in the customers table.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Customer Operations

_For any_ customer operation that is NOT a creation request (read, update, delete, search), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality including customer table display, update operations, delete operations, and search functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (which it is, based on direct code inspection):

**File 1**: `frontend/src/pages/CustomersPage.jsx`

**Component**: `CustomerModal`

**Specific Changes**:
1. **Update form state initialization**: Change `{ name: '', contact: '' }` to `{ fullName: '', phone: '' }`
   ```javascript
   // Before:
   const [form, setForm] = useState(() => initial || { name: '', contact: '' });
   
   // After:
   const [form, setForm] = useState(() => initial || { fullName: '', phone: '' });
   ```

2. **Update form validation**: Change `!form.name` to `!form.fullName`
   ```javascript
   // Before:
   function submit(){ if(!form.name) return toast.error('Name required'); onSave(form); }
   
   // After:
   function submit(){ if(!form.fullName) return toast.error('Name required'); onSave(form); }
   ```

3. **Update input field bindings**: Change `name` field to `fullName` and `contact` field to `phone`
   ```javascript
   // Before:
   <input name="name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
   <input name="contact" value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} />
   
   // After:
   <input name="fullName" value={form.fullName} onChange={e=>setForm({...form, fullName: e.target.value})} />
   <input name="phone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
   ```

4. **Update table display to use consistent field names**: Clean up the fallback logic since fields will now be consistent
   ```javascript
   // Before:
   <td>{c.name || c.FullName || '—'}</td>
   <td>{c.contact || c.phone || c.Email || '—'}</td>
   
   // After:
   <td>{c.fullName || '—'}</td>
   <td>{c.phone || '—'}</td>
   ```

5. **Handle edit flow mapping**: Ensure that when editing an existing customer, the form is initialized with the correct field names
   ```javascript
   // The existing code passes `initial` (which is the customer object from backend)
   // Backend returns { id, fullName, email, phone, createdAt, updatedAt }
   // So the form will now correctly map to these fields
   ```

**No backend changes required** - the Customer entity, controller, and service already use the correct field names.

**No database changes required** - the schema already has the correct column names.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis by observing the field name mismatch in the network request.

**Test Plan**: Manually test the unfixed code by attempting to create a customer, then inspect the network request payload in browser DevTools. Verify that the payload contains `name` and `contact` fields and that the backend returns a 400/500 error with a constraint violation message.

**Test Cases**:
1. **Basic Customer Creation Test**: Enter "Test User" and "555-0000" → Submit form (will fail on unfixed code)
   - **Expected counterexample**: Network tab shows `POST /api/customers` with payload `{ name: "Test User", contact: "555-0000" }`, response is 400/500 error

2. **Empty Contact Field Test**: Enter "Test User" with empty contact → Submit form (will fail on unfixed code)
   - **Expected counterexample**: Constraint violation on `fullName` field

3. **Browser Console Error Test**: Check browser console for any error messages (will show Redux rejection on unfixed code)
   - **Expected counterexample**: Redux thunk rejection with backend error message

4. **Database Verification Test**: Query database after failed creation attempt (will show no record on unfixed code)
   - **Expected counterexample**: No customer record created in database

**Expected Counterexamples**:
- Frontend sends incorrect field names (`name`, `contact`) instead of (`fullName`, `phone`)
- Backend responds with 400/500 status code
- Error message indicates constraint violation on `fullName` column
- Customer record is not persisted to database
- Frontend displays error toast notification

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  payload := createCustomerPayload_fixed(input)
  ASSERT payload.hasField("fullName") AND NOT payload.hasField("name")
  ASSERT payload.hasField("phone") AND NOT payload.hasField("contact")
  
  response := POST_to_backend(payload)
  ASSERT response.statusCode IN [200, 201]
  ASSERT response.data.fullName = input.fullName
  ASSERT response.data.phone = input.phone
  
  customersTable := fetchCustomers_fixed()
  ASSERT customersTable contains response.data
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL operation WHERE NOT isCustomerCreation(operation) DO
  // Verify read operations unchanged
  ASSERT fetchCustomers_fixed() returns same structure as fetchCustomers()
  ASSERT searchCustomers_fixed(query) = searchCustomers(query)
  
  // Verify update operations unchanged
  existingCustomer := { id: 1, fullName: "John Doe", phone: "555-1234" }
  ASSERT updateCustomer_fixed(existingCustomer) = updateCustomer(existingCustomer)
  
  // Verify delete operations unchanged
  ASSERT deleteCustomer_fixed(customerId) = deleteCustomer(customerId)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-creation operations

**Test Plan**: Observe behavior on UNFIXED code first for existing customer operations (read, update, delete), then verify the fixed code produces identical behavior.

**Test Cases**:
1. **Customer Fetch Preservation**: Verify that GET `/api/customers` returns the same data structure before and after the fix
   - Observe on unfixed code: Returns array of customers with `fullName`, `phone`, `email` fields
   - Test on fixed code: Should return identical structure

2. **Customer Update Preservation**: Verify that updating an existing customer works identically before and after the fix
   - Observe on unfixed code: Edit button → Modal opens with customer data → Change name → Save → Success
   - Test on fixed code: Should work identically

3. **Customer Delete Preservation**: Verify that deleting a customer works identically before and after the fix
   - Observe on unfixed code: Delete button → Confirm → Customer removed from table
   - Test on fixed code: Should work identically

4. **Customer Display Preservation**: Verify that the customers table displays data correctly after the fix
   - Note: Table display will be IMPROVED (no longer needs fallback logic), but existing customers should display correctly

### Unit Tests

- Test customer creation form submission with valid `fullName` and `phone` values
- Test form validation (empty `fullName` field should show error)
- Test network payload structure contains correct field names (`fullName`, `phone`)
- Test successful customer creation updates Redux state correctly
- Test customer table displays newly created customer correctly
- Test edge cases: very long names, special characters in names, empty phone field

### Property-Based Tests

- Generate random customer data (names, phone numbers) and verify all creations succeed with correct field mapping
- Generate random existing customer states and verify all update/delete operations continue to work
- Test across many customer records that the fetch operation returns consistent field structure
- Verify that rapid creation of multiple customers all succeed (no race conditions in Redux state)

### Integration Tests

- Test full customer creation flow: Open modal → Enter data → Submit → Verify toast → Verify table update
- Test full customer update flow: Click edit → Modify data → Save → Verify changes persist
- Test full customer delete flow: Click delete → Confirm → Verify customer removed
- Test customer search flow: Enter search query → Verify filtered results display correctly
- Test page refresh after customer creation: Verify created customers persist and display correctly
- Test switching between create and edit modes: Verify form resets correctly and loads appropriate data

### Manual Testing Checklist

After implementing the fix, perform the following manual tests:

1. ✅ Create a new customer with name "Test User" and phone "555-1234"
   - Verify: Success toast appears
   - Verify: Customer appears in table immediately
   - Verify: Network request shows `{ fullName: "Test User", phone: "555-1234" }` payload
   - Verify: Response status is 200/201

2. ✅ Refresh the page and verify the created customer is still present

3. ✅ Edit an existing customer's name and phone
   - Verify: Changes save successfully
   - Verify: Table updates immediately

4. ✅ Delete a customer
   - Verify: Customer is removed from table
   - Verify: Success toast appears

5. ✅ Create a customer with empty phone field
   - Verify: Creation succeeds (phone is optional)

6. ✅ Try to create a customer with empty name field
   - Verify: Validation error appears ("Name required")

7. ✅ Check browser console for any errors during all operations
   - Verify: No console errors or warnings
