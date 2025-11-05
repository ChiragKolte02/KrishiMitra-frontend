// store/slices/landSlice.js
import { createSlice } from '@reduxjs/toolkit';

const landSlice = createSlice({
  name: 'lands',
  initialState: {
    items: [],
    myLands: [],
    currentLand: null,
    loading: false,
    error: null,
    filters: {
      location: '',
      minSize: '',
      maxSize: '',
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

    // Set all lands (for marketplace)
    setLands: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set my lands (for owner's dashboard)
    setMyLands: (state, action) => {
      state.myLands = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current land (for detail view)
    setCurrentLand: (state, action) => {
      state.currentLand = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Clear current land
    clearCurrentLand: (state) => {
      state.currentLand = null;
    },

    // Add new land
    addLand: (state, action) => {
      state.myLands.unshift(action.payload);
      state.error = null;
    },

    // Update land
    updateLand: (state, action) => {
      const { landId, updates } = action.payload;
      const index = state.myLands.findIndex(l => l.land_id === landId);
      if (index !== -1) {
        state.myLands[index] = { ...state.myLands[index], ...updates };
      }
      
      // Also update in items if it exists there
      const itemIndex = state.items.findIndex(l => l.land_id === landId);
      if (itemIndex !== -1) {
        state.items[itemIndex] = { ...state.items[itemIndex], ...updates };
      }
      
      // Update current land if it's the one being edited
      if (state.currentLand && state.currentLand.land_id === landId) {
        state.currentLand = { ...state.currentLand, ...updates };
      }
    },

    // Delete land
    deleteLand: (state, action) => {
      const landId = action.payload;
      state.myLands = state.myLands.filter(l => l.land_id !== landId);
      state.items = state.items.filter(l => l.land_id !== landId);
      
      if (state.currentLand && state.currentLand.land_id === landId) {
        state.currentLand = null;
      }
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        location: '',
        minSize: '',
        maxSize: '',
        minPrice: '',
        maxPrice: ''
      };
    },

    // Toggle land availability
    toggleLandAvailability: (state, action) => {
      const { landId, isAvailable } = action.payload;
      const land = state.myLands.find(l => l.land_id === landId);
      if (land) {
        land.is_available = isAvailable;
      }
    }
  }
});

export const {
  setLoading,
  setError,
  clearError,
  setLands,
  setMyLands,
  setCurrentLand,
  clearCurrentLand,
  addLand,
  updateLand,
  deleteLand,
  updateFilters,
  clearFilters,
  toggleLandAvailability
} = landSlice.actions;

export default landSlice.reducer;