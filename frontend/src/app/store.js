import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import categoriesReducer from '@/features/categories/categoriesSlice';
import productsReducer from '@/features/products/productsSlice';
import inventoryReducer from '@/features/inventory/inventorySlice';
import cartReducer from '@/features/cart/cartSlice';
import shiftReducer from '@/features/shiftReports/shiftReportsSlice';
import customersReducer from '@/features/customers/customersSlice';
import refundsReducer from '@/features/refunds/refundsSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';
import employeesReducer from '@/features/employees/employeesSlice';
import storesReducer from '@/features/stores/storesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    products: productsReducer,
    inventory: inventoryReducer,
    cart: cartReducer,
    shiftReports: shiftReducer,
    customers: customersReducer,
    refunds: refundsReducer,
    dashboard: dashboardReducer,
    employees: employeesReducer,
    stores: storesReducer,
  },
});

export default store;
