// src/services/leaseService.js

import API from "./api";


export const leaseService = {
  // =====================
  // GET MY LEASES (Renter only)
  // =====================
  getMyLeases: async () => {
    const response = await API.get('/lease/my-leases');
    return response.data;
  },

  // =====================
  // UPDATE LEASE STATUS (Owner only)
  // =====================
  updateLeaseStatus: async (leaseId, status) => {
    const response = await API.patch(`/lease/update-status/${leaseId}`, { status });
    return response.data;
  },

  // =====================
  // GET LEASE BY ID
  // =====================
  getLeaseById: async (leaseId) => {
    // Note: This endpoint might need to be added to your backend
    const response = await API.get(`/lease/${leaseId}`);
    return response.data;
  },

  // =====================
  // CALCULATE LEASE AMOUNT
  // =====================
  calculateLeaseAmount: (pricePerDay, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      totalDays,
      totalAmount: (pricePerDay * totalDays).toFixed(2)
    };
  },

  // =====================
  // VALIDATE LEASE DATES
  // =====================
  validateLeaseDates: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (start < today) {
      return { valid: false, error: 'Start date cannot be in the past' };
    }
    
    if (end <= start) {
      return { valid: false, error: 'End date must be after start date' };
    }
    
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (totalDays < 1) {
      return { valid: false, error: 'Minimum lease duration is 1 day' };
    }
    
    return { valid: true, totalDays };
  },

  // =====================
  // GET LEASE STATUS INFO
  // =====================
  getLeaseStatusInfo: (status) => {
    const statusMap = {
      pending: { label: 'Pending Approval', color: 'yellow', badge: '⏳' },
      approved: { label: 'Approved', color: 'blue', badge: '✅' },
      active: { label: 'Active', color: 'green', badge: '🔵' },
      completed: { label: 'Completed', color: 'green', badge: '✅' },
      cancelled: { label: 'Cancelled', color: 'red', badge: '❌' },
      rejected: { label: 'Rejected', color: 'red', badge: '🚫' }
    };
    
    return statusMap[status] || { label: 'Unknown', color: 'gray', badge: '❓' };
  }
};

// Lease constants
export const LEASE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

export const LEASE_TYPES = {
  LAND: 'land',
  EQUIPMENT: 'equipment'
};