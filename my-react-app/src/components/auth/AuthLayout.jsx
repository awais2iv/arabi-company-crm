// src/components/auth/AuthLayout.jsx - Modern Auth Layout
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between text-white">
        <div>
          <Link to="/" className="flex items-center space-x-3 mb-16">
            <img 
              src="/arabicompanylogo.png" 
              alt="Arabic Company Logo" 
              className="w-20 h-20 object-contain"
            />
          </Link>

          <div className="space-y-8">
            <h1 className="text-5xl font-bold leading-tight">
              Call Center <br />
              Management <br />
              Made Simple
            </h1>
            <p className="text-xl text-blue-100">
              Streamline your customer service operations with our powerful agent management platform
            </p>

            <div className="space-y-4 mt-12">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-time Call Monitoring</h3>
                  <p className="text-blue-100">Track agent performance and call metrics in real-time</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Smart Analytics</h3>
                  <p className="text-blue-100">Make data-driven decisions with comprehensive analytics</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multi-location Support</h3>
                  <p className="text-blue-100">Manage agents across multiple call center locations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-100">
          © 2026 Arabic Company. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center">
              <img 
                src="/arabicompanylogo.png" 
                alt="Arabic Company Logo" 
                className="w-16 h-16 object-contain"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
