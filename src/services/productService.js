// src/services/productService.js

import API from "./api";


export const productService = {
  // =====================
  // CREATE PRODUCT (Farmer only)
  // =====================
  addProduct: async (productData) => {
    const response = await API.post('/product/add', productData);
    return response.data;
  },

  // =====================
  // GET ALL AVAILABLE PRODUCTS (Anyone)
  // =====================
  getAllProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters if provided
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.quality) params.append('quality', filters.quality);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    
    const response = await API.get(`/product/all?${params.toString()}`);
    return response.data;
  },

  // =====================
  // GET MY OWN PRODUCTS (Farmer only)
  // =====================
  getMyProducts: async () => {
    const response = await API.get('/product/my-products');
    return response.data;
  },

  // =====================
  // GET PRODUCT BY ID (Anyone)
  // =====================
  getProductById: async (productId) => {
    const response = await API.get(`/product/${productId}`);
    return response.data;
  },

  // =====================
  // UPDATE PRODUCT (Farmer only, Partial Update)
  // =====================
  updateProduct: async (productId, updateData) => {
    const response = await API.patch(`/product/update/${productId}`, updateData);
    return response.data;
  },

  // =====================
  // DELETE PRODUCT (Farmer only)
  // =====================
  deleteProduct: async (productId) => {
    const response = await API.delete(`/product/delete/${productId}`);
    return response.data;
  },

  // =====================
  // TOGGLE PRODUCT AVAILABILITY
  // =====================
  toggleAvailability: async (productId, isAvailable) => {
    return await productService.updateProduct(productId, { is_available: isAvailable });
  },

  // =====================
  // UPDATE PRODUCT QUANTITY
  // =====================
  updateQuantity: async (productId, quantity) => {
    return await productService.updateProduct(productId, { quantity });
  }
};

// Product constants matching your model enums
export const PRODUCT_CATEGORIES = {
  CEREALS: 'cereals',
  PULSES: 'pulses',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  SPICES: 'spices',
  FLOWERS: 'flowers',
  OTHER: 'other'
};

export const PRODUCT_QUALITY = {
  A: 'A',
  B: 'B',
  C: 'C',
  ORGANIC: 'organic',
  PREMIUM: 'premium'
};

export const PRODUCT_UNITS = {
  KG: 'kg',
  QUINTAL: 'quintal',
  TON: 'ton',
  BAG: 'bag'
};