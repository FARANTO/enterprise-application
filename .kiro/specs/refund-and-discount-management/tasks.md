# Implementation Plan: Refund & Discount Management

## Overview

This implementation plan outlines the steps to build the Refund & Discount Management feature. The feature consists of two major components: a dedicated Refunds page for viewing and creating refunds, and enhanced POS functionality for applying discounts during checkout.

**Implementation Split**: 90% frontend (React + Redux), 10% backend (entity extensions for discount persistence)

**Key Focus Areas**:
1. Backend entity updates for discount tracking
2. Redux state management (refundsSlice enhancements, cartSlice discount support)
3. RefundsPage component with filtering and refund creation
4. POS discount UI with modal-based discount application
5. Navigation and routing integration

## Tasks

- [-] 1. Backend: Extend Order and OrderItem entities with discount fields
  - Add discount-related fields to Order entity: `originalAmount`, `discountAmount`, `discountType`, `discountPercentage`, `discountFlat`, `authorizedBy`
  - Add discount-related fields to OrderItem entity: `originalPrice`, `discountAmount`, `discountType`, `discountValue`
  - All new fields should be nullable to maintain backward compatibility
  - Update `@PrePersist` or calculation logic if needed to ensure `totalAmount` reflects final amount after discounts
  - _Requirements: 5.1, 5.4, 6.3, 7.3, 8.1, 8.2, 8.3_

- [ ] 2. Backend: Add discount validation to OrderService
  - [-] 2.1 Create `validateDiscount` method in OrderService
    - Validate percentage discounts are between 0-100
    - Validate flat discounts are positive and less than order total
    - Validate item-level discounts don't reduce item price to zero or below
    - Check for manager authorization when percentage > 20% or flat > 50
    - Throw appropriate exceptions with clear error messages
    - _Requirements: 5.2, 5.6, 6.2, 6.4, 7.6, 15.1, 15.2, 15.4_

  - [ ]* 2.2 Write unit tests for discount validation
    - Test valid percentage discount (0-100 range)
    - Test invalid percentage discount (negative, > 100)
    - Test valid flat discount (positive, < total)
    - Test invalid flat discount (>= total)
    - Test authorization requirement for high discounts
    - Test manager override validation
    - _Requirements: 5.6, 6.4, 15.4_

- [ ] 3. Redux: Enhance cartSlice with discount functionality
  - [x] 3.1 Add discount state structure to cartSlice initial state
    - Add `discount` object with `type`, `orderDiscount`, and `itemDiscounts` properties
    - Initialize all discount values to null/empty
    - _Requirements: 5.1, 6.1, 7.1_

  - [-] 3.2 Create discount reducer actions
    - Implement `applyOrderDiscount` reducer for order-level discounts
    - Implement `applyItemDiscount` reducer for item-level discounts
    - Implement `clearDiscounts` reducer to reset all discounts
    - Implement `removeItemDiscount` reducer for individual item discount removal
    - _Requirements: 5.1, 5.3, 6.1, 6.3, 7.2, 11.7_

  - [~] 3.3 Enhance selectCartTotals selector with discount calculations
    - Calculate `subtotal` (original amount before discounts)
    - Calculate `discountAmount` based on discount type (order or item-level)
    - Calculate `finalTotal` (subtotal - discountAmount)
    - Handle percentage and flat discount modes
    - Return all three values plus `totalItems` count
    - _Requirements: 5.3, 5.4, 5.5, 6.3, 6.5, 7.3, 7.4_

  - [ ]* 3.4 Write unit tests for cartSlice discount functionality
    - Test order-level percentage discount calculation
    - Test order-level flat discount calculation
    - Test item-level discount calculations
    - Test discount clearing
    - Test selectCartTotals selector with various discount scenarios
    - _Requirements: 5.3, 5.4, 6.3, 7.3_

