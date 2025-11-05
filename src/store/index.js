// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import productReducer from './slices/productSlice';
import equipmentReducer from './slices/equipmentSlice';
import landReducer from './slices/landSlice';
import transactionReducer from './slices/transactionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    products: productReducer,
    equipment: equipmentReducer,
    lands: landReducer,
    transactions: transactionReducer,
  },
});

export default store;