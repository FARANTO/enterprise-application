import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchCategoriesByStore = createAsyncThunk('categories/fetchByStore', async (storeId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/categories/store/${storeId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const createCategory = createAsyncThunk('categories/create', async (categoryDTO, thunkAPI) => {
  try {
    const res = await axiosClient.post('/api/categories', categoryDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, categoryDTO }, thunkAPI) => {
  try {
    const res = await axiosClient.put(`/api/categories/${id}`, categoryDTO);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, thunkAPI) => {
  try {
    const res = await axiosClient.delete(`/api/categories/${id}`);
    return { id, message: res.data?.message };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message);
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesByStore.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCategoriesByStore.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchCategoriesByStore.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      .addCase(createCategory.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload.id);
      });
  }
});

export default categoriesSlice.reducer;
