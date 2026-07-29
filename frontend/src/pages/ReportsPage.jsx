import { useEffect, useState, useMemo } from 'react';
import axiosClient from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Store,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Building2,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

export default function ReportsPage() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', '30DAYS', '7DAYS', 'TODAY'
  const [activeTab, setActiveTab] = useState('trend'); // 'trend', 'branch', 'payment'

  // Load available stores on mount
  useEffect(() => {
    async function loadStores() {
      setLoadingStores(true);
      try {
        const res = await axiosClient.get('/api/stores');
        const storeData = res.data || [];
        setStores(storeData);
        if (storeData.length > 0) {
          setSelectedStoreId(String(storeData[0].id));
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
        toast.error('Failed to load stores');
      } finally {
        setLoadingStores(false);
      }
    }
    loadStores();
  }, []);

  // Fetch sales & branches whenever selectedStoreId changes
  useEffect(() => {
    if (!selectedStoreId) return;

    async function fetchStoreData() {
      setLoading(true);
      try {
        const [ordersRes, branchesRes] = await Promise.allSettled([
          axiosClient.get(`/api/orders/store/${selectedStoreId}`),
          axiosClient.get(`/api/branches/store/${selectedStoreId}`),
        ]);

        if (ordersRes.status === 'fulfilled') {
          setOrders(ordersRes.value.data || []);
        } else {
          console.error('Failed to load store orders:', ordersRes.reason);
          setOrders([]);
        }

        if (branchesRes.status === 'fulfilled') {
          setBranches(branchesRes.value.data || []);
        } else {
          setBranches([]);
        }
      } catch (err) {
        console.error('Error fetching store sales data:', err);
        toast.error('Failed to load sales data for selected store');
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [selectedStoreId]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/orders/store/${selectedStoreId}`);
      setOrders(res.data || []);
      toast.success('Sales data refreshed');
    } catch (err) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const now = new Date();

    return orders.filter((order) => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);

      if (dateFilter === 'TODAY') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === '7DAYS') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      }
      if (dateFilter === '30DAYS') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Payment methods breakdown
    const paymentCounts = {};
    filteredOrders.forEach((o) => {
      const pType = o.paymentType || 'CASH';
      paymentCounts[pType] = (paymentCounts[pType] || 0) + (o.totalAmount || 0);
    });

    let topPaymentMethod = 'N/A';
    let maxPayment = 0;
    Object.entries(paymentCounts).forEach(([method, amt]) => {
      if (amt > maxPayment) {
        maxPayment = amt;
        topPaymentMethod = method;
      }
    });

    return { totalSales, totalOrders, avgOrderValue, topPaymentMethod };
  }, [filteredOrders]);

  // Prepare Daily Trend Data for Recharts
  const dailyTrendData = useMemo(() => {
    const map = {};

    filteredOrders.forEach((o) => {
      const dateStr = o.createdAt
        ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Unknown';

      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, sales: 0, orders: 0, rawDate: o.createdAt ? new Date(o.createdAt) : new Date(0) };
      }
      map[dateStr].sales += o.totalAmount || 0;
      map[dateStr].orders += 1;
    });

    return Object.values(map)
      .sort((a, b) => a.rawDate - b.rawDate)
      .map(({ date, sales, orders }) => ({
        date,
        sales: Math.round(sales * 100) / 100,
        orders,
      }));
  }, [filteredOrders]);

  // Prepare Sales by Branch Data for Recharts
  const branchSalesData = useMemo(() => {
    const branchMap = {};

    // Initialize with branch names
    branches.forEach((b) => {
      branchMap[b.id] = { name: b.name || `Branch #${b.id}`, sales: 0, orders: 0 };
    });

    filteredOrders.forEach((o) => {
      const bId = o.branchId || o.branch?.id;
      const bName = o.branch?.name || (bId ? `Branch #${bId}` : 'Main Store');

      if (!branchMap[bId || 'default']) {
        branchMap[bId || 'default'] = { name: bName, sales: 0, orders: 0 };
      }
      branchMap[bId || 'default'].sales += o.totalAmount || 0;
      branchMap[bId || 'default'].orders += 1;
    });

    return Object.values(branchMap)
      .filter((item) => item.sales > 0 || branches.length <= 5)
      .map((item) => ({
        ...item,
        sales: Math.round(item.sales * 100) / 100,
      }));
  }, [filteredOrders, branches]);

  // Prepare Payment Breakdown Data for Recharts Pie Chart
  const paymentBreakdownData = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const type = o.paymentType || 'CASH';
      map[type] = (map[type] || 0) + (o.totalAmount || 0);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  }, [filteredOrders]);

  const selectedStore = useMemo(() => {
    return stores.find((s) => String(s.id) === String(selectedStoreId));
  }, [stores, selectedStoreId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Store Sales Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Graphical revenue insights, order performance, and sales breakdown by store.
          </p>
        </div>

        {/* Store Selection & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-2 shadow-xs">
            <Store className="h-4 w-4 text-indigo-500 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={loadingStores}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-2"
            >
              {stores.length === 0 ? (
                <option value="">No stores found</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    Store #{s.id} - {s.name} {s.brand ? `(${s.brand})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl flex items-center gap-2 h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Filter & View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-2 rounded-2xl border border-border/60">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/40 shadow-2xs">
          <Calendar className="h-4 w-4 text-muted-foreground ml-2 mr-1" />
          {[
            { key: 'ALL', label: 'All Time' },
            { key: '30DAYS', label: 'Last 30 Days' },
            { key: '7DAYS', label: 'Last 7 Days' },
            { key: 'TODAY', label: 'Today' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                dateFilter === f.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Chart View Tabs */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/40 shadow-2xs">
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'trend'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <LineIcon className="h-3.5 w-3.5" />
            Revenue Trend
          </button>
          <button
            onClick={() => setActiveTab('branch')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'branch'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            By Branch
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'payment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            Payment Methods
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{metrics.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            For {selectedStore ? selectedStore.name : 'Selected Store'}
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{metrics.totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">Orders processed</p>
        </div>

        {/* Avg Order Value */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Average Order Value</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">₹{metrics.avgOrderValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Per completed sale</p>
        </div>

        {/* Top Payment Method */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Top Payment Method</span>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.topPaymentMethod}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Highest sales volume</p>
        </div>
      </div>

      {/* Main Graphical Chart Container */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {activeTab === 'trend' && 'Daily Sales & Revenue Timeline'}
            {activeTab === 'branch' && 'Sales Performance Across Branches'}
            {activeTab === 'payment' && 'Revenue Distribution by Payment Method'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Graphical representation for {selectedStore?.name || 'Selected Store'}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm font-medium">Loading sales chart...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">No sales data found</p>
              <p className="text-xs text-muted-foreground mt-1">
                There are no orders recorded for this store in the selected date range.
              </p>
            </div>
          ) : (
            <div className="h-96 w-full">
              {activeTab === 'trend' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val, name) => [
                        name === 'sales' ? `₹${val}` : val,
                        name === 'sales' ? 'Revenue' : 'Orders',
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Revenue (₹)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'branch' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchSalesData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val) => [`₹${val}`, 'Sales']}
                      contentStyle={{
                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="sales" name="Sales Revenue (₹)" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'payment' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {paymentBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`₹${val}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'rgba(20, 20, 30, 0.9)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Orders Table Breakdown */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <h3 className="text-base font-semibold">Store Orders Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {filteredOrders.length} order records for {selectedStore?.name || 'Store'}
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/40">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground text-sm">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 15).map((o) => (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-500">#{o.id}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {o.branch?.name || (o.branchId ? `Branch #${o.branchId}` : 'Main Branch')}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {o.customer?.name || o.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {o.paymentType || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        ₹{(o.totalAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
