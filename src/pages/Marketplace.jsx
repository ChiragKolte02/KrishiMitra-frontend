// pages/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { productService } from '../services/productService';
import { equipmentService } from '../services/equipmentService';
import { landService } from '../services/landService';
import ProductMarketplace from '../components/marketplace/ProductMarketplace';
import EquipmentMarketplace from '../components/marketplace/EquipmentMarketplace';
import LandMarketplace from '../components/marketplace/LandMarketplace';

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({
    products: 0,
    equipment: 0,
    lands: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceStats();
  }, []);

  const fetchMarketplaceStats = async () => {
    try {
      setLoading(true);
      const [productsData, equipmentData, landsData] = await Promise.all([
        productService.getAllProducts(),
        equipmentService.getAllEquipment(),
        landService.getAllLands()
      ]);

      setStats({
        products: productsData.length || 0,
        equipment: equipmentData.length || 0,
        lands: landsData.length || 0
      });
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'products', label: 'Buy Products', icon: '🛒', count: stats.products },
    { id: 'equipment', label: 'Rent Equipment', icon: '🚜', count: stats.equipment },
    { id: 'land', label: 'Rent Land', icon: '🌾', count: stats.lands }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Farmer Marketplace</h1>
              <p className="text-gray-600 mt-2">
                Buy agricultural products, rent equipment, and lease farming land
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
            <p className="text-gray-600">Products Available</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">🚜</div>
            <p className="text-2xl font-bold text-gray-900">{stats.equipment}</p>
            <p className="text-gray-600">Equipment for Rent</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl mb-2">🌾</div>
            <p className="text-2xl font-bold text-gray-900">{stats.lands}</p>
            <p className="text-gray-600">Lands Available</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && <ProductMarketplace />}
            {activeTab === 'equipment' && <EquipmentMarketplace />}
            {activeTab === 'land' && <LandMarketplace />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;