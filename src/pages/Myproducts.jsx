// pages/MyProducts.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productService } from '../services/productService';
import { setMyProducts, setLoading, setError, deleteProduct, updateProduct } from '../store/slices/productSlice';
import ProductCard from '../components/products/ProductCard';
import ProductForm from '../components/products/ProductForm'
const MyProducts = () => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector(state => state.auth);
  const { myProducts, loading, error } = useSelector(state => state.products);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'sold'

  // Extract the actual user data from nested structure
  const user = authUser?.user;
  const userId = user?.user_id;
  console.log("My product user id: " + user?.user_id)

  // Load farmer's products
  const loadMyProducts = async () => {
    try {
      dispatch(setLoading(true));
      const products = await productService.getMyProducts();
      dispatch(setMyProducts(products));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Failed to load products'));
    }
  };

  useEffect(() => {
    if (user?.user_type === 'farmer') {
      loadMyProducts();
    }
  }, [user]);

  // Handle edit product
  const handleEdit = (product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setShowAddForm(true);
  };

  // Handle delete product - This will be called from ProductCard
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productService.deleteProduct(productId);
        dispatch(deleteProduct(productId));
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  // Handle toggle availability - This will be called from ProductCard
  const handleToggleAvailability = async (productId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await productService.updateProduct(productId, { 
        is_available: newStatus 
      });
      
      // Update the product in Redux store
      dispatch(updateProduct({ 
        productId, 
        updates: { is_available: newStatus } 
      }));
      
      alert(`Product ${newStatus ? 'marked as available' : 'marked as sold out'}!`);
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    loadMyProducts(); // Reload to get fresh data
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  // Filter products
  const filteredProducts = myProducts.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'available') return product.is_available;
    if (filter === 'sold') return !product.is_available;
    return true;
  });

  console.log('MyProducts - User:', user);
  console.log('MyProducts - Products:', myProducts);

  if (user?.user_type !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only available for farmers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600 mt-2">Manage your agricultural products</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                + Add New Product
              </button>
            )}
          </div>
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
                  onClick={loadMyProducts}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Form */}
        {showAddForm && (
          <div className="mb-8">
            <ProductForm
              product={editingProduct}
              onCancel={handleCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        )}

        {/* Filters */}
        {!showAddForm && myProducts.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Products ({myProducts.length})
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'available'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Available ({myProducts.filter(p => p.is_available).length})
              </button>
              <button
                onClick={() => setFilter('sold')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'sold'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sold Out ({myProducts.filter(p => !p.is_available).length})
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!showAddForm && (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">🌾</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {myProducts.length === 0 ? 'No Products Yet' : 'No Products Match Filter'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {myProducts.length === 0 
                    ? "You haven't added any products yet. Start by adding your first product!"
                    : "No products match your current filter selection."
                  }
                </p>
                {myProducts.length === 0 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Your First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.product_id}
                    user={user}
                    product={product}
                    onEdit={handleEdit}
                    // Remove onDelete and onToggleAvailability since ProductCard handles them internally
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyProducts;