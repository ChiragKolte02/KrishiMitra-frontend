// pages/MyEquipment.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { equipmentService } from '../services/equipmentService';
import { setMyEquipment, setLoading, setError, deleteEquipment, updateEquipment } from '../store/slices/equipmentSlice';
import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentForm from '../components/equipment/EquipmentForm';

const MyEquipment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const authState = useSelector((state) => state.auth);
  const { myEquipment, loading, error } = useSelector(state => state.equipment);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'rented'

  // Check URL parameters for actions
  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');
    
    if (action === 'add') {
      setShowAddForm(true);
      setEditingEquipment(null);
    } else if (editId) {
      const equipmentToEdit = myEquipment.find(e => e.equipment_id == editId);
      if (equipmentToEdit) {
        setEditingEquipment(equipmentToEdit);
        setShowAddForm(true);
      }
    }
  }, [searchParams, myEquipment]);

  // Load equipment owner's equipment
  const loadMyEquipment = async () => {
    try {
      dispatch(setLoading(true));
      const equipment = await equipmentService.getMyEquipment();
      dispatch(setMyEquipment(equipment));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Failed to load equipment'));
    }
  };

  useEffect(() => {
    if (user?.user_type === 'equipment_owner') {
      loadMyEquipment();
    }
  }, [user]);

  // Handle edit equipment
  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setShowAddForm(true);
    navigate(`/my-equipment?edit=${equipment.equipment_id}`, { replace: true });
  };

  // Handle delete equipment
  const handleDelete = async (equipmentId) => {
    if (window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      try {
        await equipmentService.deleteEquipment(equipmentId);
        dispatch(deleteEquipment(equipmentId));
        alert('Equipment deleted successfully!');
      } catch (error) {
        console.error('Error deleting equipment:', error);
        alert(error.response?.data?.message || 'Failed to delete equipment');
      }
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = async (equipmentId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await equipmentService.updateEquipment(equipmentId, { 
        is_available: newStatus 
      });
      
      dispatch(updateEquipment({ 
        equipmentId, 
        updates: { is_available: newStatus } 
      }));
      
      alert(`Equipment ${newStatus ? 'marked as available' : 'marked as rented'}!`);
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert(error.response?.data?.message || 'Failed to update equipment');
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingEquipment(null);
    loadMyEquipment();
    navigate('/my-equipment', { replace: true });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingEquipment(null);
    navigate('/my-equipment', { replace: true });
  };

  // Filter equipment
  const filteredEquipment = myEquipment.filter(equipment => {
    if (filter === 'all') return true;
    if (filter === 'available') return equipment.is_available;
    if (filter === 'rented') return !equipment.is_available;
    return true;
  });

  if (user?.user_type !== 'equipment_owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only available for equipment owners.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Equipment</h1>
              <p className="text-gray-600 mt-2">Manage your farming equipment for rent</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingEquipment(null);
                  navigate('/my-equipment?action=add', { replace: true });
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                + Add New Equipment
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
                  onClick={loadMyEquipment}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Form */}
        {showAddForm && (
          <div className="mb-8">
            <EquipmentForm
              equipment={editingEquipment}
              onCancel={handleCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        )}

        {/* Filters and Equipment Grid - Only show when form is not visible */}
        {!showAddForm && (
          <>
            {/* Filters */}
            {myEquipment.length > 0 && (
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
                    All Equipment ({myEquipment.length})
                  </button>
                  <button
                    onClick={() => setFilter('available')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === 'available'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Available ({myEquipment.filter(e => e.is_available).length})
                  </button>
                  <button
                    onClick={() => setFilter('rented')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === 'rented'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Rented ({myEquipment.filter(e => !e.is_available).length})
                  </button>
                </div>
              </div>
            )}

            {/* Equipment Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">🚜</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {myEquipment.length === 0 ? 'No Equipment Yet' : 'No Equipment Match Filter'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {myEquipment.length === 0 
                    ? "You haven't added any equipment yet. Start by adding your first equipment!"
                    : "No equipment matches your current filter selection."
                  }
                </p>
                {myEquipment.length === 0 && (
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      navigate('/my-equipment?action=add', { replace: true });
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Your First Equipment
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map(equipment => (
                  <EquipmentCard
                    key={equipment.equipment_id}
                    equipment={equipment}
                    onEdit={handleEdit}
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

export default MyEquipment;