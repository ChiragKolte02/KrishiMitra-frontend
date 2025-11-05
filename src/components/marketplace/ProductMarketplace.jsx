// components/marketplace/ProductMarketplace.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { productService } from '../../services/productService';
import { transactionService } from '../../services/transactionService';

const ProductMarketplace = () => {
  const authState = useSelector((state) => state.auth);
  
  const getUser = () => {
    if (authState.user?.user_id) return authState.user;
    if (authState.user?.user?.user_id) return authState.user.user;
    return null;
  };

  const user = getUser();
  const userId = user?.user_id;
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchLocation, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productService.getAllProducts();
      
      // Filter out products owned by the current user and only show available ones
      const availableProducts = productsData.filter(
        product => product.farmer_id !== userId && product.is_available
      );
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchLocation.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.location.toLowerCase().includes(searchLocation.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSearch = () => {
    filterProducts();
  };

  const handleClearSearch = () => {
    setSearchLocation('');
    setFilteredProducts(products);
  };

  const handleBuyProduct = (product) => {
    if (!user) {
      alert('Please login to buy products');
      return;
    }

    if (userId === product.farmer_id) {
      alert('You cannot buy your own product');
      return;
    }

    setBuyingProduct(product);
    setQuantity(1);
  };

  const confirmPurchase = async () => {
    try {
      setIsProcessing(true);
      
      const transactionData = {
        quantity: quantity,
        payment_method: 'upi',
        transaction_type: 'buy'
      };

      const result = await transactionService.buyProduct(buyingProduct.product_id, transactionData);
      
      // Auto-download receipt after successful purchase
      if (result.transaction?.transaction_id) {
        try {
          await transactionService.downloadProductReceipt(result.transaction.transaction_id);
        } catch (receiptError) {
          console.error('Error downloading receipt:', receiptError);
          // Don't fail the purchase if receipt download fails
        }
      }
      
      alert('Product purchased successfully! Receipt downloaded.');
      setBuyingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error buying product:', error);
      alert(error.response?.data?.message || 'Failed to purchase product');
    } finally {
      setIsProcessing(false);
    }
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
              placeholder="Search products by location (e.g., Pune, Maharashtra)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
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
            Showing {filteredProducts.length} products in <strong>{searchLocation}</strong>
          </p>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchLocation ? 'No Products Found' : 'No Products Available'}
          </h3>
          <p className="text-gray-600">
            {searchLocation 
              ? 'Try searching a different location or check back later.'
              : 'Check back later for new product listings.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.product_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                    <span className="text-gray-400 text-4xl">🌱</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Available
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{product.crop_name}</h3>
                  <span className="text-xl font-bold text-green-600">₹{product.price_per_kg}/kg</span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium capitalize">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">{product.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className="font-medium">{product.quality} Grade</span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Farmer: {product.farmer?.first_name} {product.farmer?.last_name}
                  </span>
                  <button
                    onClick={() => handleBuyProduct(product)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {buyingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Product</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{buyingProduct.crop_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per kg:</span>
                <span className="font-medium">₹{buyingProduct.price_per_kg}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">{buyingProduct.quantity} kg</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  min="1"
                  max={buyingProduct.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= buyingProduct.quantity) {
                      setQuantity(value);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: {buyingProduct.quantity} kg
                </p>
              </div>

              <div className="flex justify-between font-semibold text-lg border-t pt-4">
                <span>Total Amount:</span>
                <span className="text-green-600">₹{(buyingProduct.price_per_kg * quantity).toFixed(2)}</span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  📄 A receipt will be automatically downloaded after purchase.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setBuyingProduct(null)}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={isProcessing || quantity < 1 || quantity > buyingProduct.quantity}
                className="flex-1 bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMarketplace;