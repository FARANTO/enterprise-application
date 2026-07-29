import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialDiscountState = {
  type: null,              // 'order' | 'item' | null
  orderDiscount: {
    mode: null,            // 'percentage' | 'flat' | null
    value: 0,              // percentage (0-100) or flat amount
    calculatedAmount: 0    // computed discount amount
  },
  itemDiscounts: {}        // { productId: { mode, value, calculatedAmount } }
};

const initialState = {
  items: [], // { productId, product, quantity, price }
  heldOrders: [], // { id, name, items, totalAmount, discount }
  discount: { ...initialDiscountState },
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
      if (state.discount.itemDiscounts[id]) {
        delete state.discount.itemDiscounts[id];
        if (Object.keys(state.discount.itemDiscounts).length === 0) {
          state.discount.type = null;
        }
      }
    },
    setQty(state, action) {
      const { productId, quantity } = action.payload;
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return;
      }
      const existing = state.items.find(i => i.productId === productId);
      if (existing) existing.quantity = qty;
    },
    clearCart(state) {
      state.items = [];
      state.discount = { ...initialDiscountState };
    },
    holdOrder(state, action) {
      const { name } = action.payload || {};
      const id = Date.now();
      const totalAmount = state.items.reduce((s,i) => s + (i.price * i.quantity), 0);
      state.heldOrders.push({ id, name: name || `Held ${new Date().toISOString()}`, items: state.items.slice(), totalAmount, discount: JSON.parse(JSON.stringify(state.discount)) });
      state.items = [];
      state.discount = { ...initialDiscountState };
    },
    resumeOrder(state, action) {
      const id = action.payload;
      const held = state.heldOrders.find(h => h.id === id);
      if (held) {
        state.items = held.items;
        state.discount = held.discount ? JSON.parse(JSON.stringify(held.discount)) : { ...initialDiscountState };
        state.heldOrders = state.heldOrders.filter(h => h.id !== id);
      }
    },
    // Discount management actions
    applyOrderDiscount(state, action) {
      const { mode, value } = action.payload;
      // Set discount type to 'order'
      state.discount.type = 'order';
      // Update order discount configuration
      state.discount.orderDiscount.mode = mode;
      state.discount.orderDiscount.value = value;
      // Calculate discount amount
      const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
      if (mode === 'percentage') {
        state.discount.orderDiscount.calculatedAmount = (subtotal * value) / 100;
      } else if (mode === 'flat') {
        state.discount.orderDiscount.calculatedAmount = value;
      }
      // Clear item-level discounts when applying order discount
      state.discount.itemDiscounts = {};
    },
    applyItemDiscount(state, action) {
      const { productId, mode, value } = action.payload;
      // Set discount type to 'item'
      state.discount.type = 'item';
      // Find the item to calculate discount
      const item = state.items.find(i => i.productId === productId);
      if (item) {
        const itemTotal = item.price * item.quantity;
        let calculatedAmount = 0;
        if (mode === 'percentage') {
          calculatedAmount = (itemTotal * value) / 100;
        } else if (mode === 'flat') {
          calculatedAmount = value;
        }
        // Add or update item discount
        state.discount.itemDiscounts[productId] = {
          mode,
          value,
          calculatedAmount
        };
      }
      // Clear order-level discount when applying item discount
      state.discount.orderDiscount = {
        mode: null,
        value: 0,
        calculatedAmount: 0
      };
    },
    clearDiscounts(state) {
      // Reset all discount state to initial values
      state.discount = {
        type: null,
        orderDiscount: {
          mode: null,
          value: 0,
          calculatedAmount: 0
        },
        itemDiscounts: {}
      };
    },
    removeItemDiscount(state, action) {
      const { productId } = action.payload;
      // Remove specific item discount from itemDiscounts map
      delete state.discount.itemDiscounts[productId];
      // If no item discounts remain, reset discount type
      if (Object.keys(state.discount.itemDiscounts).length === 0) {
        state.discount.type = null;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(processPayment.fulfilled, (state) => { state.status = 'succeeded'; state.items = []; state.discount = { ...initialDiscountState }; })
      .addCase(processPayment.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error.message; });
  }
});
 
export const { 
  addItem, 
  removeItem, 
  setQty, 
  clearCart, 
  holdOrder, 
  resumeOrder,
  applyOrderDiscount,
  applyItemDiscount,
  clearDiscounts,
  removeItemDiscount
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartDiscounts = (state) => state.cart.discount;
export const selectCartTotals = createSelector(
  [selectCartItems, selectCartDiscounts],
  (items, discount) => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);

    const orderDiscountAmount = discount?.type === 'order'
      ? discount?.orderDiscount?.mode === 'percentage'
        ? (subtotal * (discount?.orderDiscount?.value || 0)) / 100
        : (discount?.orderDiscount?.value || 0)
      : 0;
    const itemDiscounts = items.reduce((acc, item) => {
      const disc = discount?.itemDiscounts?.[item.productId];
      if (!disc || !disc.mode) return acc;
      const itemTotal = item.price * item.quantity;
      const value = Number(disc.value || 0);
      const calculatedAmount = disc.mode === 'percentage'
        ? (itemTotal * value) / 100
        : value;
      acc[item.productId] = {
        ...disc,
        calculatedAmount: Math.min(calculatedAmount, itemTotal),
      };
      return acc;
    }, {});
    const itemDiscountAmount = Object.values(itemDiscounts).reduce((sum, disc) => sum + (disc?.calculatedAmount || 0), 0);
    const discountAmount = discount?.type === 'order' ? orderDiscountAmount : discount?.type === 'item' ? itemDiscountAmount : 0;
    const finalTotal = Math.max(subtotal - discountAmount, 0);

    return {
      subtotal,
      totalItems,
      discountAmount,
      finalTotal,
      discountType: discount?.type,
      orderDiscount: discount?.orderDiscount,
      itemDiscounts,
    };
  }
);

export default cartSlice.reducer;
