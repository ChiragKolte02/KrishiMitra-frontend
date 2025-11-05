// src/services/transactionService.js

import API from "./api";


export const transactionService = {
  // ===========================
  // CREATE TRANSACTION OR LEASE
  // ===========================
  createTransaction: async (type, id, transactionData) => {
    const response = await API.post(`/transaction/create/${type}/${id}`, transactionData);
    return response.data;
  },

  // ==========================
  // BUY PRODUCT
  // ==========================
  buyProduct: async (productId, { quantity, payment_method = 'demo' }) => {
    return await transactionService.createTransaction('product', productId, {
      quantity,
      payment_method,
      transaction_type: 'buy'
    });
  },

  // ==========================
  // RENT LAND
  // ==========================
  rentLand: async (landId, { start_date, end_date, payment_method = 'demo' }) => {
    return await transactionService.createTransaction('land', landId, {
      start_date,
      end_date,
      payment_method,
      transaction_type: 'rent'
    });
  },

  // ==========================
  // RENT EQUIPMENT
  // ==========================
   rentEquipment: async (equipmentId, { start_date, end_date, payment_method = 'demo' }) => {
    const response = await API.post(`/transaction/create/equipment/${equipmentId}`, {
      start_date,
      end_date,
      payment_method,
      transaction_type: 'rent'
    });
    return response.data;
  },

  // ==========================
  // GET USER'S TRANSACTIONS
  // ==========================
  getMyTransactions: async () => {
    const response = await API.get('/transaction/my');
    return response.data.transactions;
  },

  // ==========================
  // GENERATE/DOWNLOAD PRODUCT RECEIPT PDF
  // ==========================
  downloadProductReceipt: async (transactionId) => {
    const response = await API.get(`/receipts/product/${transactionId}`, {
      responseType: 'blob' // Important for file download
    });
    
    // Create blob and download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_receipt_${transactionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  },

  // ==========================
  // GENERATE/DOWNLOAD LEASE RECEIPT PDF
  // ==========================
  downloadLeaseReceipt: async (transactionId) => {
    const response = await API.get(`/receipts/lease/${transactionId}`, {
      responseType: 'blob' // Important for file download
    });
    
    // Create blob and download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lease_receipt_${transactionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  },

  // ==========================
  // GET TRANSACTION STATUS
  // ==========================
  getTransactionStatus: (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'yellow' },
      completed: { label: 'Completed', color: 'green' },
      failed: { label: 'Failed', color: 'red' }
    };
    return statusMap[status] || { label: 'Unknown', color: 'gray' };
  }
};

// Transaction constants
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const PAYMENT_METHODS = {
  UPI: 'upi',
  CARD: 'card',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  DEMO: 'demo'
};