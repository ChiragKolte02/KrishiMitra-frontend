// // components/dashboards/FarmerDashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Link } from 'react-router-dom';
// import { productService } from '../../services/productService';
// import { transactionService } from '../../services/transactionService';
// import { leaseService } from '../../services/leaseService';
// import { setMyProducts, setLoading, setError } from '../../store/slices/productSlice';
// import { setTransactions } from '../../store/slices/transactionSlice';

// // Import the marketplace components
// import ProductMarketplace from '../marketplace/ProductMarketplace';
// import EquipmentMarketplace from '../marketplace/EquipmentMarketplace';
// import LandMarketplace from '../marketplace/LandMarketplace';

// const FarmerDashboard = () => {
//   const dispatch = useDispatch();
//   const { user: authUser } = useSelector((state) => state.auth);
  
//   // Extract the actual user data from nested structure
//   const user = authUser?.user;
//   const userId = user?.user_id;
  
//   const { myProducts } = useSelector((state) => state.products);
//   const { items: transactions } = useSelector((state) => state.transactions);
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'marketplace'
//   const [marketplaceTab, setMarketplaceTab] = useState('products'); // 'products', 'equipment', 'land'
//   const [dashboardData, setDashboardData] = useState({
//     leases: []
//   });
//   const [stats, setStats] = useState({
//     totalProducts: 0,
//     activeProducts: 0,
//     totalSales: 0,
//     pendingOrders: 0,
//     totalEarnings: 0,
//     activeRentals: 0,
//     monthlyEarnings: 0,
//     weeklyEarnings: 0,
//     todayEarnings: 0
//   });

//   useEffect(() => {
//     if (userId) {
//       fetchDashboardData();
//     }
//   }, [userId]);

//   const fetchDashboardData = async () => {
//     try {
//       setIsLoading(true);
      
//       const [productsData, transactionsData, leasesData] = await Promise.all([
//         productService.getMyProducts(),
//         transactionService.getMyTransactions(),
//         leaseService.getMyLeases()
//       ]);

//       // Update Redux store
//       dispatch(setMyProducts(productsData));
//       dispatch(setTransactions(transactionsData));

//       setDashboardData({ 
//         leases: Array.isArray(leasesData) ? leasesData : []
//       });
      
//       calculateStats(productsData, transactionsData, leasesData);
//     } catch (error) {
//       console.error('Error fetching farmer data:', error);
//       dispatch(setError(error.response?.data?.message || 'Failed to load dashboard data'));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateStats = (products, allTransactions, leases) => {
//     const activeProducts = products.filter(p => p.is_available !== false).length;
    
//     // Filter transactions where user is the seller (product sales)
//     const salesTransactions = allTransactions.filter(t => 
//       t.seller_id === userId && t.product_id && t.status === 'completed'
//     );

//     // Calculate earnings with different time periods
//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const weekAgo = new Date(today);
//     weekAgo.setDate(weekAgo.getDate() - 7);
//     const monthAgo = new Date(today);
//     monthAgo.setMonth(monthAgo.getMonth() - 1);

//     let totalEarnings = 0;
//     let monthlyEarnings = 0;
//     let weeklyEarnings = 0;
//     let todayEarnings = 0;

//     salesTransactions.forEach(sale => {
//       const saleDate = new Date(sale.createdAt);
//       const amount = parseFloat(sale.total_amount) || 0;
      
//       totalEarnings += amount;
      
//       if (saleDate >= monthAgo) {
//         monthlyEarnings += amount;
//       }
      
//       if (saleDate >= weekAgo) {
//         weeklyEarnings += amount;
//       }
      
//       if (saleDate >= today) {
//         todayEarnings += amount;
//       }
//     });

//     const pendingOrders = allTransactions.filter(t => 
//       t.seller_id === userId && t.status === 'pending'
//     ).length;

//     const activeRentals = leases.filter(l => 
//       l.renter_id === userId && (l.status === 'active' || l.status === 'pending')
//     ).length;

//     setStats({
//       totalProducts: products.length,
//       activeProducts,
//       totalSales: salesTransactions.length,
//       pendingOrders,
//       totalEarnings,
//       monthlyEarnings,
//       weeklyEarnings,
//       todayEarnings,
//       activeRentals
//     });
//   };

//   const getRecentSales = () => {
//     return transactions
//       .filter(t => t.seller_id === userId && t.product_id)
//       .slice(0, 5)
//       .map(sale => {
//         const productName = sale.product?.crop_name || 'Product';
//         const quantity = sale.quantity || 1;
//         const unit = sale.product?.unit || 'kg';
        
