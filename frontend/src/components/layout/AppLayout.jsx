import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Building2, Box, FileText, LogOut, Menu, ShoppingCart, Users, UserCog } from 'lucide-react';
import { logout } from '@/features/auth/authSlice';

const ROLE_ADMIN = 'ROLE_ADMIN';
const ROLE_STORE_ADMIN = 'ROLE_STORE_ADMIN';
const ROLE_BRANCH_CASHIER = 'ROLE_BRANCH_CASHIER';
const ROLE_BRANCH_MANAGER = 'ROLE_BRANCH_MANAGER';
const ROLE_STORE_MANAGER = 'ROLE_STORE_MANAGER';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const user = authUser || getStoredUser();

  const role = user?.role || user?.Role;
  const storeName = user?.storeName || (user?.storeId ? `Store ${user.storeId}` : '—');
  const branchName = user?.branchName || (user?.branchId ? `Branch ${user.branchId}` : '—');

  const items = [
    { key: 'pos', label: 'POS', icon: ShoppingCart, roles: [ROLE_BRANCH_CASHIER, ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/pos' },
    { key: 'products', label: 'Products', icon: Box, roles: [ROLE_BRANCH_CASHIER, ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/products' },
    { key: 'inventory', label: 'Inventory', icon: Box, roles: [ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/inventory' },
    { key: 'customers', label: 'Customers', icon: Users, roles: [ROLE_BRANCH_CASHIER, ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/customers' },
    { key: 'orders', label: 'Orders', icon: FileText, roles: [ROLE_BRANCH_CASHIER, ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/orders' },
    { key: 'shift', label: 'Shift', icon: FileText, roles: [ROLE_BRANCH_CASHIER, ROLE_BRANCH_MANAGER], to: '/app/shift' },
    { key: 'reports', label: 'Reports', icon: FileText, roles: [ROLE_BRANCH_MANAGER, ROLE_STORE_MANAGER, ROLE_STORE_ADMIN, ROLE_ADMIN], to: '/app/reports' },
    { key: 'employees', label: 'Employees', icon: UserCog, roles: [ROLE_ADMIN], to: '/app/employees' },
    { key: 'stores', label: 'Stores', icon: Building2, roles: [ROLE_ADMIN], to: '/app/stores' },
  ];

  const visible = items.filter((item) => !item.roles || item.roles.includes(role));

  function doLogout() {
    dispatch(logout());
    navigate('/login');
  }

  const branches = user?.branches || (user?.assignedBranches || null);
  const [activeBranch, setActiveBranch] = useState(() => user?.branchId || null);
  const [collapsed, setCollapsed] = useState(false);

  function onSwitchBranch(newBranchId) {
    setActiveBranch(newBranchId);
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.branchId = newBranchId;
      localStorage.setItem('user', JSON.stringify(stored));
    } catch (err) {
      void err;
    }
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={`border-r bg-card/80 transition-all duration-300 ${collapsed ? 'w-18' : 'w-64'}`}>
        <div className="flex items-center justify-between px-4 py-5">
          <div className="min-w-0">
            {!collapsed && <h3 className="truncate text-lg font-semibold">{storeName}</h3>}
            {!collapsed && <p className="truncate text-sm text-muted-foreground">{branchName}</p>}
          </div>
          <button aria-label="Toggle menu" onClick={() => setCollapsed((value) => !value)} className="rounded-md p-2 hover:bg-muted">
            <Menu className="size-4" />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-2">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => navigate(item.to)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-muted">
                <Icon className="size-4" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-2">
          <Button variant="ghost" onClick={doLogout} className="flex w-full items-center gap-2">
            <LogOut className="size-4" />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      <div className="flex-1 p-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {user?.fullName || user?.FullName || user?.email || user?.Email || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{role || 'User'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{storeName} • {branchName}</span>
            {branches && Array.isArray(branches) && (
              <select value={activeBranch || ''} onChange={(event) => onSwitchBranch(Number(event.target.value))} className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name || `Branch ${branch.id}`}</option>
                ))}
              </select>
            )}
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