- [ ] 4. Redux: Enhance refundsSlice with additional filtering
  - [-] 4.1 Add new async thunks for refund filtering
    - Create `fetchRefundsByCashier` thunk
    - Create `fetchRefundsByDateRange` thunk
    - Create `fetchRefundById` thunk for detail view
    - Add proper error handling in each thunk
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [~] 4.2 Add selectedRefund and filters to refundsSlice state
    - Add `selectedRefund` property for detail view
    - Add `filters` object to track current filter selections
    - Update extraReducers to handle new thunks
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.3 Write unit tests for refundsSlice enhancements
    - Test each new async thunk (pending, fulfilled, rejected states)
    - Test state updates when filters are applied
    - Test selectedRefund population
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [~] 5. Checkpoint - Ensure Redux state management is working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Frontend: Create DiscountModal component
  - [~] 6.1 Create DiscountModal component structure
    - Create `frontend/src/components/pos/DiscountModal.jsx`
    - Implement modal with tab/radio selector for "Order Discount" vs "Item Discount"
    - Add state management for selected tab and discount values
    - Props: `open`, `onClose`, `onApply`, `cartItems`, `cartTotal`
    - _Requirements: 5.1, 6.1, 7.1, 11.2, 11.3_

  - [~] 6.2 Implement Order Discount tab
    - Add radio buttons for "Percentage" vs "Flat" discount mode
    - Add input field for discount value with validation
    - Display real-time preview of original amount, discount amount, and final amount
    - Format all monetary values with currency symbol and 2 decimal places
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5, 11.4, 11.6_

  - [~] 6.3 Implement Item Discount tab
    - Display list of all cart items
    - Add discount input (percentage or flat) for each item
    - Show real-time preview of original price and discounted price per item
    - Calculate and display total discount and final order amount
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.5, 11.6_

  - [~] 6.4 Add client-side validation to DiscountModal
    - Validate percentage: 0 <= value <= 100
    - Validate flat discount: 0 < value < subtotal
    - Validate item discount doesn't reduce price to zero or below
    - Display inline error messages for invalid inputs
    - Check for manager authorization requirement (percentage > 20 or flat > 50)
    - _Requirements: 5.2, 5.6, 6.2, 6.4, 7.6, 15.1, 15.2, 15.4_

  - [~] 6.5 Implement Apply and Cancel handlers
    - Create `handleApply` to dispatch discount actions to cartSlice
    - Create `handleCancel` to close modal without changes
    - Add "Clear Discount" button to remove all applied discounts
    - _Requirements: 5.1, 6.1, 7.2, 11.7_

  - [ ]* 6.6 Write component tests for DiscountModal
    - Test modal open/close behavior
    - Test tab switching between order and item discounts
    - Test percentage discount calculation and preview
    - Test flat discount calculation and preview
    - Test validation error messages
    - Test Apply and Cancel actions
    - _Requirements: 5.3, 5.4, 6.3, 7.3, 11.2_

- [ ] 7. Frontend: Enhance POSPage with discount functionality
  - [~] 7.1 Add discount display to POS cart summary
    - Display "Original Total" (subtotal before discount)
    - Display "Discount" amount with type indicator (percentage/flat)
    - Display "Final Total" (after discount)
    - Show discount details per item if item-level discounts applied
    - Format all amounts with currency symbol (₹) and 2 decimal places
    - _Requirements: 5.5, 6.5, 7.5, 4.4_

  - [~] 7.2 Add "Apply Discount" button to POS interface
    - Add button in cart summary section near payment buttons
    - Implement click handler to open DiscountModal
    - Pass current cart items and totals as props
    - _Requirements: 11.1, 11.2_

  - [~] 7.3 Update processPayment to include discount data
    - Modify order payload to include discount fields from cartSlice
    - Map discount state to Order DTO structure (originalAmount, discountAmount, discountType, etc.)
    - Map item-level discounts to OrderItem DTO structure
    - Clear discounts from cart after successful payment
    - _Requirements: 5.4, 6.3, 7.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 7.4 Write component tests for POSPage discount features
    - Test discount button visibility and click behavior
    - Test discount display in cart summary
    - Test order payload includes discount data
    - Test discount clearing after payment
    - _Requirements: 5.5, 11.1_

- [ ] 8. Frontend: Create RefundModal component
  - [~] 8.1 Create RefundModal component
    - Create `frontend/src/components/refunds/RefundModal.jsx`
    - Implement modal with form fields: Order ID, Refund Amount, Refund Reason, Payment Type
    - Props: `open`, `onClose`, `onSave`
    - Add state management for form values and validation errors
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

  - [~] 8.2 Add order lookup and display
    - Add Order ID input with search/autocomplete functionality
    - Display order details when order is selected (items, original amount, payment type)
    - Pre-fill refund amount with order total (editable for partial refunds)
    - Default payment type to match original order payment type
    - _Requirements: 1.1, 2.1, 2.2, 12.1, 12.2_

  - [~] 8.3 Implement refund amount controls
    - Add editable amount input for partial refunds
    - Display original order amount and remaining value calculation
    - Show warning if amount exceeds order total
    - Format amounts with currency symbol and 2 decimal places
    - _Requirements: 2.1, 2.2, 2.3, 4.2_

  - [~] 8.4 Add refund reason textarea with validation
    - Create textarea for refund reason
    - Implement real-time character count (minimum 10 characters)
    - Display validation error if reason is too short
    - Make reason field required
    - _Requirements: 1.3_

  - [~] 8.5 Implement payment type selector with authorization
    - Add payment type dropdown (CASH, CARD, UPI, MOBILE_PAYMENT)
    - Default to original order payment type
    - Show authorization note field if payment type is changed
    - Check user role and show warning if cashier attempts to change payment type
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [~] 8.6 Add Save and Cancel handlers
    - Validate all fields before submission
    - Dispatch `createRefund` thunk with form data
    - Show success/error toast messages
    - Close modal on successful creation
    - Handle validation errors from backend
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [ ]* 8.7 Write component tests for RefundModal
    - Test form field rendering and validation
    - Test order lookup and display
    - Test amount validation (positive, <= order total)
    - Test reason validation (min 10 characters)
    - Test payment type authorization logic
    - Test save and cancel actions
    - _Requirements: 1.3, 1.6, 1.7, 2.3_

- [ ] 9. Frontend: Create RefundsPage component
  - [~] 9.1 Create RefundsPage component structure
    - Create `frontend/src/pages/RefundsPage.jsx`
    - Set up page layout with header, filters section, and table section
    - Add "Create Refund" button in page header
    - Initialize local state for modal open/close and filter values
    - _Requirements: 3.1, 10.1, 10.2_

  - [~] 9.2 Implement refunds table
    - Create table with columns: Refund ID, Order ID, Amount, Reason, Cashier Name, Timestamp, Payment Type
    - Format monetary amounts with currency symbol (₹) and 2 decimal places
    - Format timestamps in readable date-time format (e.g., "Jan 15, 2025 10:30 AM")
    - Display original amount alongside refunded amount
    - Add visual grouping/highlighting for multiple refunds on same order
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 13.2, 13.3_

  - [~] 9.3 Implement filter controls
    - Add Cashier dropdown filter with user list
    - Add Branch dropdown filter with branch list
    - Add Shift dropdown filter with shift list
    - Add Date range picker (start date and end date inputs)
    - Add "Clear Filters" button to reset all filters
    - Update Redux store when filters change
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [~] 9.4 Add role-based data filtering
    - Fetch user role from auth slice
    - If CASHIER: filter refunds to only show current user's refunds
    - If BRANCH_MANAGER: filter refunds to current branch
    - If STORE_MANAGER or ADMIN: show all refunds
    - _Requirements: 10.4, 10.5, 10.6_

  - [~] 9.5 Integrate RefundModal
    - Add RefundModal component to RefundsPage
    - Wire up modal open/close handlers
    - Wire up modal onSave to dispatch createRefund thunk
    - Show success/error toast messages after refund creation
    - Refresh refunds list after successful creation
    - _Requirements: 1.2, 1.4, 1.5_

  - [~] 9.6 Add loading and error states
    - Show loading spinner while fetching refunds
    - Display error message if fetch fails
    - Show "No refunds found" message when list is empty
    - Disable filter controls during loading
    - _Requirements: 3.1, 3.7_

  - [ ]* 9.7 Write component tests for RefundsPage
    - Test table rendering with refund data
    - Test filter controls and filter application
    - Test role-based data visibility
    - Test "Create Refund" button and modal interaction
    - Test loading and error states
    - _Requirements: 3.1, 4.1, 10.4, 10.5, 10.6_

- [~] 10. Checkpoint - Ensure frontend components are functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration: Add Refunds route to application
  - [~] 11.1 Add Refunds route to router configuration
    - Add route definition in `frontend/src/routes` or main router file
    - Path: `/refunds`
    - Component: `RefundsPage`
    - Add role-based protection (CASHIER, BRANCH_MANAGER, STORE_MANAGER, ADMIN)
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 11.2 Add Refunds link to sidebar navigation
    - Update sidebar component to include "Refunds" navigation item
    - Add appropriate icon for refunds
    - Show link only to users with appropriate roles
    - Highlight active route when on Refunds page
    - _Requirements: 10.1, 10.2_

