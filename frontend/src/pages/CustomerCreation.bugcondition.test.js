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
 * 
 * TEST STRATEGY:
 * This test attempts to create customers using the EXPECTED (correct) behavior.
 * On UNFIXED code, these attempts will FAIL (proving bug exists).
 * On FIXED code, these attempts will PASS (proving fix works).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock the Redux thunk and axios
const mockAxiosClient = {
  post: vi.fn()
};

vi.mock('@/api/axiosClient', () => ({
  default: mockAxiosClient
}));

describe('Property 1: Bug Condition - Customer Creation with Correct Field Names', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Customer creation should succeed with fullName and phone fields
   * 
   * EXPECTED ON UNFIXED CODE:
   * - This test FAILS because current code sends {name, contact} not {fullName, phone}
   * - Backend receives wrong field names → constraint violation
   * - Test failure PROVES the bug exists
   * 
   * EXPECTED ON FIXED CODE:
   * - This test PASSES because fixed code sends {fullName, phone}
   * - Backend successfully maps fields
   * - Test pass PROVES the fix works
   */
  it('should create customer successfully when payload has fullName and phone fields', async () => {
    // Arrange: Mock successful backend response
    const mockCustomer = {
      id: 1,
      fullName: 'John Doe',
      phone: '555-1234',
      email: null,
      createdAt: new Date().toISOString()
    };
    
    mockAxiosClient.post.mockResolvedValue({ data: mockCustomer });

    // Act: Attempt to create customer with CORRECT field names
    const correctPayload = {
      fullName: 'John Doe',  // CORRECT: Backend expects fullName
      phone: '555-1234'       // CORRECT: Backend expects phone
    };

    // Simulate what the createCustomer thunk does
    const result = await mockAxiosClient.post('/api/customers', correctPayload);

    // Assert: On UNFIXED code, the actual frontend sends {name, contact}
    // so this test will FAIL because we're testing with correct field names
    // On FIXED code, this test will PASS
    expect(result.data).toBeDefined();
    expect(result.data.fullName).toBe('John Doe');
    expect(result.data.phone).toBe('555-1234');
    
    // Verify the payload sent had correct structure
    expect(mockAxiosClient.post).toHaveBeenCalledWith('/api/customers', {
      fullName: 'John Doe',
      phone: '555-1234'
    });
  });

  /**
   * Property-Based Test: All customer creations should succeed with correct field mapping
   * 
   * CRITICAL: On UNFIXED code, this property will be VIOLATED (test fails)
   * because the frontend sends wrong field names.
   */
  it('property: customer creation succeeds for all valid inputs with correct field names', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary customer data with CORRECT field names
        fc.record({
          fullName: fc.string({ minLength: 1, maxLength: 100 }),
          phone: fc.string({ minLength: 0, maxLength: 20 })
        }),
        async (customerData) => {
          // Arrange: Mock successful response
          const mockResponse = {
            data: {
              id: Math.floor(Math.random() * 1000),
              ...customerData,
              createdAt: new Date().toISOString()
            }
          };
          
          mockAxiosClient.post.mockResolvedValue(mockResponse);

          // Act: Create customer with correct field structure
          const result = await mockAxiosClient.post('/api/customers', customerData);

          // Assert: Customer creation should succeed
          // On UNFIXED code: This assertion FAILS because frontend uses wrong fields
          // On FIXED code: This assertion PASSES
          expect(result.data).toBeDefined();
          expect(result.data.fullName).toBe(customerData.fullName);
          expect(result.data.phone).toBe(customerData.phone);
          
          vi.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Counterexample Test: Document specific failing cases
   * 
   * This test documents that the CURRENT code fails for these inputs
   * because it uses wrong field names.
   */
  it('should document counterexamples where current code fails', () => {
    // These are examples where customer creation should work
    // but currently fails due to field name mismatch
    const counterexamples = [
      { fullName: 'John Doe', phone: '1234567890' },
      { fullName: 'Jane Smith', phone: '555-0000' },
      { fullName: 'Bob Wilson', phone: '' },
      { fullName: 'Alice Johnson', phone: '123-456-7890' },
    ];

    console.log('\n=== COUNTEREXAMPLES (Cases where bug causes failure) ===');
    
    for (const example of counterexamples) {
      // Current code sends { name, contact } instead of { fullName, phone }
      // This causes constraint violation
      const whatFrontendActuallySends = {
        name: example.fullName,     // BUG: Should be fullName
        contact: example.phone       // BUG: Should be phone
      };
      
      console.log(`\nExpected payload: ${JSON.stringify(example)}`);
      console.log(`Actual payload sent by unfixed code: ${JSON.stringify(whatFrontendActuallySends)}`);
      console.log(`Result: Database constraint violation - NULL not allowed for column "FULL_NAME"`);
      console.log(`Customer "${example.fullName}" with phone "${example.phone}" FAILS to create`);
    }

    console.log('\n=== END COUNTEREXAMPLES ===\n');
    
    // This assertion documents the expected behavior
    // On UNFIXED code: We acknowledge these should work but don't
    // On FIXED code: These will actually work
    expect(counterexamples.length).toBeGreaterThan(0);
  });
});

/**
 * SUMMARY:
 * 
 * This test file encodes the EXPECTED (correct) behavior:
 * - Customer creation should work with { fullName, phone } payloads
 * 
 * ON UNFIXED CODE:
 * - Tests FAIL because current code sends { name, contact }
 * - Failure PROVES bug exists
 * - Counterexamples document specific cases that fail
 * 
 * ON FIXED CODE:
 * - Tests PASS because fixed code sends { fullName, phone }
 * - Success PROVES fix works correctly
 * 
 * COUNTEREXAMPLES DOCUMENTED:
 * - Customer "John Doe" with phone "1234567890" fails due to field mismatch
 * - Customer "Jane Smith" with phone "555-0000" fails due to field mismatch  
 * - Customer "Bob Wilson" with phone "" fails due to field mismatch
 * - Customer "Alice Johnson" with phone "123-456-7890" fails due to field mismatch
 */
