import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  selectedRefund: null,
  status: 'idle',
  error: null,
};

export const createRefund = createAsyncThunk('refunds/create', async (refundDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/refunds', refundDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchAllRefunds = createAsyncThunk('refunds/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/refunds');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchRefundsByBranch = createAsyncThunk('refunds/fetchByBranch', async (branchId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/refunds/branch/${branchId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchRefundsByShift = createAsyncThunk('refunds/fetchByShift', async (shiftId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/refunds/shift/${shiftId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchRefundsByCashier = createAsyncThunk('refunds/fetchByCashier', async (cashierId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/refunds/cashier/${cashierId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchRefundsByDateRange = createAsyncThunk('refunds/fetchByDateRange', async ({ startDate, endDate }, thunkAPI) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await axiosClient.get(`/api/refunds?${params.toString()}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const fetchRefundById = createAsyncThunk('refunds/fetchById', async (refundId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/refunds/${refundId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const refundsSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRefunds.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllRefunds.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchAllRefunds.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      .addCase(createRefund.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(fetchRefundsByBranch.fulfilled, (state, action) => { state.items = action.payload || []; })
      .addCase(fetchRefundsByShift.fulfilled, (state, action) => { state.items = action.payload || []; })
      
      .addCase(fetchRefundsByCashier.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRefundsByCashier.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchRefundsByCashier.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      
      .addCase(fetchRefundsByDateRange.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRefundsByDateRange.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchRefundsByDateRange.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      
      .addCase(fetchRefundById.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRefundById.fulfilled, (state, action) => { state.status = 'succeeded'; state.selectedRefund = action.payload; })
      .addCase(fetchRefundById.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  }
});

export default refundsSlice.reducer;
