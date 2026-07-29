import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByStore, searchProducts, createProduct, updateProduct, deleteProduct } from '@/features/products/productsSlice';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { createCategory, fetchCategoriesByStore } from '@/features/categories/categoriesSlice';
import { fetchStores, fetchBranchesByStore } from '@/features/stores/storesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-toastify';

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

function ProductFormModal({ open, onClose, initial, onSave, categories = [], stores = [] }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    sku: initial?.sku || '',
    description: initial?.description || '',
    mrp: initial?.mrp ?? '',
    sellingPrice: initial?.sellingPrice ?? '',
    categoryId: initial?.categoryId || '',
    categoryName: '',
    image: initial?.image || '',
    storeId: initial?.storeId || '',
  }));

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit() {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.sku.trim()) return toast.error('SKU is required');
    if (!form.sellingPrice) return toast.error('Selling price is required');
    if (!form.storeId && !initial) return toast.error('Select a store');
    onSave({ ...form, name: form.name.trim(), sku: form.sku.trim(), description: form.description.trim(), image: form.image.trim() });
  }

  return (
    <Dialog key={initial?.id || 'new'} open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit' : 'New'} product</DialogTitle>
          <DialogDescription>Upload a direct imgbb image link and assign the product to a store.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" value={form.sku} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mrp">MRP</Label>
              <Input id="mrp" name="mrp" type="number" value={form.mrp} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling price</Label>
              <Input id="sellingPrice" name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <select id="categoryId" name="categoryId" value={form.categoryId} onChange={handleChange} className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
                <option value="">Select existing category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryName">New category</Label>
              <Input id="categoryName" name="categoryName" value={form.categoryName} onChange={handleChange} placeholder="e.g. Shirts" />
            </div>
          </div>

          {/* Store selector */}
          <div className="grid gap-2">
            <Label htmlFor="storeId">Store</Label>
            <select id="storeId" name="storeId" value={form.storeId} onChange={handleChange} className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">
              <option value="">Select a store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  ID {s.id} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Image URL</Label>
            <Input id="image" name="image" value={form.image} onChange={handleChange} placeholder="https://i.ibb.co/..." />
          </div>
          {form.image && <img src={form.image} alt="preview" className="max-h-40 w-full rounded-xl object-contain" />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? 'Save changes' : 'Create product'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsPage() {
  const dispatch = useDispatch();
  const productsState = useSelector((state) => state.products);
  const inventoryState = useSelector((state) => state.inventory);
  const categoriesState = useSelector((state) => state.categories);
  const storesState = useSelector((state) => state.stores);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const user = getCurrentUser();

  // Load stores on mount
  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  // When stores arrive and no store selected yet, pick first
  useEffect(() => {
    if (!selectedStoreId && storesState.items.length > 0) {
      const first = user?.storeId || storesState.items[0]?.id;
      if (first) setSelectedStoreId(String(first));
    }
  }, [storesState.items, selectedStoreId, user?.storeId]);

  // Fetch products & categories when store changes
  useEffect(() => {
    if (selectedStoreId) {
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
      dispatch(fetchCategoriesByStore(Number(selectedStoreId)));
      dispatch(fetchBranchesByStore(Number(selectedStoreId)));
    }
  }, [selectedStoreId, dispatch]);

  useEffect(() => {
    if (!selectedBranchId && storesState.branches.length > 0) {
      const defaultBranch = user?.branchId && storesState.branches.some((b) => String(b.id) === String(user.branchId))
        ? String(user.branchId)
        : String(storesState.branches[0].id);
      setSelectedBranchId(defaultBranch);
    }
  }, [storesState.branches, selectedBranchId, user?.branchId]);

  // Inventory by selected branch
  useEffect(() => {
    if (selectedBranchId) {
      dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
    }
  }, [selectedBranchId, dispatch]);

  // Search
  useEffect(() => {
    if (query.length >= 3 && selectedStoreId) {
      dispatch(searchProducts({ storeId: Number(selectedStoreId), keyword: query }));
    } else if (query.length === 0 && selectedStoreId) {
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
    }
  }, [query, dispatch, selectedStoreId]);

  const merged = useMemo(() => {
    const inventoryMap = new Map((inventoryState.items || []).map((inv) => [inv.productId, inv.quantity]));
    return (productsState.items || []).map((product) => ({ ...product, quantity: inventoryMap.get(product.id) ?? null }));
  }, [productsState.items, inventoryState.items]);

  const total = merged.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = merged.slice((page - 1) * pageSize, page * pageSize);

  async function onCreate(productForm) {
    try {
      let categoryId = productForm.categoryId ? Number(productForm.categoryId) : null;
      const storeId = productForm.storeId ? Number(productForm.storeId) : Number(selectedStoreId);

      if (!categoryId && productForm.categoryName?.trim()) {
        const createdCategory = await dispatch(createCategory({ name: productForm.categoryName.trim(), storeId })).unwrap();
        categoryId = createdCategory.id;
      }

      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        mrp: Number(productForm.mrp || 0),
        sellingPrice: Number(productForm.sellingPrice || 0),
        image: productForm.image,
        categoryId,
        storeId,
      };

      await dispatch(createProduct(payload)).unwrap();
      setModalOpen(false);
      toast.success('Product created');
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
    } catch (err) {
      toast.error(err?.toString() || 'Failed to create');
    }
  }

  async function onUpdate(productForm) {
    try {
      let categoryId = productForm.categoryId ? Number(productForm.categoryId) : undefined;
      if (!categoryId && productForm.categoryName?.trim()) {
        const createdCategory = await dispatch(createCategory({ name: productForm.categoryName.trim(), storeId: Number(selectedStoreId) })).unwrap();
        categoryId = createdCategory.id;
      }

      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        mrp: Number(productForm.mrp || 0),
        sellingPrice: Number(productForm.sellingPrice || 0),
        image: productForm.image,
        categoryId,
      };

      await dispatch(updateProduct({ id: editing.id, productDTO: payload })).unwrap();
      setModalOpen(false);
      setEditing(null);
      toast.success('Product updated');
    } catch (err) {
      toast.error(err?.toString() || 'Failed to update');
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete product?')) return;
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success('Deleted');
    } catch (err) {
      toast.error(err?.toString() || 'Failed to delete');
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={selectedStoreId}
            onChange={(e) => { setSelectedStoreId(e.target.value); setSelectedBranchId(''); setPage(1); }}
            className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select store</option>
            {storesState.items.map((s) => (
              <option key={s.id} value={s.id}>ID {s.id} — {s.name}</option>
            ))}
          </select>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            disabled={!storesState.branches.length}
          >
            <option value="">Select branch</option>
            {storesState.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name || `Branch ${branch.id}`}</option>
            ))}
          </select>
          <Input placeholder="Search products (3+ chars)" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>New product</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full table-auto text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Store ID</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product.id} className={`${product.quantity !== null && product.quantity <= 5 ? 'bg-red-50/70' : ''}`}>
                <td className="px-4 py-3">{product.image ? <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" /> : '—'}</td>
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.sku}</td>
                <td className="px-4 py-3">₹{product.sellingPrice}</td>
                <td className="px-4 py-3"><span className="font-mono">{product.storeId || '—'}</span></td>
                <td className="px-4 py-3">{product.quantity ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => { setEditing(product); setModalOpen(true); }}>Edit</Button>
                  <Button variant="destructive" onClick={() => onDelete(product.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</div>
        <div className="flex gap-2">
          <Button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1}>Prev</Button>
          <Button onClick={() => setPage((v) => Math.min(pages, v + 1))} disabled={page === pages}>Next</Button>
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initial={editing}
        onSave={editing ? onUpdate : onCreate}
        categories={categoriesState.items || []}
        stores={storesState.items || []}
      />
    </div>
  );
}
