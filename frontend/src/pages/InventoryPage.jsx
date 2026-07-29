import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { fetchProductsByStore } from '@/features/products/productsSlice';
import { fetchStores, fetchBranchesByStore } from '@/features/stores/storesSlice';
import { Button } from '@/components/ui/button';

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function InventoryPage() {
  const dispatch = useDispatch();
  const user = getCurrentUser();
  const initialStoreId = user?.storeId ? String(user.storeId) : '';
  const initialBranchId = user?.branchId ? String(user.branchId) : '';

  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);

  const inventory = useSelector((state) => state.inventory.items || []);
  const status = useSelector((state) => state.inventory.status);
  const products = useSelector((state) => state.products.items || []);
  const stores = useSelector((state) => state.stores.items || []);
  const branches = useSelector((state) => state.stores.branches || []);

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  useEffect(() => {
    if (selectedStoreId) {
      dispatch(fetchBranchesByStore(Number(selectedStoreId)));
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
    }
  }, [selectedStoreId, dispatch]);

  useEffect(() => {
    if (selectedBranchId) {
      dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
    }
  }, [selectedBranchId, dispatch]);

  if (!selectedStoreId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Select a store and branch to view inventory.</p>
      </div>
    );
  }

  const selectedBranch = branches.find((branch) => String(branch.id) === selectedBranchId);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Showing inventory for {selectedBranch ? `${selectedBranch.name}` : 'selected branch'} in store {selectedStoreId}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStoreId}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setSelectedBranchId('');
            }}
            className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name || `Store ${store.id}`}
              </option>
            ))}
          </select>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            disabled={!branches.length}
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name || `Branch ${branch.id}`}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedBranchId) {
                dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {status === 'loading' && <div>Loading inventory…</div>}

      {!selectedBranchId ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Select a branch to see inventory details for that branch.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Available</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.product?.name || `Product ${item.productId}`}</td>
                <td className="px-4 py-3">{item.product?.sku || '—'}</td>
                <td className="px-4 py-3">{item.quantity ?? 0}</td>
              </tr>
            ))}
            {!inventory.length && status !== 'loading' && (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-sm text-muted-foreground">No inventory records found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
    );
}

