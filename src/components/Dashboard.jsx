// components/Dashboard.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import FarmerDashboard from './dashboards/FarmerDashboard';
import LandownerDashboard from './dashboards/LandownerDashboard';
import EquipmentOwnerDashboard from './dashboards/EquipmentOwnerDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  // Debug: Check the actual structure
  console.log('Full auth user:', user);
  console.log('Nested user:', user?.user);
  console.log('User type:', user?.user?.user_type);

  if (!user || !user.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get the actual user data from the nested structure
  const userData = user.user;
  const userType = userData.user_type;

  console.log('Final user data:', userData);
  console.log('Final user type:', userType);

  // Render different dashboard based on user role
  switch (userType) {
    case 'farmer':
      return <FarmerDashboard />;
    case 'landowner':
      return <LandownerDashboard />;
    case 'equipment_owner':
      return <EquipmentOwnerDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unknown User Role</h2>
            <p className="text-gray-600">User type: {userType || 'undefined'}</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;