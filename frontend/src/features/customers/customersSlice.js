import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/customers');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const createCustomer = createAsyncThunk('customers/create', async (customer, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/customers', customer);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, customer }, thunkAPI) => {
  try {
    const res = await axiosClient.put(`/api/customers/${id}`, customer);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, thunkAPI) => {
  try {
    const res = await axiosClient.delete(`/api/customers/${id}`);
    return { id, message: res.data?.message };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCustomers.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchCustomers.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      .addCase(createCustomer.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => { state.items = state.items.filter(i => i.id !== action.payload.id); });
  }
});

export default customersSlice.reducer;
