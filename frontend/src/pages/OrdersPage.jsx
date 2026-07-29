import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import RefundModal from '@/components/RefundModal';
import ReceiptModal from '@/components/ReceiptModal';
import { RequireRole } from '@/routes/AppRoutes';
import { fetchStores, fetchBranchesByStore, fetchAllBranches } from '@/features/stores/storesSlice';
import { fetchInventoryByBranch } from '@/features/inventory/inventorySlice';
import { getCurrentShift } from '@/features/shiftReports/shiftReportsSlice';

function getCurrentUser(){ try { return JSON.parse(localStorage.getItem('user')||'null'); } catch { return null; } }

export default function OrdersPage(){
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  // Refresh helpers imported from slices
  

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const user = getCurrentUser();
  const role = user?.role || user?.Role || '';
  const isAdmin = role === 'ROLE_ADMIN';
  const isStoreAdmin = role === 'ROLE_STORE_ADMIN';
  const isStoreManager = role === 'ROLE_STORE_MANAGER';
  const isBranchManager = role === 'ROLE_BRANCH_MANAGER';
  const branchId = user?.branchId;
  const storeId = user?.storeId;

  const stores = useSelector((state) => state.stores.items || []);
  const branches = useSelector((state) => state.stores.branches || []);
  const allBranches = useSelector((state) => state.stores.allBranches || []);

  useEffect(() => {
    dispatch(fetchStores());
    if (isAdmin) {
      dispatch(fetchAllBranches());
    }
    if ((isStoreAdmin || isStoreManager) && storeId) {
      dispatch(fetchBranchesByStore(Number(storeId)));
      setSelectedStoreId(String(storeId));
    }
    if (isBranchManager && branchId) {
      setSelectedBranchId(String(branchId));
    }
  }, [dispatch, isAdmin, isStoreAdmin, isStoreManager, isBranchManager, storeId, branchId]);

  useEffect(() => {
    if (!selectedBranchId) {
      if (isAdmin && allBranches.length > 0) {
        setSelectedBranchId(String(allBranches[0].id));
      } else if ((isStoreAdmin || isStoreManager) && branches.length > 0) {
        setSelectedBranchId(String(branches[0].id));
      } else if (branchId) {
        setSelectedBranchId(String(branchId));
      }
    }
  }, [allBranches, branches, branchId, selectedBranchId, isAdmin, isStoreAdmin, isStoreManager]);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        let res;
        if (selectedBranchId) {
          res = await axiosClient.get(`/api/orders/branch/${selectedBranchId}`);
        } else if ((isStoreAdmin || isStoreManager) && storeId) {
          res = await axiosClient.get(`/api/orders/store/${storeId}`);
        } else {
          res = { data: [] };
        }
        setOrders(res.data || []);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[selectedBranchId, storeId, isStoreAdmin, isStoreManager]);

  async function refresh(){
    try{
      let res;
      if (selectedBranchId) {
        res = await axiosClient.get(`/api/orders/branch/${selectedBranchId}`);
      } else if ((isStoreAdmin || isStoreManager) && storeId) {
        res = await axiosClient.get(`/api/orders/store/${storeId}`);
      } else {
        res = { data: [] };
      }
      setOrders(res.data || []);
    } catch(e){ console.error(e); }
  }

  function printReceipt(order){
    setReceiptOrder(order);
    setReceiptOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <Button variant="outline" onClick={refresh}>Refresh</Button>
        </div>
        {(isAdmin || isStoreAdmin || isStoreManager) && (
          <div className="flex flex-wrap gap-3 items-center">
            {(isAdmin || isStoreAdmin || isStoreManager) && (
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select branch</option>
                  {(isAdmin ? allBranches : branches).map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name || `Branch ${branch.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(isStoreAdmin || isStoreManager) && selectedStoreId && (
              <div className="text-sm text-muted-foreground">
                Store: {stores.find((store) => String(store.id) === selectedStoreId)?.name || `Store ${selectedStoreId}`}
              </div>
            )}
          </div>
        )}
        {loading && <div>Loading...</div>}
      </div>

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
              {/* Refund button per order for authorized roles */}
              <RequireRole roles={[ 'ROLE_BRANCH_MANAGER','ROLE_STORE_MANAGER','ROLE_STORE_ADMIN','ROLE_ADMIN' ]}>
                <Button variant="destructive" onClick={()=>{ setSelected(o); setRefundOpen(true); }}>Refund</Button>
              </RequireRole>
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

            <div className="mt-3 space-y-2">
              <div><strong>Amount:</strong> ₹{selected.totalAmount}</div>
              <div><strong>Payment:</strong> {selected.paymentType}</div>
              <div><strong>Date:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</div>
              <div><strong>Branch:</strong> {selected.branch?.name || selected.branchId || '—'}</div>
              <div><strong>Cashier:</strong> {selected.cashier?.fullName || selected.cashier?.FullName || selected.cashierName || '—'}</div>

              <div className="mt-2">
                <h4 className="font-semibold">Items</h4>
                <ul className="list-disc pl-6">
                  {(selected.items || []).map(it => (
                    <li key={it.productId || it.id}>{it.product?.name || it.productName || '—'} — {it.quantity} x ₹{it.price}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={()=>printReceipt(selected)}>Print</Button>
                <RequireRole roles={[ 'ROLE_BRANCH_MANAGER','ROLE_STORE_MANAGER','ROLE_STORE_ADMIN','ROLE_ADMIN' ]}>
                  <Button variant="destructive" onClick={()=>setRefundOpen(true)}>Refund</Button>
                </RequireRole>
              </div>
            </div>
          </div>
        </div>
      )}

      <RefundModal open={refundOpen} onClose={()=>setRefundOpen(false)} order={selected} onCreated={()=>{
        setRefundOpen(false);
        setSelected(null);
        refresh();
        try { dispatch(fetchInventoryByBranch(Number(selectedBranchId))); } catch(e){}
        try { dispatch(getCurrentShift()); } catch(e){}
      }} />

      <ReceiptModal open={receiptOpen} onClose={()=>setReceiptOpen(false)} order={receiptOrder} />

    </div>
  );
}


