import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByStore } from '@/features/products/productsSlice';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { fetchStores, fetchBranchesByStore } from '@/features/stores/storesSlice';
import { getCurrentShift } from '@/features/shiftReports/shiftReportsSlice';
import { addItem, removeItem, setQty, selectCartTotals, processPayment, holdOrder, resumeOrder, clearDiscounts, applyOrderDiscount, applyItemDiscount } from '@/features/cart/cartSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import DiscountModal from '@/components/pos/DiscountModal';
import ReceiptModal from '@/components/ReceiptModal';

function getCurrentUser(){ try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }

export default function POSPage(){
  const dispatch = useDispatch();
  const user = getCurrentUser();
  const initialStoreId = user?.storeId ? String(user.storeId) : '';
  const initialBranchId = user?.branchId ? String(user.branchId) : '';

  const products = useSelector(s => s.products.items || []);
  const inventory = useSelector(s => s.inventory.items || []);
  const stores = useSelector(s => s.stores.items || []);
  const branches = useSelector(s => s.stores.branches || []);
  const shift = useSelector(s => s.shiftReports.current);
  const cart = useSelector(s => s.cart.items);
  const discount = useSelector(s => s.cart.discount);
  const cartTotals = useSelector(selectCartTotals);
  const cartStatus = useSelector(s => s.cart.status);

  const [query, setQuery] = useState('');
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const role = user?.role || user?.Role || '';
  const isAdmin = role === 'ROLE_ADMIN';
  const isStoreAdmin = role === 'ROLE_STORE_ADMIN';
  const isStoreManager = role === 'ROLE_STORE_MANAGER';
  const isBranchManager = role === 'ROLE_BRANCH_MANAGER';
  const isCashier = role === 'ROLE_BRANCH_CASHIER';
  const canChangeStore = isAdmin || isStoreAdmin || isStoreManager;
  const canChangeBranch = isAdmin || isStoreAdmin || isStoreManager;
  const branchFixed = isBranchManager || isCashier;

  useEffect(() => {
    dispatch(fetchStores());
    dispatch(getCurrentShift());
  }, [dispatch]);

  useEffect(() => {
    if (selectedStoreId) {
      dispatch(fetchProductsByStore(Number(selectedStoreId)));
      dispatch(fetchBranchesByStore(Number(selectedStoreId)));
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
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(String(stores[0].id));
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (selectedBranchId) {
      dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
    }
  }, [selectedBranchId, dispatch]);

  const inventoryMap = useMemo(() => new Map((inventory || []).map(i => [i.productId, i.quantity])), [inventory]);

  const filtered = useMemo(() => {
    if (!query) return products;
    return products.filter(p => (p.name || '').toLowerCase().includes(query.toLowerCase()) || (p.sku || '').toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  function handleAdd(p){
    if (!selectedBranchId) {
      return toast.error('Select a branch before adding products to the cart.');
    }
    const availableQty = inventoryMap.get(p.id);
    const existingQty = cart.find(i => i.productId === p.id)?.quantity || 0;
    if (availableQty == null) {
      return toast.error('Product is not stocked in the selected branch. Add stock from Inventory first.');
    }
    if (availableQty <= 0) {
      return toast.error('Out of stock in this branch. Manager can restock it from Inventory.');
    }
    if (existingQty + 1 > availableQty) {
      return toast.error('You cannot add more than the available quantity for this branch.');
    }
    dispatch(addItem({ product: p, quantity: 1 }));
  }

  async function onCheckout(method){
  if (cart.length === 0) return toast.error('Cart empty');
  if (!selectedBranchId) return toast.error('Select a branch before checkout');
  if (!shift) return toast.error('Open a shift before checkout');

  const orderPayload = {
      totalAmount: cartTotals.finalTotal,
      originalAmount: cartTotals.subtotal,
      discountAmount: cartTotals.discountAmount,
      discountType: discount?.type || null,
      discountPercentage: discount?.type === 'order' && discount.orderDiscount.mode === 'percentage' ? discount.orderDiscount.value : null,
      discountFlat: discount?.type === 'order' && discount.orderDiscount.mode === 'flat' ? discount.orderDiscount.value : null,
      branchId: Number(selectedBranchId),
      storeId: selectedStoreId ? Number(selectedStoreId) : null,
      customerId: null,
      paymentType: method,
      items: cart.map(i => ({ 
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        originalPrice: i.price,
        discountAmount: discount?.itemDiscounts?.[i.productId]?.calculatedAmount || 0,
        discountMode: discount?.itemDiscounts?.[i.productId]?.mode || null,
        discountValue: discount?.itemDiscounts?.[i.productId]?.value || null,
      })),
    };

    try{
      const order = await dispatch(processPayment({ method, orderPayload })).unwrap();
      dispatch(clearDiscounts());
      if (selectedBranchId) {
        dispatch(fetchInventoryByBranch(Number(selectedBranchId)));
      }
      dispatch(getCurrentShift());
      setReceiptOrder(order);
      setReceiptOpen(true);
      toast.success('Payment successful — Order created');
    } catch (err) {
      toast.error(err?.toString?.() || 'Payment failed');
    }
  }

  function onHold(){ dispatch(holdOrder({ name: `Held by ${user?.FullName || user?.Email || 'User'}` })); toast.info('Order held'); }

  function handleApplyDiscount(discountConfig) {
    if (!discountConfig) return;
    if (Array.isArray(discountConfig)) {
      discountConfig.forEach((config) => {
        if (config.productId) {
          dispatch(applyItemDiscount({ productId: config.productId, mode: config.mode, value: config.value }));
        }
      });
    } else if (discountConfig.type === 'order') {
      dispatch(applyOrderDiscount({ mode: discountConfig.mode, value: discountConfig.value }));
    } else if (discountConfig.type === 'item') {
      const { productId, mode, value } = discountConfig;
      dispatch(applyItemDiscount({ productId, mode, value }));
    }
    setDiscountModalOpen(false);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input className="input flex-1 min-w-[220px]" placeholder="Search products" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
        <div className="mb-4 rounded-lg border border-input bg-muted/5 p-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold">Store</span>
              {canChangeStore ? (
                <select
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    setSelectedBranchId('');
                  }}
                  className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name || `Store ${store.id}`}</option>
                  ))}
                </select>
              ) : (
                <span>{stores.find((s) => String(s.id) === selectedStoreId)?.name || selectedStoreId || 'Not selected'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">Branch</span>
              {canChangeBranch ? (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  disabled={!branches.length}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name || `Branch ${branch.id}`}</option>
                  ))}
                </select>
              ) : (
                <span>{branches.find((b) => String(b.id) === selectedBranchId)?.name || selectedBranchId || 'Not selected'}</span>
              )}
            </div>
          </div>
          {!selectedBranchId && (
            <div className="text-xs text-orange-600 mt-2">Select a branch before adding products to the cart.</div>
          )}
          {selectedBranchId && !(branches.find((b) => String(b.id) === selectedBranchId)) && (
            <div className="text-xs text-orange-600 mt-2">Selected branch is unavailable or not yet loaded.</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filtered.map(p => {
            const qty = inventoryMap.get(p.id) ?? null;
            const out = qty !== null && qty <= 0;
            return (
              <div key={p.id} className={`p-3 border rounded ${out ? 'opacity-60' : ''}`}>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.sku}</div>
                <div className="mt-2">₹{p.sellingPrice}</div>
                <div className="mt-2 text-sm text-muted-foreground">Stock: {qty == null ? 'Not stocked' : qty}</div>
                <div className="mt-2 flex gap-2">
                  <Button onClick={()=>handleAdd(p)} disabled={out}>Add</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="col-span-1 border p-3 rounded">
        <h3 className="font-semibold">Cart</h3>
        <div className="space-y-2 my-2">
          {cart.map(i => (
            <div key={i.productId} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{i.product.name}</div>
                <div className="text-sm text-muted-foreground">{i.quantity} x ₹{i.price}</div>
              </div>
              <div className="flex flex-col items-end">
                <input type="number" className="input w-20" value={i.quantity} min={1} onChange={(e)=>{
                  const quantity = Number(e.target.value);
                  if (!Number.isFinite(quantity) || quantity < 1) {
                    return;
                  }
                  const availableQty = inventoryMap.get(i.productId);
                  if (availableQty != null && quantity > availableQty) {
                    toast.error('Quantity exceeds the available stock for this branch.');
                    return;
                  }
                  dispatch(setQty({ productId: i.productId, quantity }));
                }} />
                <Button variant="ghost" onClick={()=>dispatch(removeItem(i.productId))}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div>Items: {cartTotals.totalItems}</div>
          <div>Original Total: ₹{cartTotals.subtotal}</div>
          {cartTotals.discountAmount > 0 && (
            <div className="text-sm text-red-600">Discount: -₹{cartTotals.discountAmount.toFixed(2)} {cartTotals.discountType === 'order' ? `(${discount.orderDiscount.mode})` : ''}</div>
          )}
          <div className="text-lg font-semibold">Final Total: ₹{cartTotals.finalTotal.toFixed(2)}</div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={() => setDiscountModalOpen(true)} disabled={cart.length === 0}>Apply Discount</Button>
          <Button onClick={()=>onCheckout('CASH')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay Cash</Button>
          <Button onClick={()=>onCheckout('CARD')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay Card</Button>
          <Button onClick={()=>onCheckout('UPI')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay UPI</Button>
          <Button variant="outline" onClick={onHold}>Hold</Button>

          {/* Helper message explaining why payment might be disabled */}
          {cart.length === 0 && <div className="text-xs text-muted-foreground mt-2">Add products to the cart to enable payment.</div>}
          {cart.length > 0 && !shift && <div className="text-xs text-orange-600 mt-2">Payments are disabled until a shift is active.</div>}
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Held Orders</h4>
          <HeldOrders />
        </div>
      </div>

      <DiscountModal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        cartItems={cart}
        cartTotals={cartTotals}
        onApply={handleApplyDiscount}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={receiptOrder}
      />
    </div>
  );
}

function HeldOrders(){
  const held = useSelector(s => s.cart.heldOrders || []);
  const dispatch = useDispatch();
  if (!held.length) return <div className="text-sm text-muted-foreground">No held orders</div>;
  return (
    <div className="space-y-2 mt-2">
      {held.map(h => (
        <div key={h.id} className="p-2 border rounded flex items-center justify-between">
          <div>
            <div className="font-medium">{h.name}</div>
            <div className="text-sm text-muted-foreground">{h.items.length} items • ₹{h.totalAmount}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Button onClick={()=>dispatch(resumeOrder(h.id))}>Resume</Button>
          </div>
        </div>
      ))}
    </div>
  );
}