import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { fetchProductsByStore } from '@/features/products/productsSlice';
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
  const branchId = user?.branchId;
  const storeId = user?.storeId;
  const inventory = useSelector((state) => state.inventory.items || []);
  const status = useSelector((state) => state.inventory.status);
  const products = useSelector((state) => state.products.items || []);

  useEffect(() => {
    if (branchId) {
      dispatch(fetchInventoryByBranch(branchId));
    }
    if (storeId) {
      dispatch(fetchProductsByStore(storeId));
    }
  }, [branchId, storeId, dispatch]);

  if (!branchId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Select a branch from the top bar to view inventory.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Showing inventory for branch {branchId}.</p>
        </div>
        <Button variant="outline" onClick={() => dispatch(fetchInventoryByBranch(branchId))}>Refresh</Button>
      </div>

      {status === 'loading' && <div>Loading inventory…</div>}

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
    </div>
  );
}

