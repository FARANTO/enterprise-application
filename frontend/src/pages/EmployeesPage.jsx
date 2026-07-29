import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, fetchEmployees, deleteEmployee } from '@/features/employees/employeesSlice';
import { fetchStores, fetchAllBranches } from '@/features/stores/storesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

const ROLE_OPTIONS = [
  { value: 'ROLE_BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'ROLE_BRANCH_CASHIER', label: 'Cashier' },
];

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.employees);
  const { items: stores, allBranches } = useSelector((state) => state.stores);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'ROLE_BRANCH_MANAGER',
    storeId: '',
    branchId: '',
  });

  useEffect(() => {
    dispatch(fetchStores());
    dispatch(fetchAllBranches());
  }, [dispatch]);

  // When stores arrive and no store selected yet, pick first
  useEffect(() => {
    if (!form.storeId && stores.length > 0) {
      setForm((current) => ({ ...current, storeId: String(stores[0].id) }));
    }
  }, [stores, form.storeId]);

  // When a store is picked, load employees for that store
  useEffect(() => {
    if (form.storeId) {
      dispatch(fetchEmployees(Number(form.storeId)));
    }
  }, [form.storeId, dispatch]);

  const filteredBranches = form.storeId
    ? allBranches.filter((b) => String(b.storeId) === String(form.storeId))
    : allBranches;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Please fill out the employee form');
      return;
    }

    if (!form.storeId) {
      toast.error('Select a store to assign this employee');
      return;
    }

    if (!form.email.toLowerCase().endsWith('@manager.com') && !form.email.toLowerCase().endsWith('@cashier.com')) {
      toast.error('Use an email ending with @manager.com or @cashier.com');
      return;
    }

    try {
      await dispatch(
        createEmployee({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          storeId: Number(form.storeId),
          branchId: form.branchId ? Number(form.branchId) : null,
        })
      ).unwrap();
      toast.success('Employee created');
      setForm({ ...form, fullName: '', email: '', password: '' });
      // Refresh employee list
      dispatch(fetchEmployees(Number(form.storeId)));
    } catch (err) {
      toast.error(err || 'Failed to create employee');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      toast.success('Employee deleted');
    } catch (err) {
      toast.error(err || 'Failed to delete employee');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Create employee form */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create branch managers and cashiers for your stores.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@manager.com" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a secure password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm">
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empStore">Assign to Store</Label>
              <select id="empStore" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value, branchId: '' })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm">
                <option value="">Select a store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>ID {s.id} — {s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empBranch">Assign to Branch</Label>
              <select id="empBranch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm">
                <option value="">Select a branch (optional)</option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>ID {b.id} — {b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating...' : 'Create employee'}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>

      {/* Employee list */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Employee List</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {form.storeId ? `Employees for Store ID ${form.storeId}` : 'Select a store to view employees.'}
        </p>
        <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees found.</p>
          ) : (
            items.map((item, index) => (
              <div key={item?.id || `emp-${index}`} className="flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <div className="font-medium">{item?.fullName || item?.FullName || 'Employee'}</div>
                  <div className="text-sm text-muted-foreground">{item?.email || item?.Email || '—'}</div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span className="uppercase tracking-wide">{item?.role || 'N/A'}</span>
                    {item?.storeId && <span>Store #{item.storeId}</span>}
                    {item?.branchId && <span>Branch #{item.branchId}</span>}
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
