// components/products/ProductCard.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productService } from '../../services/productService';
import { updateProduct, deleteProduct, toggleProductAvailability } from '../../store/slices/productSlice';

const ProductCard = ({ product, onEdit, user }) => {
  const dispatch = useDispatch();
  // const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleAvailability = async () => {
    try {
      setLoading(true);
      await productService.updateProduct(product.product_id, { 
        is_available: !product.is_available 
      });
      dispatch(toggleProductAvailability({ 
        productId: product.product_id, 
        isAvailable: !product.is_available 
      }));
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };
  console.log("Edit user is :" + user.user);
  const handleDelete = async () => {
    try {
      setLoading(true);
      await productService.deleteProduct(product.product_id);
      dispatch(deleteProduct(product.product_id));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="h-48 bg-gray-200 relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.crop_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-4xl">🌾</span>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          product.is_available 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.is_available ? 'Available' : 'Sold Out'}
        </div>

        {/* Quality Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {product.quality || 'A'} Grade
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {product.crop_name}
          </h3>
          <span className="text-xl font-bold text-green-600 ml-2">
            ₹{product.price_per_kg}/kg
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Category:</span>
            <span className="font-medium capitalize">{product.category}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span className="font-medium">
              {product.quantity} {product.unit || 'kg'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-medium">{product.location}</span>
          </div>
          <div className="flex justify-between">
            <span>Harvest Date:</span>
            <span className="font-medium">{formatDate(product.harvest_date)}</span>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Action Buttons - Only for product owner */}
        {user?.user_id === product.farmer_id && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(product)}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
            
            <button
              onClick={handleToggleAvailability}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                product.is_available
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {loading ? '...' : product.is_available ? 'Mark Sold' : 'Mark Available'}
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{product.crop_name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;