- [ ] 12. Integration: Update shift reporting to include refunds
  - [~] 12.1 Enhance shift report calculation to include refund data
    - Modify shift report generation to fetch refunds for the shift
    - Calculate total refund amount for the shift
    - Calculate refund count for the shift
    - Subtract total refunds from gross sales to get net sales
    - Group refunds by payment type for reconciliation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write integration tests for shift report with refunds
    - Test shift report includes refund totals
    - Test net sales calculation (gross - refunds)
    - Test refund grouping by payment type
    - Test shift report with no refunds
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Integration: Add refund history to Order detail view
  - [~] 13.1 Create RefundHistory component
    - Create component to display refund history for an order
    - Show list of all refunds with amount, reason, cashier, timestamp
    - Display total refunded amount
    - Show "No refunds processed for this order" message if empty
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [~] 13.2 Integrate RefundHistory into Order detail page/modal
    - Add RefundHistory component to order detail view
    - Fetch refunds for the order when order is loaded
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 14. Error handling and user feedback
  - [~] 14.1 Add comprehensive error handling to frontend
    - Add try-catch blocks in all async thunk handlers
    - Display user-friendly error messages using toast notifications
    - Handle specific error messages from backend (validation, authorization, etc.)
    - Handle network errors and session expiration
    - _Requirements: 1.6, 1.7, 5.6, 6.4, 7.6, 15.4_

  - [~] 14.2 Add loading states and disabled button handling
    - Show loading spinners during async operations
    - Disable form buttons during submission
    - Display loading overlay in modals during validation
    - Prevent double-submission of forms
    - _Requirements: 1.2, 1.5, 5.1, 6.1_

  - [ ]* 14.3 Write integration tests for error handling
    - Test refund creation with invalid amount
    - Test refund creation without active shift
    - Test discount application exceeding limits
    - Test manager authorization requirement
    - Test network error handling
    - _Requirements: 1.6, 1.7, 5.6, 6.4, 15.4_

- [ ] 15. Final integration and end-to-end testing
  - [~] 15.1 Test complete refund workflow end-to-end
    - Create order in POS
    - Navigate to Refunds page
    - Create full refund for the order
    - Verify refund appears in table
    - Verify refund reflects in shift report
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_

  - [~] 15.2 Test complete discount workflow end-to-end
    - Add items to cart in POS
    - Apply order-level percentage discount
    - Verify total calculation
    - Process payment
    - Verify order saved with discount information
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 8.1, 8.4_

  - [~] 15.3 Test item-level discount workflow
    - Add items to cart in POS
    - Apply item-level discounts to specific items
    - Verify per-item price calculations
    - Process payment
    - Verify order saved with item discount information
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3_

  - [~] 15.4 Test authorization and role-based access
    - Test cashier cannot apply high discounts without authorization
    - Test manager can apply high discounts
    - Test cashier sees only their refunds
    - Test manager sees branch refunds
    - Test admin sees all refunds
    - _Requirements: 10.4, 10.5, 10.6, 15.1, 15.2, 15.3, 15.4_

  - [ ]* 15.5 Write end-to-end integration tests
    - Test complete refund creation and retrieval flow
    - Test complete discount application and order creation flow
    - Test filtering and search functionality
    - Test role-based access control
    - _Requirements: All requirements_

- [~] 16. Final checkpoint - Ensure all functionality is working correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The backend Refund API is already fully implemented (RefundController, RefundService, RefundDTO, Refund entity)
- Focus is on frontend implementation (React + Redux) with minimal backend entity extensions
- Checkpoints ensure incremental validation at reasonable breakpoints
- Testing strategy uses snapshot tests for UI components, example-based unit tests for validation logic, and integration tests for API interactions
- Property-based testing is not applicable for this feature (UI rendering, CRUD operations, external dependencies)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["2.1", "3.2", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.3", "4.2", "6.1"] },
    { "id": 3, "tasks": ["3.4", "4.3", "6.2", "6.3"] },
    { "id": 4, "tasks": ["6.4", "6.5", "8.1"] },
    { "id": 5, "tasks": ["6.6", "7.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["7.2", "8.4", "8.5", "9.1"] },
    { "id": 7, "tasks": ["7.3", "8.6", "9.2"] },
    { "id": 8, "tasks": ["7.4", "8.7", "9.3", "9.4"] },
    { "id": 9, "tasks": ["9.5", "9.6", "11.1"] },
    { "id": 10, "tasks": ["9.7", "11.2", "12.1", "13.1"] },
    { "id": 11, "tasks": ["12.2", "13.2", "14.1"] },
    { "id": 12, "tasks": ["14.2", "14.3", "15.1"] },
    { "id": 13, "tasks": ["15.2", "15.3", "15.4"] },
    { "id": 14, "tasks": ["15.5"] }
  ]
}
```
