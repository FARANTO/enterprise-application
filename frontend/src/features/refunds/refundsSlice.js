import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
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
      .addCase(fetchRefundsByShift.fulfilled, (state, action) => { state.items = action.payload || []; });
  }
});

export default refundsSlice.reducer;
