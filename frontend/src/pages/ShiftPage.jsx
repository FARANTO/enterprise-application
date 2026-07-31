import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentShift, startShift, endShift, fetchShiftHistory } from '@/features/shiftReports/shiftReportsSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

export default function ShiftPage(){
  const dispatch = useDispatch();
  const shift = useSelector(s => s.shiftReports.current);
  const history = useSelector(s => s.shiftReports.history || []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const role = user?.role || user?.Role || '';
  const isCashier = role === 'ROLE_BRANCH_CASHIER';
  const isManager = role === 'ROLE_BRANCH_MANAGER' || role === 'ROLE_STORE_MANAGER' || role === 'ROLE_STORE_ADMIN' || role === 'ROLE_ADMIN';
  const canManageShift = isCashier || isManager;  // Both can start/close

  // Debug logs
  console.log('🔄 ShiftPage rendered, URL:', window.location.pathname);

  useEffect(() => {
    console.log('✅ ShiftPage mounted');
    return () => console.log('❌ ShiftPage unmounted');
  }, []);

  useEffect(() => {
    dispatch(getCurrentShift());
    if (user?.id) {
      dispatch(fetchShiftHistory(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!shift) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      const start = new Date(shift.shiftStart).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [shift]);

  async function onStart(){
    try{
      await dispatch(startShift()).unwrap();
      if (user?.id) {
        dispatch(fetchShiftHistory(user.id));
      }
      toast.success('Shift started');
    } catch {
      toast.error('Failed to start');
    }
  }

  async function onEnd(){
    try{
      await dispatch(endShift()).unwrap();
      if (user?.id) {
        dispatch(fetchShiftHistory(user.id));
      }
      dispatch(getCurrentShift());
      toast.success('Shift ended');
      setConfirmOpen(false);
    } catch {
      toast.error('Failed to end');
    }
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  const salaryAmount = (elapsedSeconds * 0.05).toFixed(2);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Shift</h1>

      {!shift ? (
        <div>
          <p className="text-sm text-muted-foreground">No active shift.</p>
          {canManageShift && (
            <Button onClick={onStart} className="mt-2">Start Shift</Button>
          )}
          {!canManageShift && (
            <p className="text-sm text-muted-foreground mt-2">You don't have permission to start a shift.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Shift</h3>
                <p className="text-sm text-muted-foreground">Cashier: {shift.cashier?.fullName || shift.cashierName || '—'}</p>
                <p className="text-sm text-muted-foreground">Started: {new Date(shift.shiftStart).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Elapsed: {formatDuration(elapsedSeconds)}</p>
                <p className="text-sm text-muted-foreground">Salary earned: ₹{salaryAmount}</p>
              </div>
              <div className="text-right">
                <div>Total Sales: ₹{shift.totalSales ?? 0}</div>
                <div>Total Refunds: ₹{shift.totalRefunds ?? 0}</div>
                <div className="font-semibold">Net: ₹{shift.netSales ?? 0}</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Top Products</h4>
              <ul className="list-disc pl-6">
                {(shift.topSellingProducts || []).map(p => (
                  <li key={p.id}>{p.name} — ₹{p.sellingPrice} (sold qty unknown)</li>
                ))}
              </ul>
            </div>

            {/* Show Close Shift button for both cashier and manager */}
            {canManageShift && (
              <div className="mt-4">
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Close Shift
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-card p-4 rounded">
            <h3 className="text-lg font-semibold">Confirm Close Shift</h3>
            <p className="mt-2">This will finalize the shift totals and cannot be easily undone. Are you sure you want to close the shift?</p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={onEnd}>Close Shift</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Shift History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed shifts found yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="rounded-2xl border p-3 bg-background">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Shift #{record.id}</p>
                    <p className="text-xs text-muted-foreground">{record.branch?.name || `Branch ${record.branchId || 'N/A'}`}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{record.shiftStart ? new Date(record.shiftStart).toLocaleString() : 'Start N/A'}</div>
                    <div>{record.shiftEnd ? new Date(record.shiftEnd).toLocaleString() : 'Closed'}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sales</p>
                    <p className="font-semibold text-emerald-600">₹{record.totalSales ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Refunds</p>
                    <p className="font-semibold text-rose-600">₹{record.totalRefunds ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net</p>
                    <p className="font-semibold">₹{record.netSales ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Orders</p>
                    <p className="font-semibold">{record.totalOrders ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}