// store/slices/productSlice.js
import { createSlice } from '@reduxjs/toolkit';

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    myProducts: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: {
      category: '',
      location: '',
      quality: '',
      minPrice: '',
      maxPrice: ''
    }
  },
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set all products (for marketplace)
    setProducts: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set my products (for farmer's dashboard)
    setMyProducts: (state, action) => {
      state.myProducts = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current product (for detail view)
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Clear current product
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },

    // Add new product
    addProduct: (state, action) => {
      state.myProducts.unshift(action.payload);
      state.error = null;
    },

    // Update product
    updateProduct: (state, action) => {
      const { productId, updates } = action.payload;
      const index = state.myProducts.findIndex(p => p.product_id === productId);
      if (index !== -1) {
        state.myProducts[index] = { ...state.myProducts[index], ...updates };
      }
      
      // Also update in items if it exists there
      const itemIndex = state.items.findIndex(p => p.product_id === productId);
      if (itemIndex !== -1) {
        state.items[itemIndex] = { ...state.items[itemIndex], ...updates };
      }
      
      // Update current product if it's the one being edited
      if (state.currentProduct && state.currentProduct.product_id === productId) {
        state.currentProduct = { ...state.currentProduct, ...updates };
      }
    },

    // Delete product
    deleteProduct: (state, action) => {
      const productId = action.payload;
      state.myProducts = state.myProducts.filter(p => p.product_id !== productId);
      state.items = state.items.filter(p => p.product_id !== productId);
      
      if (state.currentProduct && state.currentProduct.product_id === productId) {
        state.currentProduct = null;
      }
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        category: '',
        location: '',
        quality: '',
        minPrice: '',
        maxPrice: ''
      };
    },

    // Toggle product availability
    toggleProductAvailability: (state, action) => {
      const { productId, isAvailable } = action.payload;
      const product = state.myProducts.find(p => p.product_id === productId);
      if (product) {
        product.is_available = isAvailable;
      }
    }
  }
});

export const {
  setLoading,
  setError,
  clearError,
  setProducts,
  setMyProducts,
  setCurrentProduct,
  clearCurrentProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  updateFilters,
  clearFilters,
  toggleProductAvailability
} = productSlice.actions;

export default productSlice.reducer;