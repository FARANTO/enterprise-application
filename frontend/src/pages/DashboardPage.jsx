import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrdersSummary } from '@/features/dashboard/dashboardSlice';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage(){
  const dispatch = useDispatch();
  const dashboard = useSelector(s => s.dashboard);
  const user = (()=>{ try { return JSON.parse(localStorage.getItem('user')||'null'); } catch { return null; } })();
  const branchId = user?.branchId;

  useEffect(()=>{
    dispatch(fetchOrdersSummary({ branchId }));
  }, [branchId, dispatch]);

  const revenueData = dashboard.revenueByDay || [];
  const topProducts = dashboard.topProducts || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-xl font-semibold">₹{dashboard.summary?.totalRevenue ?? 0}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Orders</div>
          <div className="text-xl font-semibold">{dashboard.summary?.ordersCount ?? 0}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Top Product</div>
          <div className="text-xl font-semibold">{topProducts[0]?.name || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Revenue by day</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Top Products</h3>
          <table className="w-full">
            <thead className="text-sm text-muted-foreground text-left"><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.map(p => (
                <tr key={p.id} className="border-t"><td>{p.name}</td><td>{p.qty}</td><td>₹{p.revenue}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

