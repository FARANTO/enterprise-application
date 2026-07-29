import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  current: null,
  history: [],
  list: [],
  status: 'idle',
  historyStatus: 'idle',
  error: null,
};

export const startShift = createAsyncThunk('shift/start', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/shift-reports/start');
    return res.data;
  } catch (err) {
    console.error('startShift error', err, err?.response?.data);
    return thunkAPI.rejectWithValue(err?.response?.data || { message: err.message });
  }
});

export const endShift = createAsyncThunk('shift/end', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.patch('/api/shift-reports/end');
    return res.data;
  } catch (err) {
    console.error('endShift error', err, err?.response?.data);
    return thunkAPI.rejectWithValue(err?.response?.data || { message: err.message });
  }
});

export const getCurrentShift = createAsyncThunk('shift/current', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/shift-reports/current');
    return res.data || null;
  } catch (err) {
    const response = err?.response;
    const message = response?.data?.message || err?.message;
    if (response?.status === 404 || response?.status === 204 || message?.includes('No active shift')) {
      return null;
    }
    console.error('getCurrentShift error', err, err?.response?.data);
    return thunkAPI.rejectWithValue(response?.data || { message });
  }
});

export const fetchShiftHistory = createAsyncThunk('shift/fetchHistory', async (cashierId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/shift-reports/cashier/${cashierId}`);
    return res.data;
  } catch (err) {
    console.error('fetchShiftHistory error', err, err?.response?.data);
    return thunkAPI.rejectWithValue(err?.response?.data || { message: err.message });
  }
});

const shiftSlice = createSlice({
  name: 'shiftReports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(startShift.fulfilled, (state, action) => { state.current = action.payload; state.status = 'succeeded'; })
        .addCase(endShift.fulfilled, (state) => { state.current = null; state.status = 'succeeded'; })
      .addCase(getCurrentShift.fulfilled, (state, action) => { state.current = action.payload; state.status = 'succeeded'; })
        .addCase(getCurrentShift.rejected, (state) => { state.current = null; state.status = 'idle'; })
        .addCase(fetchShiftHistory.pending, (state) => { state.historyStatus = 'loading'; })
        .addCase(fetchShiftHistory.fulfilled, (state, action) => { state.historyStatus = 'succeeded'; state.history = action.payload || []; })
        .addCase(fetchShiftHistory.rejected, (state, action) => { state.historyStatus = 'failed'; state.error = action.payload; });
  }
});

export default shiftSlice.reducer;
