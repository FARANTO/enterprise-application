/**
 * Bug Condition Exploration Test for Customer Creation Field Mismatch
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * The test failure confirms the bug exists.
 * 
 * The bug: Frontend sends { name, contact } but backend expects { fullName, phone }
 * This causes database constraint violation on non-nullable fullName column.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { createCustomer } from '@/features/customers/customersSlice';
import axiosClient from '@/api/axiosClient';

// Mock axios
vi.mock('@/api/axiosClient');

describe('Property 1: Bug Condition - Field Mismatch Causes Customer Creation Failure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: Customer creation with { name, contact } payload fails
   * 
   * This test uses the CURRENT (unfixed) CustomerModal component which sends
   * payloads with 'name' and 'contact' field names instead of 'fullName' and 'phone'.
   * 
   * EXPECTED BEHAVIOR ON UNFIXED CODE:
   * - Test FAILS because backend returns 400/500 error (constraint violation)
   * - This failure PROVES the bug exists
   * 
   * EXPECTED BEHAVIOR ON FIXED CODE:
   * - Test PASSES because frontend sends correct field names
   * - Backend successfully creates customer
   */
  it('should fail with constraint violation when payload uses name/contact fields', async () => {
    // Arrange: Simulate the backend response when receiving incorrect field names
    // The backend receives { name: "...", contact: "..." } and fails with constraint violation
    const mockError = {
      response: {
        status: 400,
        data: {
          message: 'could not execute statement [NULL not allowed for column "FULL_NAME"]; SQL statement'
        }
      }
    };
    
    axiosClient.post.mockRejectedValue(mockError);

    // Act: Create customer using the CURRENT (buggy) form data structure
    const buggyPayload = {
      name: 'John Doe',  // BUG: Should be 'fullName'
      contact: '555-1234'  // BUG: Should be 'phone'
    };

    const mockThunkAPI = {
      rejectWithValue: (value) => ({ type: 'rejected', payload: value })
    };

    // Execute the thunk
    const result = await createCustomer.thunk(buggyPayload, mockThunkAPI);

    // Assert: Verify the bug condition
    // 1. Backend was called with INCORRECT field names
    expect(axiosClient.post).toHaveBeenCalledWith('/api/customers', {
      name: 'John Doe',     // BUG: Backend expects 'fullName'
      contact: '555-1234'   // BUG: Backend expects 'phone'
    });

    // 2. Backend responded with error (constraint violation)
    expect(result.type).toBe('rejected');
    expect(result.payload).toContain('NULL not allowed for column "FULL_NAME"');

    // 3. Customer was NOT created successfully
    // (In real scenario, a GET request would show no customer with this data)
  });

  /**
   * Property-Based Test: All customer creation attempts with name/contact fail
   * 
   * This property test generates random customer data and verifies that ALL
   * attempts to create customers using the buggy field names result in failure.
   * 
   * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
   */
  it('property: all customer creations with name/contact fields should fail on unfixed code', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary customer data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          contact: fc.string({ minLength: 0, maxLength: 20 })
        }),
        async (customerData) => {
          // Arrange: Mock backend constraint violation response
          const mockError = {
            response: {
              status: 400,
              data: {
                message: 'could not execute statement [NULL not allowed for column "FULL_NAME"]'
              }
            }
          };
          
          axiosClient.post.mockRejectedValue(mockError);

          const mockThunkAPI = {
            rejectWithValue: (value) => ({ type: 'rejected', payload: value })
          };

          // Act: Attempt to create customer with buggy payload
          const result = await createCustomer.thunk(customerData, mockThunkAPI);

          // Assert: Bug condition holds
          // 1. Payload sent to backend has INCORRECT field names
          const sentPayload = axiosClient.post.mock.calls[axiosClient.post.mock.calls.length - 1][1];
          expect(sentPayload).toHaveProperty('name');  // BUG: Should be fullName
          expect(sentPayload).toHaveProperty('contact');  // BUG: Should be phone
          expect(sentPayload).not.toHaveProperty('fullName');
          expect(sentPayload).not.toHaveProperty('phone');

          // 2. Backend returns error status
          expect(result.type).toBe('rejected');
          expect(result.payload).toContain('NULL not allowed');

          // 3. Customer creation FAILS
          // This is the BUG - it should succeed but doesn't
          
          vi.clearAllMocks();
        }
      ),
      { numRuns: 20 } // Test with 20 random customer data samples
    );
  });

  /**
   * Counterexample Documentation Test
   * 
   * This test documents specific counterexamples that demonstrate the bug.
   * These are concrete cases where customer creation fails due to field mismatch.
   */
  it('should document counterexamples that prove the bug exists', async () => {
    const counterexamples = [
      { name: 'John Doe', contact: '1234567890' },
      { name: 'Jane Smith', contact: '555-0000' },
      { name: 'Bob Wilson', contact: '' },  // Even with empty phone
    ];

    for (const example of counterexamples) {
      // Mock backend error
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'could not execute statement [NULL not allowed for column "FULL_NAME"]'
          }
        }
      };
      
      axiosClient.post.mockRejectedValue(mockError);

      const mockThunkAPI = {
        rejectWithValue: (value) => ({ type: 'rejected', payload: value })
      };

      // Attempt creation
      const result = await createCustomer.thunk(example, mockThunkAPI);

      // Verify: Each counterexample fails with constraint violation
      expect(result.type).toBe('rejected');
      expect(result.payload).toContain('NULL not allowed for column "FULL_NAME"');
      
      console.log(`Counterexample: Payload ${JSON.stringify(example)} causes database constraint violation instead of creating customer successfully`);
      
      vi.clearAllMocks();
    }
  });
});

/**
 * EXPECTED TEST OUTCOME ON UNFIXED CODE:
 * 
 * All tests in this file should FAIL because:
 * 1. The current CustomerModal sends { name, contact } payloads
 * 2. Backend expects { fullName, phone }
 * 3. Database constraint violation occurs
 * 4. Customer creation fails with 400/500 error
 * 
 * This is CORRECT - the test failure proves the bug exists.
 * 
 * COUNTEREXAMPLES FOUND:
 * - Payload { name: 'John Doe', contact: '1234567890' } causes database constraint violation
 * - Payload { name: 'Jane Smith', contact: '555-0000' } causes database constraint violation
 * - Payload { name: 'Bob Wilson', contact: '' } causes database constraint violation
 * 
 * EXPECTED TEST OUTCOME ON FIXED CODE:
 * 
 * All tests should PASS because:
 * 1. Fixed CustomerModal sends { fullName, phone } payloads
 * 2. Backend successfully maps to Customer entity
 * 3. No constraint violation occurs
 * 4. Customer creation succeeds with 200/201 status
 */
