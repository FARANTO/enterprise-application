import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryByBranch, createInventory, updateInventory } from '@/features/inventory/inventorySlice';
import { fetchProductsByStore } from '@/features/products/productsSlice';
import { fetchStores, fetchBranchesByStore } from '@/features/stores/storesSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

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
  const role = user?.role || user?.Role || '';
  const isAdmin = role === 'ROLE_ADMIN';
  const isStoreAdmin = role === 'ROLE_STORE_ADMIN';
  const isStoreManager = role === 'ROLE_STORE_MANAGER';
  const isBranchManager = role === 'ROLE_BRANCH_MANAGER';
  const isInventoryManager = isAdmin || isStoreAdmin || isStoreManager || isBranchManager;
  const initialStoreId = user?.storeId ? String(user.storeId) : '';
  const initialBranchId = user?.branchId ? String(user.branchId) : '';
  const canChangeStore = isAdmin;
  const canChangeBranch = isAdmin || isStoreAdmin || isStoreManager;

  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({ productId: '', quantity: '', inventoryId: null });
  const [inventoryMode, setInventoryMode] = useState('create');

  const inventory = useSelector((state) => state.inventory.items || []);
  const status = useSelector((state) => state.inventory.status);
  const products = useSelector((state) => state.products.items || []);
  const stores = useSelector((state) => state.stores.items || []);
  const branches = useSelector((state) => state.stores.branches || []);

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  useEffect(() => {
    if (isBranchManager && initialBranchId) {
      const branch = branches.find((b) => String(b.id) === initialBranchId);
      if (branch) {
        setSelectedBranchId(initialBranchId);
        setSelectedStoreId(String(branch.store?.id || initialStoreId));
        return;
      }
    }

    if ((isStoreManager || isStoreAdmin) && initialStoreId) {
      setSelectedStoreId(initialStoreId);
      return;
    }

    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(String(stores[0].id));
    }
  }, [stores, selectedStoreId, branches, initialBranchId, initialStoreId, isBranchManager, isStoreManager, isStoreAdmin]);

  useEffect(() => {
    if (selectedStoreId) {
      dispatch(fetchBranchesByStore(Number(selectedStoreId)));
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
    }
  }, [selectedStoreId, dispatch]);

  useEffect(() => {
    if (!selectedBranchId && initialBranchId && branches.length > 0) {
      setSelectedBranchId(initialBranchId);
    }
    if (!selectedBranchId && !initialBranchId && branches.length > 0) {
      setSelectedBranchId(String(branches[0].id));
    }
  }, [branches, initialBranchId, selectedBranchId]);

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
  const selectedStore = stores.find((store) => String(store.id) === selectedStoreId);
  const inventoryProductIds = new Set(inventory.map((item) => item.productId));
  const availableProducts = products.filter((product) => !inventoryProductIds.has(product.id));

  function openInventoryModal(item) {
    if (!isInventoryManager) return;
    if (!selectedBranchId) {
      toast.error('Choose a branch before adjusting inventory.');
      return;
    }
    if (isBranchManager && initialBranchId && selectedBranchId !== initialBranchId) {
      toast.error('Branch managers can only adjust inventory for their own branch.');
      return;
    }
    if (item) {
      setInventoryForm({ productId: String(item.productId), quantity: String(item.quantity ?? 0), inventoryId: item.id });
      setInventoryMode('update');
    } else {
      setInventoryForm({ productId: availableProducts[0]?.id ? String(availableProducts[0].id) : '', quantity: '0', inventoryId: null });
      setInventoryMode('create');
    }
    setInventoryModalOpen(true);
  }

  function closeInventoryModal() {
    setInventoryModalOpen(false);
    setInventoryForm({ productId: '', quantity: '', inventoryId: null });
    setInventoryMode('create');
  }

  async function submitInventory() {
    if (!selectedBranchId) {
      return toast.error('Select a branch before updating inventory.');
    }
    const productId = Number(inventoryForm.productId);
    const quantityValue = Number(inventoryForm.quantity);
    if (!productId || Number.isNaN(quantityValue) || quantityValue < 0) {
      return toast.error('Enter a valid quantity.');
    }
    try {
      if (inventoryMode === 'create') {
        await dispatch(createInventory({ branchId: Number(selectedBranchId), productId, quantity: quantityValue })).unwrap();
        toast.success('Stock record created.');
      } else if (inventoryForm.inventoryId) {
        await dispatch(updateInventory({ id: Number(inventoryForm.inventoryId), inventoryDTO: { quantity: quantityValue } })).unwrap();
        toast.success('Inventory quantity updated.');
      }
      closeInventoryModal();
      dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
    } catch (err) {
      toast.error(err?.toString?.() || 'Failed to save inventory.');
    }
  }

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
            disabled={!canChangeStore}
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
            disabled={!branches.length || !canChangeBranch}
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
          {isInventoryManager && selectedBranchId && (
            <Button onClick={() => openInventoryModal(null)}>Add or adjust branch stock</Button>
          )}
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
              {isInventoryManager && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.product?.name || `Product ${item.productId}`}</td>
                <td className="px-4 py-3">{item.product?.sku || '—'}</td>
                <td className="px-4 py-3">{item.quantity ?? 0}</td>
                {isInventoryManager && (
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => openInventoryModal(item)}>Adjust</Button>
                  </td>
                )}
              </tr>
            ))}
            {!inventory.length && status !== 'loading' && (
              <tr>
                <td colSpan={isInventoryManager ? "4" : "3"} className="px-4 py-6 text-center text-sm text-muted-foreground">No inventory records found for this branch.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {inventoryModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-full max-w-md rounded-lg bg-card p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{inventoryMode === 'create' ? 'Add Stock' : 'Update Inventory'}</h2>
              <p className="text-sm text-muted-foreground">{inventoryMode === 'create' ? 'Create a new inventory item for this branch.' : 'Update quantity for this product.'}</p>
            </div>
            <Button variant="outline" onClick={closeInventoryModal}>Close</Button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium">Store</label>
              <div className="mt-1 text-sm text-muted-foreground">{selectedStore?.name || `Store ${selectedStoreId || 'N/A'}`}</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Branch</label>
              <div className="mt-1 text-sm text-muted-foreground">{selectedBranch?.name || `Branch ${selectedBranchId || 'N/A'}`}</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Product</label>
              <select
                value={inventoryForm.productId}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, productId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                disabled={inventoryMode === 'update'}
              >
                <option value="">Select product</option>
                {inventoryMode === 'create' ? (
                  availableProducts.length > 0 ? (
                    availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>{product.name || product.sku || `Product ${product.id}`}</option>
                    ))
                  ) : (
                    <option value="">No products available to stock</option>
                  )
                ) : (
                  <option value={inventoryForm.productId}>{products.find((product) => String(product.id) === inventoryForm.productId)?.name || 'Selected product'}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input
                type="number"
                min="0"
                value={inventoryForm.quantity}
                onChange={(e) => setInventoryForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeInventoryModal}>Cancel</Button>
              <Button onClick={submitInventory}>{inventoryMode === 'create' ? 'Create Stock' : 'Save Quantity'}</Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
    );
}

