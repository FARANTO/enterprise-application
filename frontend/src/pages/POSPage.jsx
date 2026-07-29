import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByStore } from '@/features/products/productsSlice';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { getCurrentShift, startShift } from '@/features/shiftReports/shiftReportsSlice';
import { addItem, removeItem, setQty, selectCartTotals, processPayment, holdOrder, resumeOrder } from '@/features/cart/cartSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

function getCurrentUser(){ try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }

export default function POSPage(){
  const dispatch = useDispatch();
  const user = getCurrentUser();
  const storeId = user?.storeId;
  const branchId = user?.branchId;

  const products = useSelector(s => s.products.items || []);
  const inventory = useSelector(s => s.inventory.items || []);
  const shift = useSelector(s => s.shiftReports.current);
  const cart = useSelector(s => s.cart.items);
  const cartTotals = useSelector(selectCartTotals);
  const cartStatus = useSelector(s => s.cart.status);

  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchProductsByStore(storeId));
    if (branchId) dispatch(fetchInventoryByBranch(branchId));
    dispatch(getCurrentShift());
  }, [storeId, branchId, dispatch]);

  const inventoryMap = useMemo(() => new Map((inventory || []).map(i => [i.productId, i.quantity])), [inventory]);

  const filtered = useMemo(() => {
    if (!query) return products;
    return products.filter(p => (p.name || '').toLowerCase().includes(query.toLowerCase()) || (p.sku || '').toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  function handleAdd(p){
    const qty = inventoryMap.get(p.id) ?? null;
    if (qty !== null && qty <= 0) return toast.error('Out of stock');
    dispatch(addItem({ product: p, quantity: 1 }));
  }

  async function onStartShift(){
    try{
      await dispatch(startShift()).unwrap();
      toast.success('Shift started');
    } catch {
      toast.error('Failed to start shift');
    }
  }

  async function onCheckout(method){
    if (cart.length === 0) return toast.error('Cart empty');
    if (!shift) return toast.error('Open a shift before checkout');

    const orderPayload = {
      totalAmount: cartTotals.subtotal,
      branchId: branchId,
      customerId: null,
      paymentType: method,
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
    };

    try{
      await dispatch(processPayment({ method, orderPayload })).unwrap();
      toast.success('Payment successful — Order created');
    } catch {
      toast.error('Payment failed');
    }
  }

  function onHold(){ dispatch(holdOrder({ name: `Held by ${user?.FullName || user?.Email || 'User'}` })); toast.info('Order held'); }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <input className="input" placeholder="Search products" value={query} onChange={e=>setQuery(e.target.value)} />
          {!shift && <Button onClick={onStartShift}>Start Shift</Button>}
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
                <input type="number" className="input w-20" value={i.quantity} min={1} onChange={(e)=>dispatch(setQty({ productId: i.productId, quantity: Number(e.target.value) }))} />
                <Button variant="ghost" onClick={()=>dispatch(removeItem(i.productId))}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div>Items: {cartTotals.totalItems}</div>
          <div className="text-lg font-semibold">Total: ₹{cartTotals.subtotal}</div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={()=>onCheckout('CASH')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay Cash</Button>
          <Button onClick={()=>onCheckout('CARD')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay Card</Button>
          <Button onClick={()=>onCheckout('UPI')} disabled={!shift || cart.length===0 || cartStatus==='loading'}>Pay UPI</Button>
          <Button variant="outline" onClick={onHold}>Hold</Button>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Held Orders</h4>
          <HeldOrders />
        </div>
      </div>
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

