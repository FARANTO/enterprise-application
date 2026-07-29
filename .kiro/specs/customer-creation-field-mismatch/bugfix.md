# Bugfix Requirements Document

## Introduction

Customer creation from the Customers page fails due to a field name mismatch between the frontend and backend. The frontend sends `name` and `contact` fields, but the backend expects `fullName` and `phone` fields. Since the `fullName` field is marked as `nullable = false` in the database schema, the mismatch causes a constraint violation and the operation fails with a 400/500 error.

This is a **HIGH severity** issue affecting all user roles (cashiers, managers, admins) attempting to create customers. The feature is completely non-functional with no available workaround.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits the customer creation form with name and contact fields THEN the system sends a payload with `name` and `contact` keys to the backend

1.2 WHEN the backend receives a payload with `name` instead of `fullName` THEN the system attempts to save a NULL value to the non-nullable `fullName` database column

1.3 WHEN the database constraint is violated due to NULL `fullName` THEN the system returns a 400/500 error and the customer is not created

1.4 WHEN the customer creation fails THEN the system does not display any success confirmation or add the customer to the customers table

### Expected Behavior (Correct)

2.1 WHEN a user submits the customer creation form with name and contact fields THEN the system SHALL send a payload with `fullName` and `phone` keys to the backend

2.2 WHEN the backend receives a payload with `fullName` and `phone` THEN the system SHALL successfully map the values to the Customer entity fields

2.3 WHEN the Customer entity is saved with a valid `fullName` value THEN the system SHALL persist the customer record to the database without constraint violations

2.4 WHEN the customer is successfully created THEN the system SHALL display a success toast notification and add the customer to the customers table

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer creation request includes optional `email` field THEN the system SHALL CONTINUE TO accept and save the email value correctly

3.2 WHEN the customers table displays existing customer records THEN the system SHALL CONTINUE TO render customer data with correct field mappings

3.3 WHEN customers are retrieved via the GET /api/customers endpoint THEN the system SHALL CONTINUE TO return customer records with `fullName`, `phone`, and `email` fields

3.4 WHEN customer update or delete operations are performed THEN the system SHALL CONTINUE TO function correctly without being affected by the creation fix

3.5 WHEN the customer form validation is triggered THEN the system SHALL CONTINUE TO enforce required field rules (e.g., name cannot be empty)

---

## Bug Condition Specification

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CustomerCreationRequest
  OUTPUT: boolean
  
  // Returns true when payload uses incorrect field names
  RETURN (X.hasField("name") AND NOT X.hasField("fullName")) 
      OR (X.hasField("contact") AND NOT X.hasField("phone"))
END FUNCTION
```

### Fix Checking Property

```pascal
// Property: Customer Creation Field Mapping Fix
FOR ALL X WHERE isBugCondition(X) DO
  // After fix, frontend sends correct field names
  payload ← createCustomer'(X)
  ASSERT payload.hasField("fullName") 
     AND payload.hasField("phone")
     AND NOT payload.hasField("name")
     AND NOT payload.hasField("contact")
  
  // Backend successfully saves customer
  result ← backendSave(payload)
  ASSERT result.success = true
     AND result.statusCode IN [200, 201]
     AND result.customer.fullName IS NOT NULL
END FOR
```

### Preservation Checking Property

```pascal
// Property: Existing Customer Operations Preserved
FOR ALL X WHERE NOT isBugCondition(X) DO
  // Customer retrieval, update, delete remain unchanged
  ASSERT getCustomers'() = getCustomers()
  ASSERT updateCustomer'(validCustomer) = updateCustomer(validCustomer)
  ASSERT deleteCustomer'(customerId) = deleteCustomer(customerId)
  
  // Optional email field handling unchanged
  ASSERT createCustomerWithEmail'(fullData) = createCustomerWithEmail(fullData)
END FOR
```

---

## Key Definitions

- **F**: The original (unfixed) code - frontend sends `name`/`contact`, backend expects `fullName`/`phone`
- **F'**: The fixed code - frontend sends `fullName`/`phone` matching backend expectations
- **Counterexample**: Submitting `{ name: 'John Doe', contact: '1234567890' }` results in database constraint violation
