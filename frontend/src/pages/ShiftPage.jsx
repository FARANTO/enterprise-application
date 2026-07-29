import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentShift, startShift, endShift } from '@/features/shiftReports/shiftReportsSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { RequireRole } from '@/routes/AppRoutes';

export default function ShiftPage(){
  const dispatch = useDispatch();
  const shift = useSelector(s => s.shiftReports.current);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(()=>{ dispatch(getCurrentShift()); }, [dispatch]);

  async function onStart(){
    try{ await dispatch(startShift()).unwrap(); toast.success('Shift started'); } catch { toast.error('Failed to start'); }
  }

  async function onEnd(){
    try{ await dispatch(endShift()).unwrap(); toast.success('Shift ended'); setConfirmOpen(false); } catch { toast.error('Failed to end'); }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Shift</h1>
      {!shift && (
        <div>
          <p className="text-sm text-muted-foreground">No active shift.</p>
          <Button onClick={onStart}>Start Shift</Button>
        </div>
      )}

      {shift && (
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Shift</h3>
                <p className="text-sm text-muted-foreground">Cashier: {shift.cashier?.FullName || shift.cashierName || '—'}</p>
                <p className="text-sm text-muted-foreground">Started: {new Date(shift.shiftStart).toLocaleString()}</p>
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

            <div className="mt-4">
              <RequireRole roles={[ 'ROLE_BRANCH_MANAGER','ROLE_STORE_MANAGER','ROLE_STORE_ADMIN','ROLE_ADMIN' ]}>
                <Button variant="destructive" onClick={()=>setConfirmOpen(true)}>Close Shift</Button>
              </RequireRole>
            </div>

            {confirmOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="w-full max-w-lg bg-card p-4 rounded">
                  <h3 className="text-lg font-semibold">Confirm Close Shift</h3>
                  <p className="mt-2">This will finalize the shift totals and cannot be easily undone. Are you sure you want to close the shift?</p>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="outline" onClick={()=>setConfirmOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={onEnd}>Close Shift</Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

