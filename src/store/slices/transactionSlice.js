// store/slices/transactionSlice.js
import { createSlice } from '@reduxjs/toolkit';

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    currentTransaction: null,
    loading: false,
    error: null,
    filters: {
      type: 'all', // 'all', 'buy', 'rent'
      status: 'all', // 'all', 'completed', 'pending', 'failed'
      dateRange: {
        start: null,
        end: null
      }
    },
    stats: {
      total: 0,
      purchases: 0,
      rentals: 0,
      totalAmount: 0
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

    // Set all transactions
    setTransactions: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
      
      // Calculate stats
      state.stats = calculateStats(action.payload);
    },

    // Set current transaction (for detail view)
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Clear current transaction
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },

    // Add new transaction (for real-time updates)
    addTransaction: (state, action) => {
      state.items.unshift(action.payload);
      state.stats = calculateStats(state.items);
      state.error = null;
    },

    // Update transaction status
    updateTransactionStatus: (state, action) => {
      const { transactionId, status } = action.payload;
      const transaction = state.items.find(t => t.transaction_id === transactionId);
      if (transaction) {
        transaction.status = status;
      }
      
      if (state.currentTransaction && state.currentTransaction.transaction_id === transactionId) {
        state.currentTransaction.status = status;
      }
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        type: 'all',
        status: 'all',
        dateRange: {
          start: null,
          end: null
        }
      };
    },

    // Update transaction stats
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    }
  }
});

// Helper function to calculate transaction statistics
const calculateStats = (transactions) => {
  const purchases = transactions.filter(t => t.product_id).length;
  const rentals = transactions.filter(t => t.equipment_id || t.land_id || t.lease_id).length;
  const totalAmount = transactions.reduce((sum, t) => {
    const amount = parseFloat(t.total_amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return {
    total: transactions.length,
    purchases,
    rentals,
    totalAmount
  };
};

export const {
  setLoading,
  setError,
  clearError,
  setTransactions,
  setCurrentTransaction,
  clearCurrentTransaction,
  addTransaction,
  updateTransactionStatus,
  updateFilters,
  clearFilters,
  updateStats
} = transactionSlice.actions;

export default transactionSlice.reducer;