import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchInventoryByBranch = createAsyncThunk('inventory/fetchByBranch', async (branchId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/inventories/branch/${branchId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const getInventoryByProductAndBranch = createAsyncThunk('inventory/getByProductAndBranch', async ({ branchId, productId }, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/inventories/branch/${branchId}/product/${productId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const createInventory = createAsyncThunk('inventory/create', async (inventoryDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/inventories', inventoryDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const updateInventory = createAsyncThunk('inventory/update', async ({ id, inventoryDTO }, thunkAPI) => {
  try {
    const res = await axiosClient.put(`/api/inventories/${id}`, inventoryDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const deleteInventory = createAsyncThunk('inventory/delete', async (id, thunkAPI) => {
  try {
    const res = await axiosClient.delete(`/api/inventories/${id}`);
    return { id, message: res.data?.message };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryByBranch.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchInventoryByBranch.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchInventoryByBranch.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      .addCase(createInventory.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateInventory.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => { state.items = state.items.filter(i => i.id !== action.payload.id); });
  }
});

export default inventorySlice.reducer;
