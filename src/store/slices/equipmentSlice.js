// store/slices/equipmentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState: {
    items: [],
    myEquipment: [],
    currentEquipment: null,
    loading: false,
    error: null,
    filters: {
      type: '',
      location: '',
      brand: '',
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

    // Set all equipment (for marketplace)
    setEquipment: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set my equipment (for owner's dashboard)
    setMyEquipment: (state, action) => {
      state.myEquipment = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current equipment (for detail view)
    setCurrentEquipment: (state, action) => {
      state.currentEquipment = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Clear current equipment
    clearCurrentEquipment: (state) => {
      state.currentEquipment = null;
    },

    // Add new equipment
    addEquipment: (state, action) => {
      state.myEquipment.unshift(action.payload);
      state.error = null;
    },

    // Update equipment
    updateEquipment: (state, action) => {
      const { equipmentId, updates } = action.payload;
      const index = state.myEquipment.findIndex(e => e.equipment_id === equipmentId);
      if (index !== -1) {
        state.myEquipment[index] = { ...state.myEquipment[index], ...updates };
      }
      
      // Also update in items if it exists there
      const itemIndex = state.items.findIndex(e => e.equipment_id === equipmentId);
      if (itemIndex !== -1) {
        state.items[itemIndex] = { ...state.items[itemIndex], ...updates };
      }
      
      // Update current equipment if it's the one being edited
      if (state.currentEquipment && state.currentEquipment.equipment_id === equipmentId) {
        state.currentEquipment = { ...state.currentEquipment, ...updates };
      }
    },

    // Delete equipment
    deleteEquipment: (state, action) => {
      const equipmentId = action.payload;
      state.myEquipment = state.myEquipment.filter(e => e.equipment_id !== equipmentId);
      state.items = state.items.filter(e => e.equipment_id !== equipmentId);
      
      if (state.currentEquipment && state.currentEquipment.equipment_id === equipmentId) {
        state.currentEquipment = null;
      }
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        type: '',
        location: '',
        brand: '',
        minPrice: '',
        maxPrice: ''
      };
    },

    // Toggle equipment availability
    toggleEquipmentAvailability: (state, action) => {
      const { equipmentId, isAvailable } = action.payload;
      const equipment = state.myEquipment.find(e => e.equipment_id === equipmentId);
      if (equipment) {
        equipment.is_available = isAvailable;
      }
    }
  }
});

export const {
  setLoading,
  setError,
  clearError,
  setEquipment,
  setMyEquipment,
  setCurrentEquipment,
  clearCurrentEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  updateFilters,
  clearFilters,
  toggleEquipmentAvailability
} = equipmentSlice.actions;

export default equipmentSlice.reducer;