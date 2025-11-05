// src/services/equipmentService.js

import API from "./api";


export const equipmentService = {
  // =====================
  // CREATE EQUIPMENT (Equipment Owner only)
  // =====================
  addEquipment: async (equipmentData) => {
    const response = await API.post('/equipment/add', equipmentData);
    return response.data;
  },

  // =====================
  // GET ALL AVAILABLE EQUIPMENTS (Anyone)
  // =====================
  getAllEquipment: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters if provided
    if (filters.type) params.append('type', filters.type);
    if (filters.location) params.append('location', filters.location);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.brand) params.append('brand', filters.brand);
    
    const response = await API.get(`/equipment/all?${params.toString()}`);
    return response.data;
  },

  // =====================
  // GET MY OWN EQUIPMENTS (Equipment Owner only)
  // =====================
  getMyEquipment: async () => {
    const response = await API.get('/equipment/my-equipments');
    return response.data;
  },

  // =====================
  // GET EQUIPMENT BY ID (Anyone)
  // =====================
  getEquipmentById: async (equipmentId) => {
    const response = await API.get(`/equipment/${equipmentId}`);
    return response.data;
  },

  // =====================
  // UPDATE EQUIPMENT (Owner only, Partial Update)
  // =====================
  updateEquipment: async (equipmentId, updateData) => {
    const response = await API.patch(`/equipment/update/${equipmentId}`, updateData);
    return response.data;
  },

  // =====================
  // DELETE EQUIPMENT (Owner only)
  // =====================
  deleteEquipment: async (equipmentId) => {
    const response = await API.delete(`/equipment/delete/${equipmentId}`);
    return response.data;
  },

  // =====================
  // TOGGLE EQUIPMENT AVAILABILITY
  // =====================
  toggleAvailability: async (equipmentId, isAvailable) => {
    return await equipmentService.updateEquipment(equipmentId, { is_available: isAvailable });
  },

  // =====================
  // UPDATE RENTAL PRICE
  // =====================
  updateRentalPrice: async (equipmentId, rentPrice) => {
    return await equipmentService.updateEquipment(equipmentId, { rent_price_per_day: rentPrice });
  }
};

// Equipment constants matching your model enums
export const EQUIPMENT_TYPES = {
  TRACTOR: 'tractor',
  HARVESTER: 'harvester',
  PLOUGH: 'plough',
  IRRIGATION: 'irrigation',
  SPRAYER: 'sprayer',
  TILLER: 'tiller',
  OTHER: 'other'
};

export const EQUIPMENT_BRANDS = {
  MAHINDRA: 'Mahindra',
  JOHN_DEERE: 'John Deere',
  SWARAJ: 'Swaraj',
  SONALIKA: 'Sonalika',
  KUBOTA: 'Kubota',
  ESCORTS: 'Escorts',
  OTHERS: 'Others'
};