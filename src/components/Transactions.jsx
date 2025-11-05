// components/Transactions.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { transactionService } from '../services/transactionService';

const Transactions = () => {
  const { user } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'buy', 'rent'

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await transactionService.getMyTransactions();
      setTransactions(data || []); // Fixed: data is already the array, no need for data.transactions
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (transaction) => {
    try {
      setDownloadingReceipt(transaction.transaction_id);
      
      if (transaction.product_id) {
        // Product purchase receipt
        await transactionService.downloadProductReceipt(transaction.transaction_id);
      } else if (transaction.lease_id) {
        // Lease receipt
        await transactionService.downloadLeaseReceipt(transaction.transaction_id);
      } else {
        throw new Error('Unknown transaction type');
      }

      // Show success message
      alert('Receipt downloaded successfully!');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert(err.response?.data?.message || 'Failed to download receipt. Please try again.');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const getTransactionType = (transaction) => {
    if (transaction.product_id) {
      return {
        type: 'buy',
        label: 'Product Purchase',
        icon: '🛒',
        color: 'green',
        bgColor: 'bg-green-100'
      };
    } else if (transaction.equipment_id || (transaction.lease && transaction.lease.equipment_id)) {
      return {
        type: 'rent',
        label: 'Equipment Rental',
        icon: '🛠️',
        color: 'blue',
        bgColor: 'bg-blue-100'
      };
    } else if (transaction.land_id || (transaction.lease && transaction.lease.land_id)) {
      return {
        type: 'rent',
        label: 'Land Lease',
        icon: '🌾',
        color: 'amber',
        bgColor: 'bg-amber-100'
      };
    }
    return {
      type: 'unknown',
      label: 'Unknown',
      icon: '❓',
      color: 'gray',
      bgColor: 'bg-gray-100'
    };
  };

  const getTransactionItem = (transaction) => {
    if (transaction.product) {
      return `${transaction.product.crop_name} - ${transaction.quantity} ${transaction.product.unit || 'kg'}`;
    } else if (transaction.equipment) {
      return transaction.equipment.name;
    } else if (transaction.land) {
      return `Land at ${transaction.land.location}`;
    } else if (transaction.lease) {
      if (transaction.lease.equipment) {
        return transaction.lease.equipment.name;
      } else if (transaction.lease.land) {
        return `Land at ${transaction.lease.land.location}`;
      }
    }
    return 'Unknown Item';
  };

  const getTransactionDetails = (transaction) => {
    const transactionType = getTransactionType(transaction);
    
    if (transactionType.type === 'buy') {
      return `Quantity: ${transaction.quantity} ${transaction.product?.unit || 'kg'}`;
    } else if (transactionType.type === 'rent') {
      if (transaction.lease) {
        return `${transaction.lease.total_days} days (${new Date(transaction.lease.start_date).toLocaleDateString()} - ${new Date(transaction.lease.end_date).toLocaleDateString()})`;
      }
    }
    return '';
  };

  const getTransactionParties = (transaction) => {
    if (transaction.seller) {
      return {
        type: 'Seller',
        name: `${transaction.seller.first_name || ''} ${transaction.seller.last_name || ''}`.trim() || transaction.seller.email
      };
    } else if (transaction.lease?.owner) {
      return {
        type: 'Owner',
        name: `${transaction.lease.owner.first_name || ''} ${transaction.lease.owner.last_name || ''}`.trim() || transaction.lease.owner.email
      };
    }
    return null;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const statusValue = status?.toLowerCase();
    switch (statusValue) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '₹0' : `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    
    const transactionType = getTransactionType(transaction);
    return transactionType.type === filter;
  });

  // Calculate summary statistics
  const summaryStats = {
    total: transactions.length,
    purchases: transactions.filter(t => t.product_id).length,
    rentals: transactions.filter(t => t.equipment_id || t.land_id || t.lease_id).length,
    totalAmount: transactions.reduce((sum, t) => {
      const amount = parseFloat(t.total_amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-gray-600 mt-2">View your purchase and rental history</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchTransactions}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setFilter('buy')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🛒 Product Purchases
            </button>
            <button
              onClick={() => setFilter('rent')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'rent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🛠️ Rentals
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No transactions found' : `No ${filter} transactions found`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You haven't made any transactions yet."
                  : `You haven't made any ${filter === 'buy' ? 'product purchases' : 'rentals'} yet.`
                }
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const transactionType = getTransactionType(transaction);
              const parties = getTransactionParties(transaction);
              
              return (
                <div
                  key={transaction.transaction_id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Transaction Icon */}
                        <div className={`w-12 h-12 rounded-full ${transactionType.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-xl">{transactionType.icon}</span>
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {getTransactionItem(transaction)}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)} flex-shrink-0`}>
                              {transaction.status || 'Completed'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Type:</span> {transactionType.label}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> {formatAmount(transaction.total_amount)}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {formatDate(transaction.createdAt)}
                            </div>
                            <div>
                              <span className="font-medium">Payment:</span> {transaction.payment_method || 'Demo'}
                            </div>
                          </div>

                          {/* Additional Details */}
                          {getTransactionDetails(transaction) && (
                            <div className="mt-2 text-sm text-gray-500">
                              {getTransactionDetails(transaction)}
                            </div>
                          )}

                          {/* Seller/Owner Info */}
                          {parties && (
                            <div className="mt-2 text-sm text-gray-500">
                              <span className="font-medium">{parties.type}: </span>
                              {parties.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Download Receipt Button */}
                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleDownloadReceipt(transaction)}
                          disabled={downloadingReceipt === transaction.transaction_id}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {downloadingReceipt === transaction.transaction_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Receipt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.total}</p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{summaryStats.purchases}</p>
                <p className="text-sm text-gray-600">Product Purchases</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{summaryStats.rentals}</p>
                <p className="text-sm text-gray-600">Rentals</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{formatAmount(summaryStats.totalAmount)}</p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;