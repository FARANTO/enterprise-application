import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const createEmployee = createAsyncThunk('employees/create', async (payload, thunkAPI) => {
  try {
    const { storeId, ...body } = payload;
    const url = storeId ? `/api/employees/store/${storeId}` : '/auth/signup';
    const res = await axiosClient.post(url, body);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Employee creation failed');
  }
});

export const fetchEmployees = createAsyncThunk('employees/fetchAll', async (storeId, thunkAPI) => {
  try {
    const res = await axiosClient.get(`/api/employees/store/${storeId}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Unable to load employees');
  }
});

export const deleteEmployee = createAsyncThunk('employees/delete', async (id, thunkAPI) => {
  try {
    await axiosClient.delete(`/api/employees/${id}`);
    return { id };
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Failed to delete employee');
  }
});

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createEmployee.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.unshift(action.payload?.user || action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      });
  },
});

export default employeesSlice.reducer;
