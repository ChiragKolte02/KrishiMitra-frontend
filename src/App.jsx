// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store } from "./store";

// Layout Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Page Components
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";

import MyProducts from "./pages/Myproducts";
import Marketplace from "./pages/Marketplace";
import MyEquipment from './pages/MyEquipment';
import MyLands from './pages/MyLands'; // NEW

function App() {
  const FarmerRoute = ({ children }) => {
    const { user: authUser } = useSelector((state) => state.auth);
    const user = authUser?.user;

    if (!user) {
      return <Navigate to="/login" replace />;
    }
   
    if (user?.user_type !== "farmer") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied sdawd
            </h2>
            <p className="text-gray-600">
              This page is only available for farmers.
            </p>
          </div>
        </div>
      );
    }

    return children;
  };

  return (
    <Provider store={store}>
      <Router>
        <div className="App flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            <Route 
                path="/my-equipment" 
                element={
                  <ProtectedRoute allowedRoles={['equipment_owner']}>
                    <MyEquipment />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/my-products"
                element={
                  <ProtectedRoute>
                  <FarmerRoute>
                    <MyProducts />
                  </FarmerRoute>
                  </ProtectedRoute>
                }

              />
               <Route 
                path="/my-lands" 
                element={
                  <ProtectedRoute allowedRoles={['landowner']}>
                    <MyLands />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          Settings Page
                        </h1>
                        <p className="text-gray-600">
                          Settings page is under development
                        </p>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route path="/marketplace" element={<Marketplace />} />

              {/* 404 Page */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        404
                      </h1>
                      <p className="text-xl text-gray-600 mb-8">
                        Page not found
                      </p>
                      <a
                        href="/"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
