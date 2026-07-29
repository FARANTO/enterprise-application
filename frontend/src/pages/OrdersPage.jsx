import { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import RefundModal from '@/components/RefundModal';
import { RequireRole } from '@/routes/AppRoutes';
import { toast } from 'react-toastify';

function getCurrentUser(){ try { return JSON.parse(localStorage.getItem('user')||'null'); } catch { return null; } }

export default function OrdersPage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const user = getCurrentUser();
  const branchId = user?.branchId;

  useEffect(()=>{
    async function load(){
      if (!branchId) return;
      setLoading(true);
      try{
        const res = await axiosClient.get(`/api/orders/branch/${branchId}`);
        setOrders(res.data || []);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[branchId]);

  async function refresh(){
    if (!branchId) return;
    try{
      const res = await axiosClient.get(`/api/orders/branch/${branchId}`);
      setOrders(res.data || []);
    } catch(e){ console.error(e); }
  }

  function printReceipt(order){
    const w = window.open('','PRINT','width=600,height=800');
    if (!w) return;
    const itemsHtml = (order.items||[]).map(it=>`<tr><td>${it.product?.name || 'Item'}</td><td>${it.quantity}</td><td>₹${it.price}</td><td>₹${(it.quantity*it.price).toFixed(2)}</td></tr>`).join('');
    const html = `
      <html>
      <head><title>Receipt ${order.id}</title></head>
      <body>
        <h2>Receipt - Order #${order.id}</h2>
        <div>Cashier: ${order.cashier?.FullName || order.cashierName || ''}</div>
        <div>Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
        <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:10px;">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <h3>Total: ₹${order.totalAmount}</h3>
      </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(()=>{ w.print(); }, 500);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div>
          <Button onClick={()=>setOrderModalOpen(true)}>New Order</Button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <table className="w-full">
        <thead className="text-sm text-muted-foreground text-left"><tr><th>ID</th><th>Amount</th><th>Cashier</th><th>Date</th><th></th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td>{o.id}</td>
              <td>₹{o.totalAmount}</td>
              <td>{o.cashier?.FullName || o.cashierName || '—'}</td>
              <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
              <td className="text-right">
                <Button variant="ghost" onClick={()=>setSelected(o)}>View</Button>
                <Button variant="outline" onClick={()=>printReceipt(o)}>Print</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-card p-4 rounded">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">Order #{selected.id}</h3>
              <div>
                <Button variant="outline" onClick={()=>setSelected(null)}>Close</Button>
              </div>
            </div>

            <div className="mt-3">
              <div>Amount: ₹{selected.totalAmount}</div>
              <div>Payment: {selected.paymentType}</div>
              <div className="mt-2">
                <h4 className="font-semibold">Items</h4>
                <ul className="list-disc pl-6">
                  {(selected.items||[]).map(it=> (
                    <li key={it.productId || it.id}>{it.product?.name || '—'} — {it.quantity} x ₹{it.price}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <RequireRole roles={[ 'ROLE_BRANCH_MANAGER','ROLE_STORE_MANAGER','ROLE_STORE_ADMIN','ROLE_ADMIN' ]}>
                  <Button variant="destructive" onClick={()=>setRefundOpen(true)}>Refund</Button>
                </RequireRole>
              </div>

            </div>
          </div>
        </div>
      )}

      <RefundModal open={refundOpen} onClose={()=>setRefundOpen(false)} order={selected} onCreated={()=>{
        // refresh refunds or order list if needed
        setRefundOpen(false);
        setSelected(null);
        refresh();
      }} />

      {orderModalOpen && (
        <NewOrderModal open={orderModalOpen} onClose={()=>setOrderModalOpen(false)} branchId={branchId} onCreated={(ord)=>{ setOrderModalOpen(false); refresh(); toast.success('Order created'); printReceipt(ord); }} />
      )}

    </div>
  );
}

function NewOrderModal({ open, onClose, branchId, onCreated }){
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        const pRes = await axiosClient.get('/api/products/store/' + (JSON.parse(localStorage.getItem('user')||'{}').storeId || ''));
        const invRes = branchId ? await axiosClient.get('/api/inventories/branch/' + branchId) : { data: [] };
        const invMap = new Map((invRes.data||[]).map(i=>[i.productId, i.quantity]));
        const merged = (pRes.data||[]).map(p => ({ productId: p.id, name: p.name, price: p.sellingPrice, qty: 0, max: invMap.get(p.id) ?? 0 }));
        setProducts(merged);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    if (open) load();
  },[open, branchId]);

  function setQty(idx, q){
    setProducts(ps => ps.map((p,i)=> i===idx ? {...p, qty: q} : p));
  }

  async function submit(){
    const selected = products.filter(p=>p.qty>0);
    if (!selected.length) return toast.error('Select at least one product');
    const total = selected.reduce((s,p)=> s + (p.qty * (p.price||0)), 0);
    const payload = { totalAmount: total, branchId: Number(branchId), customerId: null, items: selected.map(p=>({ productId: p.productId, quantity: p.qty, price: p.price })) };
    try{
      const res = await axiosClient.post('/api/orders', payload);
      onCreated(res.data);
    } catch(e){ console.error(e); toast.error(e?.response?.data?.message || 'Order failed'); }
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card p-4 rounded">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">New Order</h3>
          <div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        {loading && <div>Loading products...</div>}

        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-auto">
          {products.map((p, idx)=>(
            <div key={p.productId} className="flex items-center gap-3 border p-3 rounded">
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted-foreground">₹{p.price} • Stock: {p.max}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max={p.max} value={p.qty} onChange={e=>setQty(idx, Math.max(0, Math.min(p.max, Number(e.target.value||0))))} className="w-20 input" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Create Order</Button>
        </div>
      </div>
    </div>
  );
}

