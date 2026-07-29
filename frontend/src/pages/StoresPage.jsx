import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBranch, createStore, fetchBranchesByStore, fetchStores, deleteStore, deleteBranch, fetchAllBranches } from '@/features/stores/storesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

export default function StoresPage() {
  const dispatch = useDispatch();
  const { items, branches, allBranches, status, error } = useSelector((state) => state.stores);
  const [storeForm, setStoreForm] = useState({ name: '', brand: '', description: '', storeType: 'retail', address: '', phone: '', email: '' });
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', email: '', storeId: '' });

  useEffect(() => {
    dispatch(fetchStores());
    dispatch(fetchAllBranches());
  }, [dispatch]);

  useEffect(() => {
    if (branchForm.storeId) {
      dispatch(fetchBranchesByStore(branchForm.storeId));
    }
  }, [branchForm.storeId, dispatch]);

  async function handleCreateStore(event) {
    event.preventDefault();
    if (!storeForm.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    try {
      await dispatch(createStore({
        name: storeForm.name.trim(),
        brand: storeForm.brand.trim(),
        description: storeForm.description.trim(),
        storeType: storeForm.storeType,
        contact: {
          address: storeForm.address.trim(),
          phone: storeForm.phone.trim(),
          email: storeForm.email.trim(),
        },
      })).unwrap();
      toast.success('Store created');
      setStoreForm({ name: '', brand: '', description: '', storeType: 'retail', address: '', phone: '', email: '' });
      dispatch(fetchStores());
    } catch (err) {
      toast.error(err || 'Unable to create store');
    }
  }

  async function handleCreateBranch(event) {
    event.preventDefault();
    if (!branchForm.storeId) {
      toast.error('Select a store first');
      return;
    }
    if (!branchForm.name.trim()) {
      toast.error('Branch name is required');
      return;
    }

    try {
      await dispatch(createBranch({
        name: branchForm.name.trim(),
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim(),
        email: branchForm.email.trim(),
        storeId: Number(branchForm.storeId),
      })).unwrap();
      toast.success('Branch created');
      setBranchForm((current) => ({ ...current, name: '', address: '', phone: '', email: '' }));
      dispatch(fetchBranchesByStore(branchForm.storeId));
      dispatch(fetchAllBranches());
    } catch (err) {
      toast.error(err || 'Unable to create branch');
    }
  }

  async function handleDeleteStore(id) {
    if (!window.confirm('Delete this store? All associated data may be affected.')) return;
    try {
      await dispatch(deleteStore(id)).unwrap();
      toast.success('Store deleted');
      dispatch(fetchStores());
      dispatch(fetchAllBranches());
    } catch (err) {
      toast.error(err || 'Failed to delete store');
    }
  }

  async function handleDeleteBranch(id) {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await dispatch(deleteBranch(id)).unwrap();
      toast.success('Branch deleted');
      if (branchForm.storeId) dispatch(fetchBranchesByStore(branchForm.storeId));
      dispatch(fetchAllBranches());
    } catch (err) {
      toast.error(err || 'Failed to delete branch');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* ───────── Left column: forms ───────── */}
      <div className="space-y-6">
        {/* Create store */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Stores &amp; Branches</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create stores and link branches to them.</p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateStore}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store name</Label>
                <Input id="storeName" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} placeholder="North Plaza" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" value={storeForm.brand} onChange={(e) => setStoreForm({ ...storeForm, brand: e.target.value })} placeholder="Anto Retail" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">Description</Label>
              <Input id="storeDescription" value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} placeholder="Main store for retail operations" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Address</Label>
                <Input id="storeAddress" value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">Phone</Label>
                <Input id="storePhone" value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} placeholder="+8801..." />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Email</Label>
                <Input id="storeEmail" value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} placeholder="store@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeType">Store type</Label>
                <select id="storeType" value={storeForm.storeType} onChange={(e) => setStoreForm({ ...storeForm, storeType: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm">
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="franchise">Franchise</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={status === 'loading'}>Create store</Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </div>

        {/* Create branch */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create branch</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreateBranch}>
            <div className="space-y-2">
              <Label htmlFor="storeSelect">Store</Label>
              <select id="storeSelect" value={branchForm.storeId} onChange={(e) => setBranchForm({ ...branchForm, storeId: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm">
                <option value="">Select a store</option>
                {items.map((store) => (
                  <option key={store.id} value={store.id}>
                    ID {store.id} — {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchName">Branch name</Label>
              <Input id="branchName" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Downtown Branch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Address</Label>
              <Input id="branchAddress" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="45 Market Street" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branchPhone">Phone</Label>
                <Input id="branchPhone" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="+8801..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchEmail">Email</Label>
                <Input id="branchEmail" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} placeholder="branch@example.com" />
              </div>
            </div>
            <Button type="submit">Create branch</Button>
          </form>
        </div>
      </div>

      {/* ───────── Right column: lists ───────── */}
      <div className="space-y-6">
        {/* Store list */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">All Stores</h2>
          <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stores created yet.</p>
            ) : (
              items.map((store) => (
                <div key={store.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{store.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Store ID: <span className="font-mono font-semibold">{store.id}</span>
                      {store.brand && <> &bull; {store.brand}</>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {store.storeType && <span className="uppercase tracking-wide">{store.storeType}</span>}
                      {store.status && <> &bull; {store.status}</>}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteStore(store.id)}>Delete</Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Branch list for selected store */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Branches for selected store</h2>
          <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto">
            {branches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Choose a store above to view its branches.</p>
            ) : (
              branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{branch.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Branch ID: <span className="font-mono font-semibold">{branch.id}</span>
                      {branch.storeId && <> &bull; Store #{branch.storeId}</>}
                    </div>
                    <div className="text-xs text-muted-foreground">{branch.address || 'No address'} &bull; {branch.phone || 'No phone'}</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteBranch(branch.id)}>Delete</Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* All branches overview */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">All Branches (all stores)</h2>
          <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto">
            {allBranches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branches exist yet.</p>
            ) : (
              allBranches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{branch.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Branch ID: <span className="font-mono font-semibold">{branch.id}</span>
                      {branch.storeId && <> &bull; Store #{branch.storeId}</>}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteBranch(branch.id)}>Delete</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
