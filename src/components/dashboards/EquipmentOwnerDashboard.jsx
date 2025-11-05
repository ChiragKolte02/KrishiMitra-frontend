// // components/dashboards/EquipmentOwnerDashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Link } from 'react-router-dom';
// import { equipmentService } from '../../services/equipmentService';
// import { transactionService } from '../../services/transactionService';
// import { leaseService } from '../../services/leaseService';
// import { setMyEquipment, setLoading, setError } from '../../store/slices/equipmentSlice';
// import { setTransactions } from '../../store/slices/transactionSlice';
// import ProductMarketplace from '../marketplace/ProductMarketplace';
// import LandMarketplace from '../marketplace/LandMarketplace';

// const EquipmentOwnerDashboard = () => {
//   const dispatch = useDispatch();
//   const authState = useSelector((state) => state.auth);
  
//   const getUser = () => {
//     if (authState.user?.user_id) return authState.user;
//     if (authState.user?.user?.user_id) return authState.user.user;
//     return null;
//   };

//   const user = getUser();
//   const userId = user?.user_id;
  
//   const { myEquipment } = useSelector((state) => state.equipment);
//   const { items: transactions } = useSelector((state) => state.transactions);
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [dashboardData, setDashboardData] = useState({
//     leases: [],
//     activeRentals: []
//   });
//   const [stats, setStats] = useState({
//     totalEquipment: 0,
//     availableEquipment: 0,
//     totalRentals: 0,
//     activeRentals: 0,
//     totalEarnings: 0,
//     pendingRequests: 0,
//     equipmentBalance: 0
//   });
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [marketplaceTab, setMarketplaceTab] = useState('products');

//   useEffect(() => {
//     if (userId) {
//       fetchDashboardData();
//     }
//   }, [userId]);

//   // Refresh stats when transactions change
//   useEffect(() => {
//     if (userId && transactions.length > 0) {
//       const equipmentData = myEquipment;
//       const leasesData = dashboardData.leases;
//       calculateStats(equipmentData, transactions, leasesData);
//     }
//   }, [transactions, userId]);

//   const fetchDashboardData = async () => {
//     try {
//       setIsLoading(true);
      
//       const [equipmentData, transactionsData, leasesData] = await Promise.all([
//         equipmentService.getMyEquipment(),
//         transactionService.getMyTransactions(),
//         leaseService.getMyLeases()
//       ]);

//       dispatch(setMyEquipment(equipmentData));
//       dispatch(setTransactions(transactionsData));

//       setDashboardData({ 
//         leases: Array.isArray(leasesData) ? leasesData : []
//       });
      
//       calculateStats(equipmentData, transactionsData, leasesData);
//     } catch (error) {
//       console.error('Error fetching equipment owner data:', error);
//       dispatch(setError(error.response?.data?.message || 'Failed to load dashboard data'));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateStats = (equipment, allTransactions, leases) => {
//     const availableEquipment = equipment.filter(e => e.is_available !== false).length;
    
//     // Filter transactions where user is the owner (equipment rentals) and status is completed
//     const rentalTransactions = allTransactions.filter(t => {
//       // Case 1: Direct equipment rental transaction where user is seller
//       if (t.seller_id === userId && t.equipment_id && t.status === 'completed') {
//         return true;
//       }
//       // Case 2: Lease-based equipment rental where user is owner
//       if (t.lease && t.lease.owner_id === userId && t.lease.equipment_id && t.status === 'completed') {
//         return true;
//       }
//       // Case 3: Transaction linked to lease where user is equipment owner
//       if (t.lease_id) {
//         const relatedLease = leases.find(l => l.lease_id === t.lease_id);
//         if (relatedLease && relatedLease.owner_id === userId && relatedLease.equipment_id && t.status === 'completed') {
//           return true;
//         }
//       }
//       return false;
//     });
    
//     console.log('Rental Transactions for earnings:', rentalTransactions);

//     // Calculate total earnings from equipment rentals
//     const totalEarnings = rentalTransactions.reduce((sum, rental) => {
//       const amount = parseFloat(rental.total_amount) || 0;
//       return sum + amount;
//     }, 0);

//     // Calculate equipment balance (user's current balance from profile)
//     const equipmentBalance = parseFloat(user?.balance) || 0;

//     // Calculate expenses (when user buys products or rents land/equipment as buyer)
//     const expenseTransactions = allTransactions.filter(t => 
//       t.buyer_id === userId && t.status === 'completed'
//     );
    
//     const totalExpenses = expenseTransactions.reduce((sum, expense) => {
//       const amount = parseFloat(expense.total_amount) || 0;
//       return sum + amount;
//     }, 0);

//     // Calculate net balance
//     const netBalance = equipmentBalance + totalEarnings - totalExpenses;

//     const pendingRequests = leases.filter(l => 
//       l.owner_id === userId && l.status === 'pending'
//     ).length;

//     const activeRentals = leases.filter(l => 
//       l.owner_id === userId && (l.status === 'active' || l.status === 'pending')
//     ).length;

//     console.log('Final Stats:', {
//       totalEarnings,
//       equipmentBalance,
//       totalExpenses,
//       netBalance,
//       rentalCount: rentalTransactions.length
//     });

//     setStats({
//       totalEquipment: equipment.length,
//       availableEquipment,
//       totalRentals: rentalTransactions.length,
//       activeRentals,
//       totalEarnings,
//       pendingRequests,
//       equipmentBalance,
//       totalExpenses,
//       netBalance
//     });
//   };

//   const getRecentRentals = () => {
//     const recentRentals = transactions
//       .filter(t => {
//         // Include transactions where user is equipment owner
//         if (t.seller_id === userId && (t.equipment_id || t.lease?.equipment_id) && t.status === 'completed') {
//           return true;
//         }
//         // Include lease transactions where user is equipment owner
//         if (t.lease && t.lease.owner_id === userId && t.lease.equipment_id && t.status === 'completed') {
//           return true;
//         }
//         return false;
//       })
//       .slice(0, 5)
//       .map(rental => {
//         const equipmentName = rental.equipment?.name || rental.lease?.equipment?.name || 'Equipment';
//         const days = rental.lease?.total_days || 1;
//         const amount = rental.total_amount;
        
//         return {
//           id: rental.transaction_id || rental.lease_id,
//           message: `${equipmentName} rented for ${days} days`,
//           amount: amount,
//           time: formatTimeAgo(rental.createdAt || rental.lease?.createdAt),
//           icon: '💰',
//           renter: rental.buyer ? `${rental.buyer.first_name} ${rental.buyer.last_name}` : 'Renter'
//         };
//       });

//     return recentRentals;
//   };

//   const getRecentExpenses = () => {
//     return transactions
//       .filter(t => t.buyer_id === userId && t.status === 'completed')
//       .slice(0, 3)
//       .map(expense => {
//         let message = '';
//         let icon = '💸';
        
//         if (expense.product_id) {
//           message = `Bought ${expense.quantity}kg ${expense.product?.crop_name || 'product'}`;
//           icon = '🛒';
//         } else if (expense.lease?.land_id) {
//           message = `Rented land for ${expense.lease?.total_days || 1} days`;
//           icon = '🌾';
//         } else if (expense.lease?.equipment_id) {
//           message = `Rented equipment for ${expense.lease?.total_days || 1} days`;
//           icon = '🚜';
//         } else {
//           message = 'Purchase';
//         }
        
//         return {
//           id: expense.transaction_id,
//           message,
//           amount: expense.total_amount,
//           time: formatTimeAgo(expense.createdAt),
//           icon,
//           type: expense.product_id ? 'product' : 'rental'
//         };
//       });
//   };

//   const getTopRentedEquipment = () => {
//     const equipmentRentals = {};
    
//     transactions
//       .filter(t => {
//         if (t.seller_id === userId && (t.equipment_id || t.lease?.equipment_id) && t.status === 'completed') {
//           return true;
//         }
//         if (t.lease && t.lease.owner_id === userId && t.lease.equipment_id && t.status === 'completed') {
//           return true;
//         }
//         return false;
//       })
//       .forEach(rental => {
//         const equipmentId = rental.equipment_id || rental.lease?.equipment_id;
//         if (!equipmentRentals[equipmentId]) {
//           equipmentRentals[equipmentId] = {
//             equipment: rental.equipment || rental.lease?.equipment,
//             totalRevenue: 0,
//             rentalCount: 0,
//             totalDays: 0
//           };
//         }
//         equipmentRentals[equipmentId].totalRevenue += parseFloat(rental.total_amount) || 0;
//         equipmentRentals[equipmentId].rentalCount += 1;
//         equipmentRentals[equipmentId].totalDays += rental.lease?.total_days || 1;
//       });

//     return Object.values(equipmentRentals)
//       .sort((a, b) => b.totalRevenue - a.totalRevenue)
//       .slice(0, 3);
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return 'Recently';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMs / 3600000);
//     const diffDays = Math.floor(diffMs / 86400000);

//     if (diffMins < 60) return `${diffMins}m ago`;
//     if (diffHours < 24) return `${diffHours}h ago`;
//     if (diffDays < 7) return `${diffDays}d ago`;
//     return date.toLocaleDateString();
//   };

//   const formatAmount = (amount) => {
//     return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading your equipment dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (user?.user_type !== 'equipment_owner') {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-6xl mb-4">🚫</div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
//           <p className="text-gray-600">This dashboard is only available for equipment owners.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-blue-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   Welcome, {user?.first_name}!
//                 </h1>
//                 <p className="text-gray-600 mt-1">
//                   Manage your equipment rentals and earnings
//                 </p>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <div className="text-right">
//                   <p className="text-sm text-gray-600">Current Balance</p>
//                   <p className="text-2xl font-bold text-blue-600">
//                     {formatAmount(stats.equipmentBalance)}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     Earnings: {formatAmount(stats.totalEarnings)}
//                   </p>
//                 </div>
//                 <button
//                   onClick={fetchDashboardData}
//                   className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
//                   title="Refresh Data"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Navigation Tabs */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex space-x-8">
//             <button
//               onClick={() => setActiveTab('dashboard')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'dashboard'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Dashboard
//             </button>
//             <button
//               onClick={() => setActiveTab('marketplace')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'marketplace'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Equipment Marketplace
//             </button>
//           </div>
//         </div>
//       </div>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {activeTab === 'dashboard' ? (
//           <>
//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('equipment-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Available Equipment</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.availableEquipment}</p>
//                     <p className="text-xs text-gray-500 mt-1">Ready for rent</p>
//                   </div>
//                   <div className="p-3 bg-blue-100 rounded-full">
//                     <span className="text-xl">🚜</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('rentals-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Active Rentals</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.activeRentals}</p>
//                     <p className="text-xs text-gray-500 mt-1">Currently rented out</p>
//                   </div>
//                   <div className="p-3 bg-green-100 rounded-full">
//                     <span className="text-xl">📊</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Pending Requests</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
//                     <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
//                   </div>
//                   <div className="p-3 bg-amber-100 rounded-full">
//                     <span className="text-xl">⏳</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('earnings-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Total Earnings</p>
//                     <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalEarnings)}</p>
//                     <p className="text-xs text-gray-500 mt-1">From equipment rentals</p>
//                   </div>
//                   <div className="p-3 bg-emerald-100 rounded-full">
//                     <span className="text-xl">💵</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//               {/* Quick Actions & Equipment */}
//               <div className="lg:col-span-2 space-y-6">
//                 {/* Quick Actions */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Equipment Actions</h3>
//                     <p className="text-sm text-gray-600 mt-1">Manage your equipment rental business</p>
//                   </div>
//                   <div className="p-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <Link
//                         to="/my-equipment?action=add"
//                         className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
//                           <span className="text-xl">➕</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Add Equipment</p>
//                           <p className="text-sm text-gray-600">List new equipment for rent</p>
//                         </div>
//                       </Link>

//                       <Link
//                         to="/my-equipment"
//                         className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
//                           <span className="text-xl">📊</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Manage Equipment</p>
//                           <p className="text-sm text-gray-600">Edit & update listings</p>
//                         </div>
//                       </Link>

//                       <button
//                         onClick={() => setActiveTab('marketplace')}
//                         className="flex items-center p-4 border-2 border-amber-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition duration-200 group text-left w-full"
//                       >
//                         <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-amber-200">
//                           <span className="text-xl">🛒</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Buy Products</p>
//                           <p className="text-sm text-gray-600">Purchase agricultural products</p>
//                         </div>
//                       </button>

//                       <button
//                         onClick={() => {
//                           setActiveTab('marketplace');
//                           setMarketplaceTab('land');
//                         }}
//                         className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition duration-200 group text-left w-full"
//                       >
//                         <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
//                           <span className="text-xl">🌾</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Rent Land</p>
//                           <p className="text-sm text-gray-600">Lease farming land</p>
//                         </div>
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* My Equipment Section */}
//                 <div id="equipment-section" className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b flex justify-between items-center">
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">My Equipment</h3>
//                       <p className="text-sm text-gray-600 mt-1">Manage your equipment listings</p>
//                     </div>
//                     <div className="flex space-x-2">
//                       <Link 
//                         to="/my-equipment?action=add"
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
//                       >
//                         + Add Equipment
//                       </Link>
//                       <Link 
//                         to="/my-equipment" 
//                         className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
//                       >
//                         View All
//                       </Link>
//                     </div>
//                   </div>
//                   <div className="p-6">
//                     {myEquipment.length > 0 ? (
//                       <div className="space-y-4">
//                         {myEquipment.slice(0, 4).map((equipment) => (
//                           <div key={equipment.equipment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
//                             <div className="flex items-center space-x-4 flex-1">
//                               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
//                                 <span className="text-blue-600 text-lg">🚜</span>
//                               </div>
//                               <div className="flex-1 min-w-0">
//                                 <p className="font-semibold text-gray-900 truncate">{equipment.name}</p>
//                                 <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
//                                   <span>₹{equipment.rent_price_per_day}/day</span>
//                                   <span>•</span>
//                                   <span className="capitalize">{equipment.type}</span>
//                                   <span>•</span>
//                                   <span>{equipment.brand}</span>
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="flex items-center space-x-3">
//                               <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                                 equipment.is_available 
//                                   ? 'bg-green-100 text-green-800' 
//                                   : 'bg-gray-100 text-gray-800'
//                               }`}>
//                                 {equipment.is_available ? 'Available' : 'Rented'}
//                               </span>
//                               <Link
//                                 to={`/my-equipment?edit=${equipment.equipment_id}`}
//                                 className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                               >
//                                 Edit
//                               </Link>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-8">
//                         <div className="text-gray-400 text-6xl mb-4">🚜</div>
//                         <p className="text-gray-500 mb-2">No equipment listed yet</p>
//                         <p className="text-gray-400 text-sm mb-4">Start renting out your equipment today</p>
//                         <Link 
//                           to="/my-equipment?action=add"
//                           className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
//                         >
//                           Add Your First Equipment
//                         </Link>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Earnings Analytics Section */}
//                 <div id="earnings-section" className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b flex justify-between items-center">
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
//                       <p className="text-sm text-gray-600 mt-1">Your equipment business performance</p>
//                     </div>
//                     <Link 
//                       to="/transactions" 
//                       className="text-blue-600 hover:text-blue-700 text-sm font-medium"
//                     >
//                       View All Transactions
//                     </Link>
//                   </div>
//                   <div className="p-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-sm font-medium text-green-800">Total Earnings</p>
//                             <p className="text-2xl font-bold text-green-900">{formatAmount(stats.totalEarnings)}</p>
//                             <p className="text-xs text-green-600">From {stats.totalRentals} rentals</p>
//                           </div>
//                           <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
//                             <span className="text-green-600 text-lg">💰</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-sm font-medium text-blue-800">Current Balance</p>
//                             <p className="text-2xl font-bold text-blue-900">{formatAmount(stats.equipmentBalance)}</p>
//                             <p className="text-xs text-blue-600">Available funds</p>
//                           </div>
//                           <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
//                             <span className="text-blue-600 text-lg">💳</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {getTopRentedEquipment().length > 0 ? (
//                       <div className="space-y-4">
//                         <h4 className="font-medium text-gray-900 mb-3">Top Rented Equipment</h4>
//                         {getTopRentedEquipment().map((item, index) => (
//                           <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                             <div className="flex items-center space-x-3">
//                               <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                                 <span className="text-green-600 text-sm">🏆</span>
//                               </div>
//                               <div>
//                                 <p className="font-medium text-gray-900">{item.equipment.name}</p>
//                                 <p className="text-sm text-gray-600">{item.rentalCount} rentals</p>
//                               </div>
//                             </div>
//                             <div className="text-right">
//                               <p className="font-semibold text-green-600">{formatAmount(item.totalRevenue)}</p>
//                               <p className="text-xs text-gray-500">{item.totalDays} total days</p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-6">
//                         <div className="text-gray-400 text-4xl mb-3">📊</div>
//                         <p className="text-gray-500">No rental data yet</p>
//                         <p className="text-gray-400 text-sm mt-1">Start renting to see analytics</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Sidebar */}
//               <div className="space-y-6">
//                 {/* Recent Rentals */}
//                 <div id="rentals-section" className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Recent Rentals</h3>
//                   </div>
//                   <div className="p-6">
//                     <div className="space-y-4">
//                       {getRecentRentals().map((rental) => (
//                         <div key={rental.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
//                           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                             <span className="text-blue-600 text-sm">💰</span>
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-900">
//                               {rental.message}
//                             </p>
//                             <p className="text-xs text-gray-600">{rental.renter}</p>
//                             <div className="flex justify-between items-center mt-1">
//                               <p className="text-sm font-semibold text-green-600">
//                                 {formatAmount(rental.amount)}
//                               </p>
//                               <p className="text-xs text-gray-500">{rental.time}</p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                       {getRecentRentals().length === 0 && (
//                         <div className="text-center py-4">
//                           <div className="text-gray-400 text-4xl mb-2">💸</div>
//                           <p className="text-gray-500 text-sm">No recent rentals</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Recent Expenses */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
//                   </div>
//                   <div className="p-6">
//                     <div className="space-y-4">
//                       {getRecentExpenses().map((expense) => (
//                         <div key={expense.id} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
//                           <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                             <span className="text-amber-600 text-sm">{expense.icon}</span>
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-900">
//                               {expense.message}
//                             </p>
//                             <div className="flex justify-between items-center mt-1">
//                               <p className="text-sm font-semibold text-red-600">
//                                 -{formatAmount(expense.amount)}
//                               </p>
//                               <p className="text-xs text-gray-500">{expense.time}</p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                       {getRecentExpenses().length === 0 && (
//                         <div className="text-center py-4">
//                           <div className="text-gray-400 text-4xl mb-2">💳</div>
//                           <p className="text-gray-500 text-sm">No recent expenses</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quick Stats */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
//                   </div>
//                   <div className="p-6">
//                     <div className="space-y-4">
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Total Equipment</span>
//                         <span className="text-sm font-semibold text-gray-900">{stats.totalEquipment}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Available Now</span>
//                         <span className="text-sm font-semibold text-green-600">{stats.availableEquipment}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Pending Requests</span>
//                         <span className="text-sm font-semibold text-amber-600">{stats.pendingRequests}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Total Revenue</span>
//                         <span className="text-sm font-semibold text-emerald-600">{formatAmount(stats.totalEarnings)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </>
//         ) : (
//           /* Marketplace Tab */
//           <div className="bg-white rounded-xl shadow-sm border">
//             <div className="px-6 py-4 border-b">
//               <h2 className="text-2xl font-bold text-gray-900">Equipment Marketplace</h2>
//               <p className="text-gray-600 mt-1">Buy products and rent land for your farming needs</p>
              
//               {/* Marketplace Tabs */}
//               <nav className="-mb-px flex space-x-8 mt-4">
//                 <button
//                   onClick={() => setMarketplaceTab('products')}
//                   className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
//                     marketplaceTab === 'products'
//                       ? 'border-green-500 text-green-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   🛒 Buy Products
//                 </button>
//                 <button
//                   onClick={() => setMarketplaceTab('land')}
//                   className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
//                     marketplaceTab === 'land'
//                       ? 'border-purple-500 text-purple-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   🌾 Rent Land
//                 </button>
//               </nav>
//             </div>
            
//             <div className="p-6">
//               {marketplaceTab === 'products' && <ProductMarketplace />}
//               {marketplaceTab === 'land' && <LandMarketplace />}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default EquipmentOwnerDashboard;

// components/dashboards/EquipmentOwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { equipmentService } from '../../services/equipmentService';
import { transactionService } from '../../services/transactionService';
import { leaseService } from '../../services/leaseService';
import { setMyEquipment, setLoading, setError } from '../../store/slices/equipmentSlice';
import { setTransactions } from '../../store/slices/transactionSlice';
import ProductMarketplace from '../marketplace/ProductMarketplace';
import LandMarketplace from '../marketplace/LandMarketplace';

const EquipmentOwnerDashboard = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  const userId = user?.user_id;
  
  const { myEquipment } = useSelector((state) => state.equipment);
  const { items: transactions } = useSelector((state) => state.transactions);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    leases: []
  });
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    activeRentals: 0,
    pendingRequests: 0,
    totalEquipmentValue: 0,
    averageDailyRate: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [marketplaceTab, setMarketplaceTab] = useState('products');

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [equipmentData, transactionsData, leasesData] = await Promise.all([
        equipmentService.getMyEquipment(),
        transactionService.getMyTransactions(),
        leaseService.getMyLeases()
      ]);

      dispatch(setMyEquipment(equipmentData));
      dispatch(setTransactions(transactionsData));

      setDashboardData({ 
        leases: Array.isArray(leasesData) ? leasesData : []
      });
      
      calculateStats(equipmentData, transactionsData, leasesData);
    } catch (error) {
      console.error('Error fetching equipment owner data:', error);
      dispatch(setError(error.response?.data?.message || 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (equipment, allTransactions, leases) => {
    const availableEquipment = equipment.filter(e => e.is_available !== false).length;
    
    // Calculate total equipment value (sum of daily rates as approximation)
    const totalEquipmentValue = equipment.reduce((sum, item) => 
      sum + parseFloat(item.rent_price_per_day || 0), 0
    );
    
    const averageDailyRate = equipment.length > 0 
      ? totalEquipmentValue / equipment.length 
      : 0;

    const pendingRequests = leases.filter(l => 
      l.owner_id === userId && l.status === 'pending'
    ).length;

    const activeRentals = leases.filter(l => 
      l.owner_id === userId && (l.status === 'active' || l.status === 'pending')
    ).length;

    setStats({
      totalEquipment: equipment.length,
      availableEquipment,
      activeRentals,
      pendingRequests,
      totalEquipmentValue,
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
          // User is buyer (purchased products or rented land)
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
          } else if (transaction.lease?.land_id) {
            return {
              id: transaction.transaction_id,
              message: `Rented land for ${transaction.lease?.total_days || 1} days`,
              amount: transaction.total_amount,
              time: formatTimeAgo(transaction.createdAt),
              icon: '🌾',
              type: 'rental',
              person: transaction.seller ? `${transaction.seller.first_name} ${transaction.seller.last_name}` : 'Owner'
            };
          }
        } else {
          // User is seller (equipment rentals)
          if (transaction.equipment_id || transaction.lease?.equipment_id) {
            const equipmentName = transaction.equipment?.name || transaction.lease?.equipment?.name || 'Equipment';
            const days = transaction.lease?.total_days || 1;
            return {
              id: transaction.transaction_id || transaction.lease_id,
              message: `${equipmentName} rented for ${days} days`,
              amount: transaction.total_amount,
              time: formatTimeAgo(transaction.createdAt || transaction.lease?.createdAt),
              icon: '🚜',
              type: 'rental',
              person: transaction.buyer ? `${transaction.buyer.first_name} ${transaction.buyer.last_name}` : 'Renter'
            };
          }
        }
        
        // Default fallback
        return {
          id: transaction.transaction_id,
          message: isBuyer ? 'Purchase' : 'Rental',
          amount: transaction.total_amount,
          time: formatTimeAgo(transaction.createdAt),
          icon: isBuyer ? '💸' : '💰',
          type: isBuyer ? 'purchase' : 'rental',
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
          <p className="text-gray-600">Loading your equipment dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.user_type !== 'equipment_owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only available for equipment owners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
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
                  Manage your equipment rentals and farming activities
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
              Equipment Owner Marketplace
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
                   onClick={() => document.getElementById('equipment-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEquipment}</p>
                    <p className="text-xs text-gray-500 mt-1">All your equipment</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-xl">🚜</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => document.getElementById('equipment-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Equipment</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.availableEquipment}</p>
                    <p className="text-xs text-gray-500 mt-1">Ready for rent</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
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
              {/* Quick Actions & Equipment */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Equipment Management</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your equipment rental business</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link
                        to="/my-equipment?action=add"
                        className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                          <span className="text-xl">➕</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Add Equipment</p>
                          <p className="text-sm text-gray-600">List new equipment for rent</p>
                        </div>
                      </Link>

                      <Link
                        to="/my-equipment"
                        className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Manage Equipment</p>
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
                          setMarketplaceTab('land');
                        }}
                        className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition duration-200 group text-left w-full"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
                          <span className="text-xl">🌾</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Rent Land</p>
                          <p className="text-sm text-gray-600">Lease farming land</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* My Equipment Section */}
                <div id="equipment-section" className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">My Equipment</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage your equipment listings</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to="/my-equipment?action=add"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        + Add Equipment
                      </Link>
                      <Link 
                        to="/my-equipment" 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    {myEquipment.length > 0 ? (
                      <div className="space-y-4">
                        {myEquipment.slice(0, 4).map((equipment) => (
                          <div key={equipment.equipment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-lg">🚜</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{equipment.name}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>₹{equipment.rent_price_per_day}/day</span>
                                  <span>•</span>
                                  <span className="capitalize">{equipment.type}</span>
                                  <span>•</span>
                                  <span>{equipment.brand}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                equipment.is_available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {equipment.is_available ? 'Available' : 'Rented'}
                              </span>
                              <Link
                                to={`/my-equipment?edit=${equipment.equipment_id}`}
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
                        <div className="text-gray-400 text-6xl mb-4">🚜</div>
                        <p className="text-gray-500 mb-2">No equipment listed yet</p>
                        <p className="text-gray-400 text-sm mb-4">Start renting out your equipment today</p>
                        <Link 
                          to="/my-equipment?action=add"
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
                        >
                          Add Your First Equipment
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
                          activity.type === 'rental' && activity.icon === '🚜' 
                            ? 'bg-blue-50' 
                            : activity.type === 'purchase'
                            ? 'bg-amber-50'
                            : 'bg-green-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            activity.type === 'rental' && activity.icon === '🚜'
                              ? 'bg-blue-100' 
                              : activity.type === 'purchase'
                              ? 'bg-amber-100'
                              : 'bg-green-100'
                          }`}>
                            <span className={`text-sm ${
                              activity.type === 'rental' && activity.icon === '🚜'
                                ? 'text-blue-600' 
                                : activity.type === 'purchase'
                                ? 'text-amber-600'
                                : 'text-green-600'
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
                        <span className="text-sm text-gray-600">Total Equipment</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.totalEquipment}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available Now</span>
                        <span className="text-sm font-semibold text-green-600">{stats.availableEquipment}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Rentals</span>
                        <span className="text-sm font-semibold text-blue-600">{stats.activeRentals}</span>
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
                      <Link to="/my-equipment" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🚜</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Equipment</span>
                      </Link>
                      <Link to="/transactions" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">💰</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Equipment Owner Marketplace</h2>
              <p className="text-gray-600 mt-1">Buy products and rent land for your farming needs</p>
              
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
                  onClick={() => setMarketplaceTab('land')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    marketplaceTab === 'land'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🌾 Rent Land
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {marketplaceTab === 'products' && <ProductMarketplace />}
              {marketplaceTab === 'land' && <LandMarketplace />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EquipmentOwnerDashboard;