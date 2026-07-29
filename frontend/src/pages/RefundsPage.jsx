import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchRefundsByBranch, fetchRefundsByCashier, fetchRefundsByDateRange } from '@/features/refunds/refundsSlice';

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString();
}

export default function RefundsPage() {
  const dispatch = useDispatch();
  const refunds = useSelector((state) => state.refunds.items || []);
  const status = useSelector((state) => state.refunds.status);
  const error = useSelector((state) => state.refunds.error);

  const user = getCurrentUser();
  const branchId = user?.branchId;

  const [cashierId, setCashierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (branchId) {
      dispatch(fetchRefundsByBranch(branchId));
    }
  }, [branchId, dispatch]);

  async function handleApplyFilters() {
    if (cashierId) {
      dispatch(fetchRefundsByCashier(Number(cashierId)));
      return;
    }

    if (startDate || endDate) {
      dispatch(fetchRefundsByDateRange({ startDate, endDate }));
      return;
    }

    if (branchId) {
      dispatch(fetchRefundsByBranch(branchId));
    }
  }

  function handleClearFilters() {
    setCashierId('');
    setStartDate('');
    setEndDate('');
    if (branchId) dispatch(fetchRefundsByBranch(branchId));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Refunds</h1>
          <p className="text-sm text-muted-foreground">View and filter refunds for your branch.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleApplyFilters}>Apply filters</Button>
          <Button variant="outline" onClick={handleClearFilters}>Clear filters</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="grid gap-2">
          <Label htmlFor="cashierId">Cashier ID</Label>
          <Input id="cashierId" value={cashierId} onChange={(e) => setCashierId(e.target.value)} placeholder="Cashier ID" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {status === 'loading' && <div>Loading refunds…</div>}
      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Refund ID</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id} className="border-t">
                <td className="px-4 py-3">{refund.id}</td>
                <td className="px-4 py-3">{refund.orderId || refund.order?.id || '—'}</td>
                <td className="px-4 py-3">₹{refund.amount?.toFixed(2)}</td>
                <td className="px-4 py-3">{refund.cashier?.fullName || refund.cashierName || '—'}</td>
                <td className="px-4 py-3">{refund.branch?.name || refund.branchId || '—'}</td>
                <td className="px-4 py-3">{refund.paymentType || '—'}</td>
                <td className="px-4 py-3">{formatDate(refund.createdAt)}</td>
              </tr>
            ))}
            {!refunds.length && status !== 'loading' && (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-sm text-muted-foreground">No refunds found for the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
