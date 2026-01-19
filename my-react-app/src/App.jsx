import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n/config'; // Initialize i18n

// Dashboard Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import CallDetail from './pages/CallDetail';
import WorkOrdersSpreadsheet from './pages/workOrders/WorkOrdersSpreadsheet';
import ProfileSettings from './pages/ProfileSettings';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/users/auth/Login';
import Register from './pages/users/auth/Register';
import VerifyOTP from './pages/users/auth/VerifyOTP';
import ForgotPassword from './pages/users/auth/ForgotPassword';

// Route Guards
import GuestRoute from './components/routes/GuestRoute';
import RoleBasedRoute from './components/routes/RoleBasedRoute';
import RoleRedirect from './components/routes/RoleRedirect';

// Global Components
import GlobalImportProgress from './components/common/GlobalImportProgress';

import './App.css';

/**
 * Main App Component with Role-Based Authentication & Routing
 * 
 * Public Routes (Guest only):
 * - /login : Login page
 * - /register : Registration page
 * - /verify-otp : Email verification
 * - /forgot-password : Password reset
 * 
 * Protected Routes:
 * - /dashboard : Universal dashboard accessible by all authenticated users
 * - /agents : Agents list and management
 * - /work-orders : Work orders management
 * - /analytics : Analytics and reports
 * - /settings : Application settings
 */
function App() {
  return (
    <Router>
      <GlobalImportProgress />
      <Routes>
        {/* Public Routes - Redirect to role-based dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <GuestRoute>
              <VerifyOTP />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />

        {/* Root - Smart redirect based on authentication and role */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Agent Detail - Full page without sidebar */}
        <Route
          path="/agents/:agentName"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'agent']}>
              <AgentDetail />
            </RoleBasedRoute>
          }
        />

        {/* PROTECTED ROUTES - Accessible by all authenticated users */}
        <Route
          path="/*"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'agent']}>
              <Layout />
            </RoleBasedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agents/:agentName/calls/:callId" element={<CallDetail />} />
          <Route path="analytics" element={<Dashboard />} />
          <Route path="settings" element={<ProfileSettings />} />
        </Route>

        {/* Full-screen routes - No layout */}
        <Route
          path="/work-orders"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'agent']}>
              <WorkOrdersSpreadsheet />
            </RoleBasedRoute>
          }
        />

        {/* Catch all - redirect to role-based dashboard or login */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;

