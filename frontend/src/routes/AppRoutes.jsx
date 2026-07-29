import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AppLayout from '@/components/layout/AppLayout';

import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import POSPage from '@/pages/POSPage';
import ProductsPage from '@/pages/ProductsPage';
import InventoryPage from '@/pages/InventoryPage';
import OrdersPage from '@/pages/OrdersPage';
import RefundsPage from '@/pages/RefundsPage';
import ShiftPage from '@/pages/ShiftPage';
import ReportsPage from '@/pages/ReportsPage';
import DashboardPage from '@/pages/DashboardPage';
import EmployeesPage from '@/pages/EmployeesPage';
import StoresPage from '@/pages/StoresPage';

import { store } from '@/app/store';

function isAuthenticated() {
  try {
    const state = store.getState();
    const token = state?.auth?.token || localStorage.getItem('token');
    return Boolean(token);
  } catch {
    return Boolean(localStorage.getItem('token'));
  }
}

export function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children || null;
}

export function RequireRole({ roles = [], children }) {
  const state = store.getState();
  let user;
  try {
    user = state?.auth?.user ? state.auth.user : JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  const role = user?.role || user?.Role;
  if (!roles || roles.length === 0) return children;
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/app/pos" replace />;
  return children;
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/pos', element: <Navigate to="/app/pos" replace /> },
  { path: '/products', element: <Navigate to="/app/products" replace /> },
  { path: '/inventory', element: <Navigate to="/app/inventory" replace /> },
  { path: '/customers', element: <Navigate to="/app/pos" replace /> },
  { path: '/orders', element: <Navigate to="/app/orders" replace /> },
  { path: '/shift', element: <Navigate to="/app/shift" replace /> },
  { path: '/reports', element: <Navigate to="/app/reports" replace /> },
  {
    path: '/app',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/app/pos" replace /> },
      { path: 'pos', element: <POSPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'refunds', element: <RequireRole roles={['ROLE_BRANCH_CASHIER', 'ROLE_BRANCH_MANAGER', 'ROLE_STORE_MANAGER', 'ROLE_STORE_ADMIN', 'ROLE_ADMIN']}><RefundsPage /></RequireRole> },
      { path: 'shift', element: <ShiftPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'dashboard', element: <RequireRole roles={['ROLE_ADMIN', 'ROLE_STORE_ADMIN', 'ROLE_STORE_MANAGER']}><DashboardPage /></RequireRole> },
      { path: 'employees', element: <RequireRole roles={['ROLE_ADMIN']}><EmployeesPage /></RequireRole> },
      { path: 'stores', element: <RequireRole roles={['ROLE_ADMIN']}><StoresPage /></RequireRole> },
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
