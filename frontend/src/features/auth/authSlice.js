import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (err) {
    void err;
    return false;
  }
}

const persistedToken = (() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    if (isTokenExpired(token)) {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  } catch (err) {
    void err;
    return null;
  }
})();

const initialState = {
  token: persistedToken,
  user: null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async ({ email, password }, thunkAPI) => {
  try {
    const res = await axios.post(`${baseURL}/auth/login`, { email, password });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Login failed';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const signup = createAsyncThunk('auth/signup', async ({ fullName, email, password, role }, thunkAPI) => {
  try {
    const res = await axios.post(`${baseURL}/auth/signup`, { fullName, email, password, role });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Signup failed';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = action.payload || {};
        const token = payload.jwt || payload.token || null;
        if (token) {
          state.token = token;
          try { localStorage.setItem('token', token); } catch (err) { void err; }
        }
        state.user = payload.user || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = action.payload || {};
        const token = payload.jwt || payload.token || null;
        if (token) {
          state.token = token;
          try { localStorage.setItem('token', token); } catch (err) { void err; }
        }
        state.user = payload.user || null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.token = null;
        state.user = null;
      });
  },
});

export default authSlice.reducer;
