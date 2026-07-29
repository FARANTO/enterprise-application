import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchProductsByStore = createAsyncThunk('products/fetchByStore', async (storeId, thunkAPI) => {
  try {
    const url = storeId ? `/api/products/store/${storeId}` : '/api/products';
    const res = await axiosClient.get(url);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const searchProducts = createAsyncThunk('products/search', async ({ storeId, keyword }, thunkAPI) => {
  try {
    const url = storeId ? `/api/products/store/${storeId}/search` : '/api/products';
    const res = await axiosClient.get(url, { params: { keyword } });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const createProduct = createAsyncThunk('products/create', async (productDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/products', productDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, productDTO }, thunkAPI) => {
  try {
    const res = await axiosClient.patch(`/api/products/${id}`, productDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, thunkAPI) => {
  try {
    const res = await axiosClient.delete(`/api/products/${id}`);
    return { id, message: res.data?.message };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByStore.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductsByStore.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
      })
      .addCase(fetchProductsByStore.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload.id);
      });
  },
});

export default productsSlice.reducer;
