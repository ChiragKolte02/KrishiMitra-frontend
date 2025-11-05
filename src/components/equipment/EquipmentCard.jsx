// components/equipment/EquipmentCard.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { equipmentService } from '../../services/equipmentService';
import { updateEquipment, deleteEquipment, toggleEquipmentAvailability } from '../../store/slices/equipmentSlice';

const EquipmentCard = ({ equipment, onEdit }) => {
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
      await equipmentService.updateEquipment(equipment.equipment_id, { 
        is_available: !equipment.is_available 
      });
      dispatch(toggleEquipmentAvailability({ 
        equipmentId: equipment.equipment_id, 
        isAvailable: !equipment.is_available 
      }));
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert(error.response?.data?.message || 'Failed to update equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await equipmentService.deleteEquipment(equipment.equipment_id);
      dispatch(deleteEquipment(equipment.equipment_id));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert(error.response?.data?.message || 'Failed to delete equipment');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Equipment Image */}
      <div className="h-48 bg-gray-200 relative">
        {equipment.images && equipment.images.length > 0 ? (
          <img
            src={equipment.images[0]}
            alt={equipment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-4xl">🚜</span>
          </div>
        )}
        
        {/* Availability Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          equipment.is_available 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {equipment.is_available ? 'Available' : 'Rented'}
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
          {equipment.type}
        </div>
      </div>

      {/* Equipment Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {equipment.name}
          </h3>
          <span className="text-xl font-bold text-green-600 ml-2">
            {formatPrice(equipment.rent_price_per_day)}/day
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Brand:</span>
            <span className="font-medium">{equipment.brand}</span>
          </div>
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="font-medium">{equipment.model}</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-medium">{equipment.location}</span>
          </div>
          <div className="flex justify-between">
            <span>Min. Rental:</span>
            <span className="font-medium">{equipment.minimum_rent_days} days</span>
          </div>
        </div>

        {equipment.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {equipment.description}
          </p>
        )}

        {/* Specifications */}
        {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Specifications:</p>
            <div className="text-xs text-gray-600 space-y-1">
              {Object.entries(equipment.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Only for equipment owner */}
        {user?.user_id === equipment.owner_id && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(equipment)}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
            
            <button
              onClick={handleToggleAvailability}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
                equipment.is_available
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {loading ? '...' : equipment.is_available ? 'Mark Rented' : 'Mark Available'}
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
              Are you sure you want to delete "{equipment.name}"? This action cannot be undone.
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

export default EquipmentCard;