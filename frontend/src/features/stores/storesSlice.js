import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  branches: [],
  allBranches: [],
  status: 'idle',
  error: null,
};

export const fetchStores = createAsyncThunk('stores/fetchAll', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/stores');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Unable to load stores');
  }
});

export const createStore = createAsyncThunk('stores/create', async (storeDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/stores', storeDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Store creation failed');
  }
});

export const deleteStore = createAsyncThunk('stores/delete', async (id, thunkAPI) => {
  try {
    await axiosClient.delete(`/api/stores/${id}`);
    return { id };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete store');
  }
});

export const createBranch = createAsyncThunk('stores/createBranch', async (branchDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/branches', branchDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Branch creation failed');
  }
});

export const fetchBranchesByStore = createAsyncThunk('stores/fetchBranchesByStore', async (storeId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/branches/store/${storeId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Unable to load branches');
  }
});

export const fetchAllBranches = createAsyncThunk('stores/fetchAllBranches', async (_, thunkAPI) => {
  try {
    const res = await axiosClient.get('/api/branches');
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Unable to load branches');
  }
});

export const deleteBranch = createAsyncThunk('stores/deleteBranch', async (id, thunkAPI) => {
  try {
    await axiosClient.delete(`/api/branches/${id}`);
    return { id };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete branch');
  }
});

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createStore.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteStore.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.branches.unshift(action.payload);
        state.allBranches.unshift(action.payload);
      })
      .addCase(fetchBranchesByStore.fulfilled, (state, action) => {
        state.branches = action.payload || [];
      })
      .addCase(fetchAllBranches.fulfilled, (state, action) => {
        state.allBranches = action.payload || [];
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.branches = state.branches.filter((item) => item.id !== action.payload.id);
        state.allBranches = state.allBranches.filter((item) => item.id !== action.payload.id);
      });
  },
});

export default storesSlice.reducer;
