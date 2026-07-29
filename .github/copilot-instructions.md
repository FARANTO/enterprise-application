# Project: Multi-Tenant POS/ERP Frontend

## System overview
Frontend for a multi-tenant SaaS POS + ERP system. A "Store" is the tenant; each Store has one or
more "Branches" (physical locations). Most operational data is scoped to a Store, and further to a
Branch. A user's JWT carries storeId, branchId (if applicable), and role. Backend source lives in
this same workspace at `Enterprise SaaS Application/Enterprise-Saas-Application/src/main/java/com/Anto/`
— reference it with #file:/#codebase instead of guessing endpoint paths or DTO shapes.

## Stack (already installed — don't change these choices)
- React 19, Vite, ESLint (not Oxlint)
- React Router 8 — the `react-router-dom` package no longer exists in v8. Import
  `RouterProvider`/`HydratedRouter`/`BrowserRouter` from `react-router/dom`; import everything else
  (`Routes`, `Route`, `Link`, `useNavigate`, other hooks) from `react-router`. Never import from
  `react-router-dom`.
- Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) — createSlice + createAsyncThunk for all server
  state, no hand-written action types/reducers.
- Axios for HTTP.
- Tailwind CSS 4 + DaisyUI 5 — already configured; don't touch Tailwind/Vite config files.
- shadcn/ui pattern in `src/components/ui/` (button.jsx already exists) — this is the PRIMARY
  component system. For any new interactive component (table, dialog, select, dropdown, tabs,
  badge, input) add it the same way the existing ones were added (`npx shadcn@latest add <name>`)
  rather than hand-rolling one, then compose app-specific components on top of it.
- DaisyUI is for supplementary utility/theming classes only — never apply DaisyUI component classes
  (btn, card, modal, alert) to an element that's also a shadcn/cva-based component.
- Lucide React for all icons.
- react-toastify for all notifications (already installed) — don't add a second toast library.
- Path alias `@/` → `src/` — use it in every new import.

## Roles (CONFIRM exact values from com.Anto.domain before trusting this)
ROLE_ADMIN, ROLE_CASHIER, [confirm any others in the real enum]

## Core entities (verify exact fields against payload/ DTOs before coding a slice)
- User — id, username, role, storeId, branchId
- Store — id, name (tenant root)
- Branch — id, name, storeId, manager, workingHours, contact
- Category — id, name, storeId
- Product — id, sku, name, mrp, sellingPrice, brand, categoryId, storeId
- Inventory — id, productId, branchId, quantity (bridges Product <-> Branch)
- Order — id, branchId, cashierId, customerId, items[], totalAmount, status, createdAt
- OrderItem — id, orderId, productId, quantity, priceAtSale
- Customer — id, name, contact, purchaseHistory
- ShiftReport — id, cashierId, branchId, totalSales, totalRefunds, netSales, topProducts[], openedAt, closedAt
- Refund — id, orderId, amount, reason, shiftReportId

## Folder structure (extends what already exists — don't restructure existing folders)
src/
  api/                    # NEW — axiosClient.js
  app/                    # NEW — store.js
  features/               # NEW — auth/ branches/ categories/ products/ inventory/ customers/
                          #        cart/ orders/ shiftReports/ refunds/
  components/
    ui/                   # EXISTING — shadcn primitives, add more via CLI
    layout/               # NEW — AppLayout, Sidebar, TopBar, BranchSwitcher
  lib/                    # EXISTING utils.js (cn()) — add formatCurrency, roleCheck helpers here
  pages/                  # NEW — one per route
  routes/                 # NEW — AppRoutes.jsx, ProtectedRoute.jsx, RequireRole.jsx
  assets/                 # EXISTING

## Conventions
- Every async server call is a createAsyncThunk inside its feature slice, never fetched directly in
  a component. Every slice has status: 'idle'|'loading'|'succeeded'|'failed' and error.
- Shared axios instance attaches the JWT via request interceptor; response interceptor logs out on 401.
- Multi-tenancy is implicit: never let the UI construct/send a storeId or branchId that didn't come
  from the logged-in user's own profile/token, unless their role is explicitly allowed to manage
  other branches/stores.
- Gate the POS/checkout screen behind an "open shift" check.
- One processPayment(method, orderId) thunk abstracts Stripe vs SSLCommerz — components never branch
  on provider.
- RequireRole wrapper gates admin-only routes/UI.
- Ask before adding any new npm dependency not already listed above (e.g. a validation library, chart library).

## What NOT to do
- Don't invent endpoint paths, DTO field names, or enum values — check the real backend files first.
- Don't import from 'react-router-dom' (removed in v8).
- Don't mix DaisyUI component classes onto shadcn components.
- Don't add a second toast or component library.
- Don't let a Cashier see another branch's data, or a non-super-admin see another store's data.