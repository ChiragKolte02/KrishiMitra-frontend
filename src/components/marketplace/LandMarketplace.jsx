// components/marketplace/LandMarketplace.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { landService } from '../../services/landService';
import { transactionService } from '../../services/transactionService';

const LandMarketplace = () => {
  const authState = useSelector((state) => state.auth);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  const userId = user?.user_id;
  
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [rentingLand, setRentingLand] = useState(null);
  const [rentalDates, setRentalDates] = useState({
    start_date: '',
    end_date: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLands();
  }, []);

  useEffect(() => {
    filterLands();
  }, [searchLocation, lands]);

  const fetchLands = async () => {
    try {
      setLoading(true);
      const landsData = await landService.getAllLands();
      
      // Filter out lands owned by the current user and only show available ones
      const availableLands = landsData.filter(
        land => land.owner_id !== userId && land.is_available
      );
      setLands(availableLands);
    } catch (error) {
      console.error('Error fetching lands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLands = () => {
    if (!searchLocation.trim()) {
      setFilteredLands(lands);
      return;
    }

    const filtered = lands.filter(land =>
      land.location.toLowerCase().includes(searchLocation.toLowerCase())
    );
    setFilteredLands(filtered);
  };

  const handleSearch = () => {
    filterLands();
  };

  const handleClearSearch = () => {
    setSearchLocation('');
    setFilteredLands(lands);
  };

  const handleRentLand = (land) => {
    if (!user) {
      alert('Please login to rent land');
      return;
    }

    if (userId === land.owner_id) {
      alert('You cannot rent your own land');
      return;
    }

    setRentingLand(land);
    // Set default dates (tomorrow to 30 days later)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthLater = new Date();
    monthLater.setDate(monthLater.getDate() + 30);
    
    setRentalDates({
      start_date: tomorrow.toISOString().split('T')[0],
      end_date: monthLater.toISOString().split('T')[0]
    });
  };

  const confirmRental = async () => {
    try {
      setIsProcessing(true);
      const transactionData = {
        start_date: rentalDates.start_date,
        end_date: rentalDates.end_date,
        payment_method: 'upi',
        transaction_type: 'rent'
      };

      const result = await transactionService.rentLand(rentingLand.land_id, transactionData);
      
      // Auto-download receipt after successful rental
      if (result.transaction?.transaction_id) {
        try {
          await transactionService.downloadLeaseReceipt(result.transaction.transaction_id);
        } catch (receiptError) {
          console.error('Error downloading receipt:', receiptError);
          // Don't fail the rental if receipt download fails
        }
      }
      
      alert('Land rented successfully! Receipt downloaded.');
      setRentingLand(null);
      fetchLands(); // Refresh the list
    } catch (error) {
      console.error('Error renting land:', error);
      alert(error.response?.data?.message || 'Failed to rent land');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRentalCost = () => {
    if (!rentingLand || !rentalDates.start_date || !rentalDates.end_date) return 0;
    
    const start = new Date(rentalDates.start_date);
    const end = new Date(rentalDates.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return days > 0 ? days * rentingLand.price_per_day : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search land by location (e.g., Pune, Maharashtra)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearSearch}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            Showing {filteredLands.length} lands in <strong>{searchLocation}</strong>
          </p>
        </div>
      )}

      {/* Lands Grid */}
      {filteredLands.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchLocation ? 'No Land Found' : 'No Land Available'}
          </h3>
          <p className="text-gray-600">
            {searchLocation 
              ? 'Try searching a different location or check back later.'
              : 'Check back later for new land listings.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLands.map((land) => (
            <div key={land.land_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                    <span className="text-gray-400 text-4xl">🏞️</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Available
                </div>
              </div>

              {/* Land Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Agricultural Land</h3>
                  <span className="text-xl font-bold text-green-600">₹{land.price_per_day}/day</span>
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
                </div>

                {land.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{land.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Owner: {land.owner?.first_name} {land.owner?.last_name}
                  </span>
                  <button
                    onClick={() => handleRentLand(land)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Rent Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rental Modal */}
      {rentingLand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rent Land</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{rentingLand.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{rentingLand.size_in_acres} acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Rate:</span>
                <span className="font-medium">₹{rentingLand.price_per_day}/day</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={rentalDates.start_date}
                  onChange={(e) => setRentalDates(prev => ({...prev, start_date: e.target.value}))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={rentalDates.end_date}
                  onChange={(e) => setRentalDates(prev => ({...prev, end_date: e.target.value}))}
                  min={rentalDates.start_date}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex justify-between font-semibold text-lg border-t pt-4">
                <span>Total Cost:</span>
                <span className="text-green-600">₹{calculateRentalCost()}</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  📄 A receipt will be automatically downloaded after rental confirmation.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setRentingLand(null)}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRental}
                disabled={isProcessing || !rentalDates.start_date || !rentalDates.end_date || calculateRentalCost() === 0}
                className="flex-1 bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rental'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandMarketplace;