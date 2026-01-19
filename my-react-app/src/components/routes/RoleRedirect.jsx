// src/components/routes/RoleRedirect.jsx - Smart Redirect Based on User Role
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * RoleRedirect Component
 * 
 * Redirects authenticated users to appropriate dashboard based on their role
 * Redirects unauthenticated users to login
 */
const RoleRedirect = () => {
  const { isAuthenticated, role, user, loading } = useSelector((state) => state.auth);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get user role
  const userRole = role || user?.role;

  // Redirect based on role
  switch (userRole) {
    case 'admin':
      return <Navigate to="/dashboard" replace />;
    case 'agent':
      return <Navigate to="/dashboard" replace />;
    default:
      // Fallback to shared dashboard for any other role
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleRedirect;
