// pages/MyLands.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { landService } from '../services/landService';
import { setMyLands, setLoading, setError, deleteLand, updateLand } from '../store/slices/landSlice';
import LandCard from '../components/land/LandCard';
import LandForm from '../components/land/LandForm';

const MyLands = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const authState = useSelector((state) => state.auth);
  const { myLands, loading, error } = useSelector(state => state.lands);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLand, setEditingLand] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'rented'

  // Check URL parameters for actions
  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');
    
    if (action === 'add') {
      setShowAddForm(true);
      setEditingLand(null);
    } else if (editId) {
      const landToEdit = myLands.find(l => l.land_id == editId);
      if (landToEdit) {
        setEditingLand(landToEdit);
        setShowAddForm(true);
      }
    }
  }, [searchParams, myLands]);

  // Load landowner's lands
  const loadMyLands = async () => {
    try {
      dispatch(setLoading(true));
      const lands = await landService.getMyLands();
      dispatch(setMyLands(lands));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Failed to load lands'));
    }
  };

  useEffect(() => {
    if (user?.user_type === 'landowner') {
      loadMyLands();
    }
  }, [user]);

  // Handle edit land
  const handleEdit = (land) => {
    setEditingLand(land);
    setShowAddForm(true);
    navigate(`/my-lands?edit=${land.land_id}`, { replace: true });
  };

  // Handle delete land
  const handleDelete = async (landId) => {
    if (window.confirm('Are you sure you want to delete this land? This action cannot be undone.')) {
      try {
        await landService.deleteLand(landId);
        dispatch(deleteLand(landId));
        alert('Land deleted successfully!');
      } catch (error) {
        console.error('Error deleting land:', error);
        alert(error.response?.data?.message || 'Failed to delete land');
      }
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = async (landId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await landService.updateLand(landId, { 
        is_available: newStatus 
      });
      
      dispatch(updateLand({ 
        landId, 
        updates: { is_available: newStatus } 
      }));
      
      alert(`Land ${newStatus ? 'marked as available' : 'marked as rented'}!`);
    } catch (error) {
      console.error('Error updating land:', error);
      alert(error.response?.data?.message || 'Failed to update land');
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingLand(null);
    loadMyLands();
    navigate('/my-lands', { replace: true });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingLand(null);
    navigate('/my-lands', { replace: true });
  };

  // Filter lands
  const filteredLands = myLands.filter(land => {
    if (filter === 'all') return true;
    if (filter === 'available') return land.is_available;
    if (filter === 'rented') return !land.is_available;
    return true;
  });

  // Calculate total statistics
  const totalLands = myLands.length;
  const availableLands = myLands.filter(land => land.is_available).length;
  const rentedLands = myLands.filter(land => !land.is_available).length;
  const totalSize = myLands.reduce((sum, land) => sum + parseFloat(land.size_in_acres || 0), 0);
  const totalPotentialRevenue = myLands.reduce((sum, land) => {
    const dailyRate = parseFloat(land.price_per_day || 0);
    return sum + dailyRate;
  }, 0);

  if (user?.user_type !== 'landowner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only available for landowners.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Lands</h1>
              <p className="text-gray-600 mt-2">Manage your agricultural land for rent</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingLand(null);
                  navigate('/my-lands?action=add', { replace: true });
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                + Add New Land
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
                  onClick={loadMyLands}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Land Form */}
        {showAddForm && (
          <div className="mb-8">
            <LandForm
              land={editingLand}
              onCancel={handleCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        )}

        {/* Stats Overview - Only show when form is not visible */}
        {!showAddForm && myLands.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl mb-2">🌾</div>
              <p className="text-2xl font-bold text-gray-900">{totalLands}</p>
              <p className="text-sm text-gray-600">Total Lands</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-2xl font-bold text-green-600">{availableLands}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-2xl font-bold text-gray-900">{totalSize.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Total Acres</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-2xl font-bold text-green-600">₹{totalPotentialRevenue.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">Daily Potential</p>
            </div>
          </div>
        )}

        {/* Filters and Lands Grid - Only show when form is not visible */}
        {!showAddForm && (
          <>
            {/* Filters */}
            {myLands.length > 0 && (
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
                    All Lands ({totalLands})
                  </button>
                  <button
                    onClick={() => setFilter('available')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === 'available'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Available ({availableLands})
                  </button>
                  <button
                    onClick={() => setFilter('rented')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === 'rented'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Rented ({rentedLands})
                  </button>
                </div>
              </div>
            )}

            {/* Lands Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredLands.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">🌾</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {myLands.length === 0 ? 'No Lands Yet' : 'No Lands Match Filter'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {myLands.length === 0 
                    ? "You haven't added any lands yet. Start by adding your first land!"
                    : "No lands match your current filter selection."
                  }
                </p>
                {myLands.length === 0 && (
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      navigate('/my-lands?action=add', { replace: true });
                    }}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Your First Land
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLands.map(land => (
                  <LandCard
                    key={land.land_id}
                    land={land}
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

export default MyLands;