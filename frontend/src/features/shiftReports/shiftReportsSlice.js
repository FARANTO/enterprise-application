import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  current: null,
  list: [],
  status: 'idle',
  error: null,
};

export const startShift = createAsyncThunk('shift/start', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/shift-reports/start');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const endShift = createAsyncThunk('shift/end', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.patch('/api/shift-reports/end');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const getCurrentShift = createAsyncThunk('shift/current', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/shift-reports/current');
    return res.data;
  } catch (err) {
    // 404 or empty means no current shift
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
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
            .addCase(getCurrentShift.rejected, (state) => { state.current = null; state.status = 'idle'; });
  }
});

export default shiftSlice.reducer;
