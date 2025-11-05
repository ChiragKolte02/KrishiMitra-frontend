// components/dashboards/LandownerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { landService } from '../../services/landService';
import { transactionService } from '../../services/transactionService';
import { leaseService } from '../../services/leaseService';
import { setMyLands, setLoading, setError } from '../../store/slices/landSlice';
import { setTransactions } from '../../store/slices/transactionSlice';
import ProductMarketplace from '../marketplace/ProductMarketplace';
import EquipmentMarketplace from '../marketplace/EquipmentMarketplace';

const LandownerDashboard = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  const userId = user?.user_id;
  
  const { myLands } = useSelector((state) => state.lands);
  const { items: transactions } = useSelector((state) => state.transactions);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    leases: [],
    activeRentals: []
  });
  const [stats, setStats] = useState({
    totalLands: 0,
    availableLands: 0,
    activeRentals: 0,
    pendingRequests: 0,
    totalLandSize: 0,
    averageDailyRate: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [marketplaceTab, setMarketplaceTab] = useState('products');

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  // Refresh stats when transactions change
  useEffect(() => {
    if (userId && transactions.length > 0) {
      const landsData = myLands;
      const leasesData = dashboardData.leases;
      calculateStats(landsData, transactions, leasesData);
    }
  }, [transactions, userId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [landsData, transactionsData, leasesData] = await Promise.all([
        landService.getMyLands(),
        transactionService.getMyTransactions(),
        leaseService.getMyLeases()
      ]);

      dispatch(setMyLands(landsData));
      dispatch(setTransactions(transactionsData));

      setDashboardData({ 
        leases: Array.isArray(leasesData) ? leasesData : []
      });
      
      calculateStats(landsData, transactionsData, leasesData);
    } catch (error) {
      console.error('Error fetching landowner data:', error);
      dispatch(setError(error.response?.data?.message || 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (lands, allTransactions, leases) => {
    const availableLands = lands.filter(l => l.is_available !== false).length;
    const totalLandSize = lands.reduce((sum, land) => sum + parseFloat(land.size_in_acres || 0), 0);
    const averageDailyRate = lands.length > 0 
      ? lands.reduce((sum, land) => sum + parseFloat(land.price_per_day || 0), 0) / lands.length 
      : 0;

    const pendingRequests = leases.filter(l => 
      l.owner_id === userId && l.status === 'pending'
    ).length;

    const activeRentals = leases.filter(l => 
      l.owner_id === userId && (l.status === 'active' || l.status === 'pending')
    ).length;

    setStats({
      totalLands: lands.length,
      availableLands,
      activeRentals,
      pendingRequests,
      totalLandSize,
      averageDailyRate
    });
  };

  const getRecentActivity = () => {
    const recentActivities = transactions
      .filter(t => t.buyer_id === userId || t.seller_id === userId)
      .slice(0, 5)
      .map(transaction => {
        const isBuyer = transaction.buyer_id === userId;
        
        if (isBuyer) {
          // User is buyer (purchased products or rented equipment)
          if (transaction.product_id) {
            return {
              id: transaction.transaction_id,
              message: `Bought ${transaction.quantity}kg ${transaction.product?.crop_name || 'product'}`,
              amount: transaction.total_amount,
              time: formatTimeAgo(transaction.createdAt),
              icon: '🛒',
              type: 'purchase',
              person: transaction.seller ? `${transaction.seller.first_name} ${transaction.seller.last_name}` : 'Seller'
            };
          } else if (transaction.lease?.equipment_id) {
            return {
              id: transaction.transaction_id,
              message: `Rented equipment for ${transaction.lease?.total_days || 1} days`,
              amount: transaction.total_amount,
              time: formatTimeAgo(transaction.createdAt),
              icon: '🚜',
              type: 'rental',
              person: transaction.seller ? `${transaction.seller.first_name} ${transaction.seller.last_name}` : 'Owner'
            };
          }
        } else {
          // User is seller (land rentals)
          if (transaction.land_id || transaction.lease?.land_id) {
            const landLocation = transaction.land?.location || transaction.lease?.land?.location || 'Land';
            const days = transaction.lease?.total_days || 1;
            return {
              id: transaction.transaction_id || transaction.lease_id,
              message: `Land in ${landLocation} rented for ${days} days`,
              amount: transaction.total_amount,
              time: formatTimeAgo(transaction.createdAt || transaction.lease?.createdAt),
              icon: '🌾',
              type: 'rental',
              person: transaction.buyer ? `${transaction.buyer.first_name} ${transaction.buyer.last_name}` : 'Renter'
            };
          }
        }
        
        // Default fallback
        return {
          id: transaction.transaction_id,
          message: isBuyer ? 'Purchase' : 'Sale',
          amount: transaction.total_amount,
          time: formatTimeAgo(transaction.createdAt),
          icon: isBuyer ? '💸' : '💰',
          type: isBuyer ? 'purchase' : 'sale',
          person: isBuyer 
            ? (transaction.seller ? `${transaction.seller.first_name} ${transaction.seller.last_name}` : 'Seller')
            : (transaction.buyer ? `${transaction.buyer.first_name} ${transaction.buyer.last_name}` : 'Customer')
        };
      })
      .filter(activity => activity !== null);

    return recentActivities;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your landowner dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.user_type !== 'landowner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only available for landowners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {user?.first_name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your land rentals and farming activities
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(user?.balance || 0)}
                  </p>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                  title="Refresh Data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Landowner Marketplace
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => document.getElementById('lands-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Lands</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLands}</p>
                    <p className="text-xs text-gray-500 mt-1">All your properties</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-xl">🌾</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => document.getElementById('lands-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Lands</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.availableLands}</p>
                    <p className="text-xs text-gray-500 mt-1">Ready for rent</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-xl">📦</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeRentals}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently rented out</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full">
                    <span className="text-xl">🛠️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="text-xl">⏳</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions & Lands */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Land Management</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your land rental business</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link
                        to="/my-lands?action=add"
                        className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                          <span className="text-xl">➕</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Add Land</p>
                          <p className="text-sm text-gray-600">List new land for rent</p>
                        </div>
                      </Link>

                      <Link
                        to="/my-lands"
                        className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Manage Lands</p>
                          <p className="text-sm text-gray-600">Edit & update listings</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => setActiveTab('marketplace')}
                        className="flex items-center p-4 border-2 border-amber-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition duration-200 group text-left w-full"
                      >
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-amber-200">
                          <span className="text-xl">🛒</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Buy Products</p>
                          <p className="text-sm text-gray-600">Purchase agricultural products</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('marketplace');
                          setMarketplaceTab('equipment');
                        }}
                        className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition duration-200 group text-left w-full"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
                          <span className="text-xl">🚜</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Rent Equipment</p>
                          <p className="text-sm text-gray-600">Lease farming equipment</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* My Lands Section */}
                <div id="lands-section" className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">My Lands</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage your land listings</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to="/my-lands?action=add"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        + Add Land
                      </Link>
                      <Link 
                        to="/my-lands" 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    {myLands.length > 0 ? (
                      <div className="space-y-4">
                        {myLands.slice(0, 4).map((land) => (
                          <div key={land.land_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-lg">🌾</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{land.location}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>₹{land.price_per_day}/day</span>
                                  <span>•</span>
                                  <span>{land.size_in_acres} acres</span>
                                  <span>•</span>
                                  <span>{land.is_verified ? 'Verified' : 'Pending'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                land.is_available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {land.is_available ? 'Available' : 'Rented'}
                              </span>
                              <Link
                                to={`/my-lands?edit=${land.land_id}`}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4">🌾</div>
                        <p className="text-gray-500 mb-2">No lands listed yet</p>
                        <p className="text-gray-400 text-sm mb-4">Start renting out your land today</p>
                        <Link 
                          to="/my-lands?action=add"
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
                        >
                          Add Your First Land
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {getRecentActivity().map((activity) => (
                        <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                          activity.type === 'rental' && activity.icon === '🌾' 
                            ? 'bg-green-50' 
                            : activity.type === 'purchase'
                            ? 'bg-blue-50'
                            : 'bg-amber-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            activity.type === 'rental' && activity.icon === '🌾'
                              ? 'bg-green-100' 
                              : activity.type === 'purchase'
                              ? 'bg-blue-100'
                              : 'bg-amber-100'
                          }`}>
                            <span className={`text-sm ${
                              activity.type === 'rental' && activity.icon === '🌾'
                                ? 'text-green-600' 
                                : activity.type === 'purchase'
                                ? 'text-blue-600'
                                : 'text-amber-600'
                            }`}>
                              {activity.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.message}
                            </p>
                            <p className="text-xs text-gray-600">{activity.person}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className={`text-sm font-semibold ${
                                activity.type === 'purchase' 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                {activity.type === 'purchase' ? '-' : ''}{formatAmount(activity.amount)}
                              </p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getRecentActivity().length === 0 && (
                        <div className="text-center py-4">
                          <div className="text-gray-400 text-4xl mb-2">📊</div>
                          <p className="text-gray-500 text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Lands</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.totalLands}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available Now</span>
                        <span className="text-sm font-semibold text-green-600">{stats.availableLands}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Rentals</span>
                        <span className="text-sm font-semibold text-blue-600">{stats.activeRentals}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Land Size</span>
                        <span className="text-sm font-semibold text-emerald-600">{stats.totalLandSize.toFixed(1)} acres</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Daily Rate</span>
                        <span className="text-sm font-semibold text-purple-600">₹{stats.averageDailyRate.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <Link to="/my-lands" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">🌾</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Lands</span>
                      </Link>
                      <Link to="/transactions" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">💰</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Transactions</span>
                      </Link>
                      <button
                        onClick={() => setActiveTab('marketplace')}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                      >
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 text-sm">🛒</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Marketplace</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Marketplace Tab */
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Landowner Marketplace</h2>
              <p className="text-gray-600 mt-1">Buy products and rent equipment for your farming needs</p>
              
              {/* Marketplace Tabs */}
              <nav className="-mb-px flex space-x-8 mt-4">
                <button
                  onClick={() => setMarketplaceTab('products')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    marketplaceTab === 'products'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🛒 Buy Products
                </button>
                <button
                  onClick={() => setMarketplaceTab('equipment')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    marketplaceTab === 'equipment'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🚜 Rent Equipment
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {marketplaceTab === 'products' && <ProductMarketplace />}
              {marketplaceTab === 'equipment' && <EquipmentMarketplace />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandownerDashboard;