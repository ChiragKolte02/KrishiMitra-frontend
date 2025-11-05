import API from "./api";

// src/services/landService.js
;

export const landService = {
  // =====================
  // CREATE LAND (Landowner only)
  // =====================
  addLand: async (landData) => {
    const response = await API.post('/lands/add', landData);
    return response.data;
  },

  // =====================
  // GET ALL AVAILABLE LANDS (Anyone)
  // =====================
  getAllLands: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters if provided
    if (filters.location) params.append('location', filters.location);
    if (filters.minSize) params.append('minSize', filters.minSize);
    if (filters.maxSize) params.append('maxSize', filters.maxSize);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    
    const response = await API.get(`/lands/all?${params.toString()}`);
    return response.data;
  },

  // =====================
  // GET MY LANDS (Landowner only)
  // =====================
  getMyLands: async () => {
    const response = await API.get('/lands/my-lands');
    return response.data;
  },

  // =====================
  // GET LAND BY ID (Anyone)
  // =====================
  getLandById: async (landId) => {
    const response = await API.get(`/lands/${landId}`);
    return response.data;
  },

  // =====================
  // UPDATE LAND (Owner only, Partial Update)
  // =====================
  updateLand: async (landId, updateData) => {
    const response = await API.patch(`/lands/update/${landId}`, updateData);
    return response.data;
  },

  // =====================
  // DELETE LAND (Owner only)
  // =====================
  deleteLand: async (landId) => {
    const response = await API.delete(`/lands/delete/${landId}`);
    return response.data;
  },

  // =====================
  // TOGGLE LAND AVAILABILITY
  // =====================
  toggleAvailability: async (landId, isAvailable) => {
    return await landService.updateLand(landId, { is_available: isAvailable });
  },

  // =====================
  // UPDATE RENTAL PRICE
  // =====================
  updateRentalPrice: async (landId, pricePerDay) => {
    return await landService.updateLand(landId, { price_per_day: pricePerDay });
  },

  // =====================
  // UPDATE LAND SIZE
  // =====================
  updateLandSize: async (landId, sizeInAcres) => {
    return await landService.updateLand(landId, { size_in_acres: sizeInAcres });
  }
};