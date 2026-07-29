import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  items: [], // { productId, product, quantity, price }
  heldOrders: [], // { id, name, items, totalAmount }
  status: 'idle',
  error: null,
};

export const processPayment = createAsyncThunk('cart/processPayment', async ({ method, orderPayload }, thunkAPI) => {
  try {
    // Abstracted payment: backend will handle actual provider integration when creating order
    const response = await axiosClient.post('/api/orders', { ...orderPayload, paymentType: method });
    return response.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || 'Payment failed');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find(i => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ productId: product.id, product, quantity, price: product.sellingPrice });
      }
    },
    removeItem(state, action) {
      const id = action.payload;
      state.items = state.items.filter(i => i.productId !== id);
    },
    setQty(state, action) {
      const { productId, quantity } = action.payload;
      const existing = state.items.find(i => i.productId === productId);
      if (existing) existing.quantity = quantity;
    },
    clearCart(state) {
      state.items = [];
    },
    holdOrder(state, action) {
      const { name } = action.payload || {};
      const id = Date.now();
      const totalAmount = state.items.reduce((s,i) => s + (i.price * i.quantity), 0);
      state.heldOrders.push({ id, name: name || `Held ${new Date().toISOString()}`, items: state.items.slice(), totalAmount });
      state.items = [];
    },
    resumeOrder(state, action) {
      const id = action.payload;
      const held = state.heldOrders.find(h => h.id === id);
      if (held) {
        state.items = held.items;
        state.heldOrders = state.heldOrders.filter(h => h.id !== id);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(processPayment.fulfilled, (state) => { state.status = 'succeeded'; state.items = []; })
      .addCase(processPayment.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error.message; });
  }
});

export const { addItem, removeItem, setQty, clearCart, holdOrder, resumeOrder } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotals = createSelector([selectCartItems], (items) => {
  const subtotal = items.reduce((s,i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s,i) => s + i.quantity, 0);
  return { subtotal, totalItems };
});

export default cartSlice.reducer;