//         return {
//           id: sale.transaction_id,
//           message: `Sold ${quantity}${unit} ${productName}`,
//           amount: sale.total_amount,
//           time: formatTimeAgo(sale.createdAt),
//           icon: '💰',
//           buyer: sale.buyer ? `${sale.buyer.first_name} ${sale.buyer.last_name}` : 'Customer'
//         };
//       });
//   };

//   const getTopSellingProducts = () => {
//     const productSales = {};
    
//     transactions
//       .filter(t => t.seller_id === userId && t.product_id && t.status === 'completed')
//       .forEach(sale => {
//         const productId = sale.product_id;
//         if (!productSales[productId]) {
//           productSales[productId] = {
//             product: sale.product,
//             totalQuantity: 0,
//             totalRevenue: 0,
//             salesCount: 0
//           };
//         }
//         productSales[productId].totalQuantity += parseFloat(sale.quantity) || 0;
//         productSales[productId].totalRevenue += parseFloat(sale.total_amount) || 0;
//         productSales[productId].salesCount += 1;
//       });

//     return Object.values(productSales)
//       .sort((a, b) => b.totalRevenue - a.totalRevenue)
//       .slice(0, 3);
//   };

//   const formatTimeAgo = (dateString) => {
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

//   const getEarningsTrend = () => {
//     if (stats.weeklyEarnings > stats.monthlyEarnings / 4) {
//       return { trend: 'up', text: 'Growing' };
//     } else if (stats.weeklyEarnings < stats.monthlyEarnings / 4) {
//       return { trend: 'down', text: 'Declining' };
//     } else {
//       return { trend: 'stable', text: 'Stable' };
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading your farming dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
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
//                   Manage your crops, sales, and rentals
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-sm text-gray-600">Farm Balance</p>
//                 <p className="text-2xl font-bold text-green-600">
//                   {formatAmount(user?.balance || 0)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Navigation Tabs */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <nav className="flex space-x-8">
//             <button
//               onClick={() => setActiveTab('dashboard')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'dashboard'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               📊 Dashboard
//             </button>
//             <button
//               onClick={() => setActiveTab('marketplace')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'marketplace'
//                   ? 'border-green-500 text-green-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               🛒 Farmer Marketplace
//             </button>
//           </nav>
//         </div>
//       </div>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {activeTab === 'dashboard' ? (
//           /* DASHBOARD CONTENT */
//           <div>
//             {/* Earnings Overview */}
//             <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
//               <h2 className="text-xl font-semibold text-gray-900 mb-6">Earnings Overview</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <div className="text-center p-4 bg-green-50 rounded-lg">
//                   <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
//                   <p className="text-2xl font-bold text-green-600 mt-2">{formatAmount(stats.todayEarnings)}</p>
//                   <p className="text-xs text-gray-500 mt-1">From sales today</p>
//                 </div>
//                 <div className="text-center p-4 bg-blue-50 rounded-lg">
//                   <p className="text-sm font-medium text-gray-600">This Week</p>
//                   <p className="text-2xl font-bold text-blue-600 mt-2">{formatAmount(stats.weeklyEarnings)}</p>
//                   <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
//                 </div>
//                 <div className="text-center p-4 bg-purple-50 rounded-lg">
//                   <p className="text-sm font-medium text-gray-600">This Month</p>
//                   <p className="text-2xl font-bold text-purple-600 mt-2">{formatAmount(stats.monthlyEarnings)}</p>
//                   <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
//                 </div>
//                 <div className="text-center p-4 bg-emerald-50 rounded-lg">
//                   <p className="text-sm font-medium text-gray-600">All Time</p>
//                   <p className="text-2xl font-bold text-emerald-600 mt-2">{formatAmount(stats.totalEarnings)}</p>
//                   <p className="text-xs text-gray-500 mt-1">Total earnings</p>
//                 </div>
//               </div>
//               {stats.totalEarnings > 0 && (
//                 <div className="mt-4 text-center">
//                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
//                     getEarningsTrend().trend === 'up' 
//                       ? 'bg-green-100 text-green-800'
//                       : getEarningsTrend().trend === 'down'
//                       ? 'bg-red-100 text-red-800'
//                       : 'bg-yellow-100 text-yellow-800'
//                   }`}>
//                     {getEarningsTrend().trend === 'up' ? '📈' : getEarningsTrend().trend === 'down' ? '📉' : '➡️'}
//                     {getEarningsTrend().text} Trend
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Active Products</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
//                     <p className="text-xs text-gray-500 mt-1">Listed for sale</p>
//                   </div>
//                   <div className="p-3 bg-green-100 rounded-full">
//                     <span className="text-xl">🌱</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('sales-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Total Sales</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
//                     <p className="text-xs text-gray-500 mt-1">Completed orders</p>
//                   </div>
//                   <div className="p-3 bg-blue-100 rounded-full">
//                     <span className="text-xl">💰</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Active Rentals</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.activeRentals}</p>
//                     <p className="text-xs text-gray-500 mt-1">Equipment & land</p>
//                   </div>
//                   <div className="p-3 bg-amber-100 rounded-full">
//                     <span className="text-xl">🛠️</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
//                    onClick={() => document.getElementById('sales-section')?.scrollIntoView({ behavior: 'smooth' })}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Pending Orders</p>
//                     <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
//                     <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
//                   </div>
//                   <div className="p-3 bg-orange-100 rounded-full">
//                     <span className="text-xl">⏳</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//               {/* Quick Actions & Products */}
//               <div className="lg:col-span-2 space-y-6">
//                 {/* Quick Actions */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Farming Actions</h3>
//                     <p className="text-sm text-gray-600 mt-1">Manage your agricultural business</p>
//                   </div>
//                   <div className="p-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <Link
//                         to="/my-products?action=add"
//                         className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
//                           <span className="text-xl">➕</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Add Product</p>
//                           <p className="text-sm text-gray-600">List new crops for sale</p>
//                         </div>
//                       </Link>

