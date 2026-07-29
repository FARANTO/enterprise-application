import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  summary: null,
  revenueByDay: [],
  topProducts: [],
  status: 'idle',
  error: null,
};

// Aggregates orders client-side for a branch and date range
export const fetchOrdersSummary = createAsyncThunk('dashboard/fetchOrdersSummary', async ({ branchId, startDate, endDate } = {}, thunkAPI) => {
  try {
    const orders = [];
    if (branchId) {
      const res = await axiosClient.get(`/api/orders/branch/${branchId}`);
      orders.push(...(res.data || []));
    } else {
      // If no branchId, attempt to use user's branches from localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const branches = user?.branches || (user?.branchId ? [ { id: user.branchId } ] : []);
      for (const b of branches) {
        try {
          const res = await axiosClient.get(`/api/orders/branch/${b.id}`);
          orders.push(...(res.data || []));
        } catch (err) {
          void err;
        }
      }
    }

    // Filter by date range if provided and orders have createdAt
    let filtered = orders;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      filtered = orders.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt) : null;
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    // revenue by day
    const revenueMap = {};
    filtered.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : null;
      const key = d ? d.toISOString().slice(0,10) : 'unknown';
      revenueMap[key] = (revenueMap[key] || 0) + (o.totalAmount || 0);
    });
    const revenueByDay = Object.keys(revenueMap).sort().map(k => ({ date: k, revenue: revenueMap[k] }));

    // top products
    const productMap = {};
    filtered.forEach(o => {
      (o.items || []).forEach(it => {
        const pid = it.productId || (it.product && it.product.id);
        const name = (it.product && it.product.name) || 'Unknown';
        const qty = it.quantity || 0;
        const amount = (it.price || 0) * qty;
        if (!productMap[pid]) productMap[pid] = { id: pid, name, qty: 0, revenue: 0 };
        productMap[pid].qty += qty;
        productMap[pid].revenue += amount;
      });
    });
    const topProducts = Object.values(productMap).sort((a,b)=>b.revenue - a.revenue).slice(0,10);

    return { revenueByDay, topProducts, totalRevenue: filtered.reduce((s,o)=>s+(o.totalAmount||0),0), ordersCount: filtered.length };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersSummary.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchOrdersSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.revenueByDay = action.payload.revenueByDay || [];
        state.topProducts = action.payload.topProducts || [];
        state.summary = { totalRevenue: action.payload.totalRevenue, ordersCount: action.payload.ordersCount };
      })
      .addCase(fetchOrdersSummary.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  }
});

export default dashboardSlice.reducer;
