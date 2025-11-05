// components/land/LandCard.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { landService } from '../../services/landService';
import { updateLand, deleteLand, toggleLandAvailability } from '../../store/slices/landSlice';

const LandCard = ({ land, onEdit }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleAvailability = async () => {
    try {
      setLoading(true);
      await landService.updateLand(land.land_id, { 
        is_available: !land.is_available 
      });
      dispatch(toggleLandAvailability({ 
        landId: land.land_id, 
        isAvailable: !land.is_available 
      }));
    } catch (error) {
      console.error('Error updating land:', error);
      alert(error.response?.data?.message || 'Failed to update land');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await landService.deleteLand(land.land_id);
      dispatch(deleteLand(land.land_id));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting land:', error);
      alert(error.response?.data?.message || 'Failed to delete land');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Land Image */}
      <div className="h-48 bg-gray-200 relative">
        {land.images && land.images.length > 0 ? (
          <img
            src={land.images[0]}
            alt={`Land in ${land.location}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-4xl">🌾</span>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          land.is_available 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {land.is_available ? 'Available' : 'Rented'}
        </div>

        {/* Size Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {land.size_in_acres} acres
        </div>
      </div>

      {/* Land Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            Agricultural Land
          </h3>
          <span className="text-xl font-bold text-green-600 ml-2">
            {formatPrice(land.price_per_day)}/day
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-medium">{land.location}</span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="font-medium">{land.size_in_acres} acres</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">Agricultural</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-medium capitalize">
              {land.is_verified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {land.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {land.description}
          </p>
        )}

        {/* Action Buttons - Only for land owner */}
        {user?.user_id === land.owner_id && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(land)}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
            
            <button
              onClick={handleToggleAvailability}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                land.is_available
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {loading ? '...' : land.is_available ? 'Mark Rented' : 'Mark Available'}
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
              Are you sure you want to delete land in "{land.location}"? This action cannot be undone.
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

export default LandCard;