//                       <Link
//                         to="/my-products"
//                         className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
//                           <span className="text-xl">📊</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Manage Products</p>
//                           <p className="text-sm text-gray-600">Edit & update listings</p>
//                         </div>
//                       </Link>

//                       <button
//                         onClick={() => setActiveTab('marketplace')}
//                         className="flex items-center p-4 border-2 border-amber-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-amber-200">
//                           <span className="text-xl">🛒</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">Farmer Marketplace</p>
//                           <p className="text-sm text-gray-600">Buy products, rent equipment & land</p>
//                         </div>
//                       </button>

//                       <Link
//                         to="/transactions"
//                         className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition duration-200 group"
//                       >
//                         <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
//                           <span className="text-xl">📈</span>
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">View Sales</p>
//                           <p className="text-sm text-gray-600">Transaction history</p>
//                         </div>
//                       </Link>
//                     </div>
//                   </div>
//                 </div>

//                 {/* My Products Section */}
//                 <div id="products-section" className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b flex justify-between items-center">
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">My Products</h3>
//                       <p className="text-sm text-gray-600 mt-1">Manage your crop listings</p>
//                     </div>
//                     <div className="flex space-x-2">
//                       <Link 
//                         to="/my-products?action=add"
//                         className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
//                       >
//                         + Add Product
//                       </Link>
//                       <Link 
//                         to="/my-products" 
//                         className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
//                       >
//                         View All
//                       </Link>
//                     </div>
//                   </div>
//                   <div className="p-6">
//                     {myProducts.length > 0 ? (
//                       <div className="space-y-4">
//                         {myProducts.slice(0, 4).map((product) => (
//                           <div key={product.product_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
//                             <div className="flex items-center space-x-4 flex-1">
//                               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
//                                 <span className="text-green-600 text-lg">🌱</span>
//                               </div>
//                               <div className="flex-1 min-w-0">
//                                 <p className="font-semibold text-gray-900 truncate">{product.crop_name}</p>
//                                 <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
//                                   <span>₹{product.price_per_kg}/kg</span>
//                                   <span>•</span>
//                                   <span>{product.quantity} {product.unit}</span>
//                                   <span>•</span>
//                                   <span className="capitalize">{product.category}</span>
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="flex items-center space-x-3">
//                               <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                                 product.is_available 
//                                   ? 'bg-green-100 text-green-800' 
//                                   : 'bg-gray-100 text-gray-800'
//                               }`}>
//                                 {product.is_available ? 'Available' : 'Sold Out'}
//                               </span>
//                               <Link
//                                 to={`/my-products?edit=${product.product_id}`}
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
//                         <div className="text-gray-400 text-6xl mb-4">🌱</div>
//                         <p className="text-gray-500 mb-2">No products listed yet</p>
//                         <p className="text-gray-400 text-sm mb-4">Start selling your crops today</p>
//                         <Link 
//                           to="/my-products?action=add"
//                           className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
//                         >
//                           Add Your First Product
//                         </Link>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Sales Analytics Section */}
//                 <div id="sales-section" className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b flex justify-between items-center">
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
//                       <p className="text-sm text-gray-600 mt-1">Your product performance</p>
//                     </div>
//                     <Link 
//                       to="/transactions" 
//                       className="text-green-600 hover:text-green-700 text-sm font-medium"
//                     >
//                       View All Sales
//                     </Link>
//                   </div>
//                   <div className="p-6">
//                     {getTopSellingProducts().length > 0 ? (
//                       <div className="space-y-4">
//                         <h4 className="font-medium text-gray-900 mb-3">Top Selling Products</h4>
//                         {getTopSellingProducts().map((item, index) => (
//                           <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                             <div className="flex items-center space-x-3">
//                               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                                 <span className="text-blue-600 text-sm">🏆</span>
//                               </div>
//                               <div>
//                                 <p className="font-medium text-gray-900">{item.product.crop_name}</p>
//                                 <p className="text-sm text-gray-600">{item.totalQuantity}{item.product.unit} sold</p>
//                               </div>
//                             </div>
//                             <div className="text-right">
//                               <p className="font-semibold text-green-600">{formatAmount(item.totalRevenue)}</p>
//                               <p className="text-xs text-gray-500">{item.salesCount} sales</p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-6">
//                         <div className="text-gray-400 text-4xl mb-3">📊</div>
//                         <p className="text-gray-500">No sales data yet</p>
//                         <p className="text-gray-400 text-sm mt-1">Start selling to see analytics</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Sidebar */}
//               <div className="space-y-6">
//                 {/* Recent Sales */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
//                   </div>
//                   <div className="p-6">
//                     <div className="space-y-4">
//                       {getRecentSales().map((sale) => (
//                         <div key={sale.id} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
//                           <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                             <span className="text-green-600 text-sm">💰</span>
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-900">
//                               {sale.message}
//                             </p>
//                             <p className="text-xs text-gray-600">{sale.buyer}</p>
//                             <div className="flex justify-between items-center mt-1">
//                               <p className="text-sm font-semibold text-green-600">
//                                 {formatAmount(sale.amount)}
//                               </p>
//                               <p className="text-xs text-gray-500">{sale.time}</p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                       {getRecentSales().length === 0 && (
//                         <div className="text-center py-4">
//                           <div className="text-gray-400 text-4xl mb-2">💸</div>
//                           <p className="text-gray-500 text-sm">No recent sales</p>
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
//                         <span className="text-sm text-gray-600">Total Products</span>
//                         <span className="text-sm font-semibold text-gray-900">{stats.totalProducts}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Active Listings</span>
//                         <span className="text-sm font-semibold text-green-600">{stats.activeProducts}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Pending Orders</span>
//                         <span className="text-sm font-semibold text-amber-600">{stats.pendingOrders}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-600">Total Revenue</span>
//                         <span className="text-sm font-semibold text-emerald-600">{formatAmount(stats.totalEarnings)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Quick Links */}
//                 <div className="bg-white rounded-xl shadow-sm border">
//                   <div className="px-6 py-4 border-b">
//                     <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
//                   </div>
//                   <div className="p-6">
//                     <div className="space-y-3">
//                       <Link to="/my-products" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
//                         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                           <span className="text-blue-600 text-sm">📦</span>
//                         </div>
//                         <span className="text-sm font-medium text-gray-700">Manage Products</span>
//                       </Link>
//                       <Link to="/transactions" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
//                         <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
//                           <span className="text-green-600 text-sm">💰</span>
//                         </div>
//                         <span className="text-sm font-medium text-gray-700">Sales History</span>
//                       </Link>
//                       <button
//                         onClick={() => setActiveTab('marketplace')}
//                         className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
//                       >
//                         <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
//                           <span className="text-amber-600 text-sm">🛒</span>
//                         </div>
//                         <span className="text-sm font-medium text-gray-700">Marketplace</span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (
//           /* MARKETPLACE CONTENT */
//           <div>
//             {/* Marketplace Tabs */}
//             <div className="bg-white rounded-xl shadow-sm border mb-6">
//               <div className="border-b border-gray-200">
//                 <nav className="-mb-px flex space-x-8 px-6">
//                   <button
//                     onClick={() => setMarketplaceTab('products')}
//                     className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
//                       marketplaceTab === 'products'
//                         ? 'border-green-500 text-green-600'
//                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                     }`}
//                   >
//                     <span className="text-lg">🛒</span>
//                     <span>Buy Products</span>
//                   </button>
//                   <button
//                     onClick={() => setMarketplaceTab('equipment')}
//                     className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
//                       marketplaceTab === 'equipment'
//                         ? 'border-green-500 text-green-600'
//                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                     }`}
//                   >
//                     <span className="text-lg">🚜</span>
//                     <span>Rent Equipment</span>
//                   </button>
//                   <button
//                     onClick={() => setMarketplaceTab('land')}
//                     className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
//                       marketplaceTab === 'land'
//                         ? 'border-green-500 text-green-600'
//                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                     }`}
//                   >
//                     <span className="text-lg">🌾</span>
//                     <span>Rent Land</span>
//                   </button>
//                 </nav>
//               </div>

