// src/pages/Dashboard.jsx - Simple Dashboard Placeholder
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/features/auth/authApiSlice';
import { LogOut, User, Shield } from 'lucide-react';
import Button from '@/components/auth/Button';

const Dashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/arabicompanylogo.png" 
              alt="Arabic Company Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            loading={isLoading}
            icon={LogOut}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {role === 'admin' ? (
                <Shield className="w-10 h-10 text-white" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Arabic Company, {user?.firstname}!
            </h1>
            <p className="text-gray-600">
              You're logged in as{' '}
              <span className="font-semibold capitalize text-blue-600">{role}</span>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="text-base font-medium text-gray-900">
                  {user?.firstname} {user?.lastname}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-base font-medium text-gray-900">{user?.email}</p>
              </div>
              
              {user?.phone && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900">{user?.phone}</p>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Account Status</p>
                <p className="text-base font-medium">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.status || 'Active'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🎉 Authentication successful!</strong> This is a placeholder dashboard. 
              Your full Arabic Company dashboard will be integrated with the existing my-react-app components.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
