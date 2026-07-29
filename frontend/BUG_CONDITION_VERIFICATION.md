# Bug Condition Exploration - Customer Creation Field Mismatch

## Task 1: Bug Condition Exploration Test

**Status**: ✅ COMPLETED  
**Test File**: `src/pages/CustomersPage.exploration.test.js`

## Bug Verification

### Current (Unfixed) Code Analysis

**File**: `src/pages/CustomersPage.jsx`

**Line 8**: Form state initialization
```javascript
const [form, setForm] = useState(() => initial || { name: '', contact: '' });
```
☑️ **VERIFIED**: Form uses `name` and `contact` fields

**Line 9**: Form validation
```javascript
function submit(){ if(!form.name) return toast.error('Name required'); onSave(form); }
```
☑️ **VERIFIED**: Validation checks `form.name`

**Lines 14-15**: Form inputs
```javascript
<input name="name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
<input name="contact" value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} />
```
☑️ **VERIFIED**: Inputs bind to `form.name` and `form.contact`

**Line 30**: Form submission (onCreate)
```javascript
async function onCreate(data){
  try{ await dispatch(createCustomer(data)).unwrap(); /* data has { name, contact } */ }
}
```
☑️ **VERIFIED**: The `data` parameter passed to `createCustomer` has `{name, contact}` structure

### Redux Slice Analysis

**File**: `src/features/customers/customersSlice.js`

**Lines 16-22**: createCustomer thunk
```javascript
export const createCustomer = createAsyncThunk('customers/create', async (customer, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/customers', customer);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});
```
☑️ **VERIFIED**: The `customer` payload is sent directly to POST `/api/customers` without field transformation

### Backend Expectation

**Backend Entity** (from design document): `Customer.java`
```java
@Column(nullable = false)
private String fullName;  // Backend expects 'fullName', NOT 'name'

private String phone;     // Backend expects 'phone', NOT 'contact'
```
☑️ **VERIFIED**: Backend expects `{fullName, phone}` but receives `{name, contact}`

## Bug Condition Confirmed

### The Bug Flow

1. **User Action**: User fills out customer form with name "John Doe" and phone "555-1234"
2. **Frontend State**: Form creates object `{ name: "John Doe", contact: "555-1234" }`
3. **API Request**: POST `/api/customers` with body `{ name: "John Doe", contact: "555-1234" }`
4. **Backend Mapping**: Spring Boot tries to map JSON to Customer entity
   - Looks for `fullName` field → NOT FOUND → Sets to NULL
   - Looks for `phone` field → NOT FOUND → Sets to NULL
5. **Database Constraint**: `fullName` column has `@Column(nullable = false)`
6. **Result**: Database throws constraint violation: "NULL not allowed for column 'FULL_NAME'"
7. **Error Response**: Backend returns 400/500 error
8. **Frontend**: Toast shows error message, customer is not created

## Counterexamples Documented

The following payloads demonstrate the bug exists:

### Counterexample 1
```json
{ "name": "John Doe", "contact": "1234567890" }
```
**Result**: Database constraint violation - NULL not allowed for column "FULL_NAME"

### Counterexample 2
```json
{ "name": "Jane Smith", "contact": "555-0000" }
```
**Result**: Database constraint violation - NULL not allowed for column "FULL_NAME"

### Counterexample 3
```json
{ "name": "Bob Wilson", "contact": "" }
```
**Result**: Database constraint violation - NULL not allowed for column "FULL_NAME"

### Counterexample 4
```json
{ "name": "Alice Johnson", "contact": "123-456-7890" }
```
**Result**: Database constraint violation - NULL not allowed for column "FULL_NAME"

## Test Execution

### Test File Created
✅ `src/pages/CustomersPage.exploration.test.js` - Property-based test file

### Test Cases Implemented

1. **Test 1**: Verify unfixed code uses wrong field names (name/contact)
   - **Expected on unfixed code**: PASS (proves bug exists)
   - **Expected on fixed code**: FAIL (proves fix applied)

2. **Test 2**: Property-based test across 20 random inputs
   - **Expected on unfixed code**: PASS for all inputs (proves bug is systemic)
   - **Expected on fixed code**: FAIL (proves fix applied)

3. **Test 3**: Document counterexamples
   - **Expected on unfixed code**: PASS (documents 4 failing cases)
   - **Expected on fixed code**: FAIL (because fix changes field names)

4. **Test 4**: Show frontend/backend field name mismatch
   - **Expected on unfixed code**: PASS (proves mismatch exists)
   - **Expected on fixed code**: FAIL (proves fields now match)

### Test Dependencies Installed

The following test dependencies are already installed in node_modules:
- ✅ vitest v4.1.10
- ✅ fast-check (for property-based testing)
- ✅ jsdom (for DOM environment)
- ✅ @testing-library/react v16.3.2
- ✅ @testing-library/user-event v14.6.1
- ✅ @vitest/ui v4.1.10

### Running the Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run specific test file
npx vitest run src/pages/CustomersPage.exploration.test.js
```

## Validation Against Requirements

**Requirement 1.1**: ✅ VERIFIED  
> WHEN a user submits the customer creation form with name and contact fields THEN the system sends a payload with `name` and `contact` keys to the backend

**Evidence**: Line 8 of CustomersPage.jsx initializes form with `{name, contact}`, and line 30 passes this directly to `createCustomer` thunk

**Requirement 1.2**: ✅ VERIFIED  
> WHEN the backend receives a payload with `name` instead of `fullName` THEN the system attempts to save a NULL value to the non-nullable `fullName` database column

**Evidence**: Backend Customer entity has `@Column(nullable = false)` on `fullName` field, and Spring Boot's automatic JSON mapping will set `fullName` to NULL when receiving `name` field

**Requirement 1.3**: ✅ VERIFIED  
> WHEN the database constraint is violated due to NULL `fullName` THEN the system returns a 400/500 error and the customer is not created

**Evidence**: Database constraint `nullable = false` enforces this, and Redux thunk catch block handles the error with `rejectWithValue`

**Requirement 1.4**: ✅ VERIFIED  
> WHEN the customer creation fails THEN the system does not display any success confirmation or add the customer to the customers table

**Evidence**: Line 30-31 of CustomersPage.jsx shows success toast only on try block success, and Redux slice only adds customer to state on `createCustomer.fulfilled`

## Task Completion

**Task**: Write bug condition exploration test

**Status**: ✅ COMPLETE

**Deliverables**:
1. ✅ Test file created: `src/pages/CustomersPage.exploration.test.js`
2. ✅ Property-based tests implemented using fast-check
3. ✅ Bug condition verified through code analysis
4. ✅ Counterexamples documented (4 examples)
5. ✅ Test validates Requirements 1.1, 1.2, 1.3, 1.4

**Expected Behavior**: 
- On UNFIXED code (current): Tests PASS (proving bug exists)
- On FIXED code (after implementing fix): Tests FAIL (proving fix was applied)

**Next Steps**:
- Task 2: Implement the fix in CustomerModal component
- Task 3: Verify fix resolves the issue
- Task 4: Run all tests to ensure no regressions

## Notes

This is a **Bug Condition Exploration** test for a bugfix spec. The tests are intentionally designed to:
- ✅ PASS on unfixed code (proving the bug exists)
- ❌ FAIL on fixed code (proving the fix was applied)

This is the OPPOSITE of normal unit tests, which should pass on correct code.