//               {/* Marketplace Content */}
//               <div className="p-6">
//                 {marketplaceTab === 'products' && <ProductMarketplace />}
//                 {marketplaceTab === 'equipment' && <EquipmentMarketplace />}
//                 {marketplaceTab === 'land' && <LandMarketplace />}
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default FarmerDashboard;

// components/dashboards/FarmerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { transactionService } from '../../services/transactionService';
import { leaseService } from '../../services/leaseService';
import { setMyProducts, setLoading, setError } from '../../store/slices/productSlice';
import { setTransactions } from '../../store/slices/transactionSlice';

// Import the marketplace components
import ProductMarketplace from '../marketplace/ProductMarketplace';
import EquipmentMarketplace from '../marketplace/EquipmentMarketplace';
import LandMarketplace from '../marketplace/LandMarketplace';

const FarmerDashboard = () => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  
  // Extract the actual user data from nested structure
  const user = authUser?.user;
  const userId = user?.user_id;
  
  const { myProducts } = useSelector((state) => state.products);
  const { items: transactions } = useSelector((state) => state.transactions);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'marketplace'
  const [marketplaceTab, setMarketplaceTab] = useState('products'); // 'products', 'equipment', 'land'
  const [dashboardData, setDashboardData] = useState({
    leases: []
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    activeRentals: 0
  });

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [productsData, transactionsData, leasesData] = await Promise.all([
        productService.getMyProducts(),
        transactionService.getMyTransactions(),
        leaseService.getMyLeases()
      ]);

      // Update Redux store
      dispatch(setMyProducts(productsData));
      dispatch(setTransactions(transactionsData));

      setDashboardData({ 
        leases: Array.isArray(leasesData) ? leasesData : []
      });
      
      calculateStats(productsData, transactionsData, leasesData);
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      dispatch(setError(error.response?.data?.message || 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (products, allTransactions, leases) => {
    const activeProducts = products.filter(p => p.is_available !== false).length;

    const pendingOrders = allTransactions.filter(t => 
      t.seller_id === userId && t.status === 'pending'
    ).length;

    const activeRentals = leases.filter(l => 
      l.renter_id === userId && (l.status === 'active' || l.status === 'pending')
    ).length;

    setStats({
      totalProducts: products.length,
      activeProducts,
      pendingOrders,
      activeRentals
    });
  };

  const getRecentActivity = () => {
    const recentTransactions = transactions
      .filter(t => t.buyer_id === userId || t.seller_id === userId)
      .slice(0, 5)
      .map(transaction => {
        const isBuyer = transaction.buyer_id === userId;
        const productName = transaction.product?.crop_name || 'Product';
        const quantity = transaction.quantity || 1;
        const unit = transaction.product?.unit || 'kg';
        
        if (isBuyer) {
          return {
            id: transaction.transaction_id,
            message: `Bought ${quantity}${unit} ${productName}`,
            amount: transaction.total_amount,
            time: formatTimeAgo(transaction.createdAt),
            icon: '🛒',
            type: 'purchase',
            person: transaction.seller ? `${transaction.seller.first_name} ${transaction.seller.last_name}` : 'Seller'
          };
        } else {
          return {
            id: transaction.transaction_id,
            message: `Sold ${quantity}${unit} ${productName}`,
            amount: transaction.total_amount,
            time: formatTimeAgo(transaction.createdAt),
            icon: '💰',
            type: 'sale',
            person: transaction.buyer ? `${transaction.buyer.first_name} ${transaction.buyer.last_name}` : 'Customer'
          };
        }
      });

    return recentTransactions;
  };

  const formatTimeAgo = (dateString) => {
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
          <p className="text-gray-600">Loading your farming dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  Manage your crops, sales, and rentals
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Farm Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(user?.balance || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🛒 Farmer Marketplace
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          /* DASHBOARD CONTENT */
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                    <p className="text-xs text-gray-500 mt-1">All your products</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-xl">🌱</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Products</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
                    <p className="text-xs text-gray-500 mt-1">Listed for sale</p>
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
                    <p className="text-xs text-gray-500 mt-1">Equipment & land</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full">
                    <span className="text-xl">🛠️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <span className="text-xl">⏳</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions & Products */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Farming Actions</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your agricultural business</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link
                        to="/my-products?action=add"
                        className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                          <span className="text-xl">➕</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Add Product</p>
                          <p className="text-sm text-gray-600">List new crops for sale</p>
                        </div>
                      </Link>

                      <Link
                        to="/my-products"
                        className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Manage Products</p>
                          <p className="text-sm text-gray-600">Edit & update listings</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => setActiveTab('marketplace')}
                        className="flex items-center p-4 border-2 border-amber-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-amber-200">
                          <span className="text-xl">🛒</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Farmer Marketplace</p>
                          <p className="text-sm text-gray-600">Buy products, rent equipment & land</p>
                        </div>
                      </button>

                      <Link
                        to="/transactions"
                        className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition duration-200 group"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
                          <span className="text-xl">📈</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Transaction History</p>
                          <p className="text-sm text-gray-600">View all transactions</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* My Products Section */}
                <div id="products-section" className="bg-white rounded-xl shadow-sm border">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">My Products</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage your crop listings</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to="/my-products?action=add"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        + Add Product
                      </Link>
                      <Link 
                        to="/my-products" 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    {myProducts.length > 0 ? (
                      <div className="space-y-4">
                        {myProducts.slice(0, 4).map((product) => (
                          <div key={product.product_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-lg">🌱</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{product.crop_name}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>₹{product.price_per_kg}/kg</span>
                                  <span>•</span>
                                  <span>{product.quantity} {product.unit}</span>
                                  <span>•</span>
                                  <span className="capitalize">{product.category}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                product.is_available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.is_available ? 'Available' : 'Sold Out'}
                              </span>
                              <Link
                                to={`/my-products?edit=${product.product_id}`}
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
                        <div className="text-gray-400 text-6xl mb-4">🌱</div>
                        <p className="text-gray-500 mb-2">No products listed yet</p>
                        <p className="text-gray-400 text-sm mb-4">Start selling your crops today</p>
                        <Link 
                          to="/my-products?action=add"
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
                        >
                          Add Your First Product
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
                          activity.type === 'sale' ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            activity.type === 'sale' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <span className={`text-sm ${
                              activity.type === 'sale' ? 'text-green-600' : 'text-blue-600'
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
                                activity.type === 'sale' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {formatAmount(activity.amount)}
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
                        <span className="text-sm text-gray-600">Total Products</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.totalProducts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Listings</span>
                        <span className="text-sm font-semibold text-green-600">{stats.activeProducts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Orders</span>
                        <span className="text-sm font-semibold text-amber-600">{stats.pendingOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Rentals</span>
                        <span className="text-sm font-semibold text-purple-600">{stats.activeRentals}</span>
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
                      <Link to="/my-products" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📦</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Manage Products</span>
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
          </div>
        ) : (
          /* MARKETPLACE CONTENT */
          <div>
            {/* Marketplace Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setMarketplaceTab('products')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      marketplaceTab === 'products'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">🛒</span>
                    <span>Buy Products</span>
                  </button>
                  <button
                    onClick={() => setMarketplaceTab('equipment')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      marketplaceTab === 'equipment'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">🚜</span>
                    <span>Rent Equipment</span>
                  </button>
                  <button
                    onClick={() => setMarketplaceTab('land')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      marketplaceTab === 'land'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">🌾</span>
                    <span>Rent Land</span>
                  </button>
                </nav>
              </div>

              {/* Marketplace Content */}
              <div className="p-6">
                {marketplaceTab === 'products' && <ProductMarketplace />}
                {marketplaceTab === 'equipment' && <EquipmentMarketplace />}
                {marketplaceTab === 'land' && <LandMarketplace />}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;