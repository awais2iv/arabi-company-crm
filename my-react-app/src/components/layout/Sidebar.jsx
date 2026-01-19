// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList
} from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLogoutMutation } from '@/features/auth/authApiSlice';

const SIDEBAR_BG = "#1a1c1e";
const ACTIVE_BG = "#004225";
const ITEM_HOVER = "#2a2d30";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [logout] = useLogoutMutation();

  const menuItems = [
    {
      name: t('sidebar.dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      name: t('sidebar.agents'),
      path: '/agents',
      icon: Users,
      description: 'Agent management and calls'
    },
    {
      name: t('sidebar.workOrders'),
      path: '/work-orders',
      icon: ClipboardList,
      description: 'Work order management'
    },
   
    {
      name: t('sidebar.settings'),
      path: '/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate('/login');
    }
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <div
        key={item.path}
        className={`flex items-center gap-3 transition h-10 px-3 group cursor-pointer ${
          isCollapsed ? "justify-center" : ""
        }`}
        style={{
          background: isActive ? ACTIVE_BG : "transparent",
          color: isActive ? "#fff" : "#ccc",
          borderRadius: "0.5rem",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = ITEM_HOVER;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
        onClick={() => navigate(item.path)}
      >
        <div className="flex-shrink-0">
          <Icon size={18} />
        </div>
        {!isCollapsed && (
          <span className="text-xs font-medium">{item.name}</span>
        )}
        {isCollapsed && (
          <span className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity rounded z-50">
            {item.name}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen flex flex-col justify-between transition-all duration-300 ease-in-out border-r z-40 ${
        isCollapsed ? 'w-12' : 'w-48'
      } max-w-[300px]`}
      style={{
        background: SIDEBAR_BG,
        borderTopRightRadius: "1rem",
        borderBottomRightRadius: "1rem",
      }}
    >
      {/* Header */}
      <div className="flex flex-col justify-center p-4">
        <div className="flex items-center justify-center">
          <img 
            src="/arabicompanylogo.png" 
            alt="Arabic Company Logo" 
            className={`object-contain ${isCollapsed ? 'w-20 h-12' : 'w-32 h-20'}`}
          />
          {!isCollapsed && (
            <div className="flex flex-col ml-3">
              
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-3 py-4 flex-1 overflow-y-auto no-scrollbar">
        <nav className="flex flex-col gap-2">
          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>

          {/* Logout - Always at bottom */}
          <div className="mt-auto pt-4 border-t border-slate-700">
            <div
              onClick={handleLogout}
              className={`flex items-center gap-3 transition h-10 px-3 group cursor-pointer ${
                isCollapsed ? "justify-center" : ""
              }`}
              style={{
                background: "transparent",
                color: "#ccc",
                borderRadius: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = ITEM_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex-shrink-0">
                <LogOut size={18} />
              </div>
              {!isCollapsed && (
                <span className="text-xs font-medium">{t('sidebar.logout')}</span>
              )}
              {isCollapsed && (
                <span className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity rounded z-50">
                  {t('sidebar.logout')}
                </span>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Language Switcher */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-t border-slate-700">
          <LanguageSwitcher />
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="px-3 pb-4">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 transition h-10 px-3 group cursor-pointer ${
            isCollapsed ? "justify-center" : ""
          }`}
          style={{
            background: "transparent",
            color: "#ccc",
            borderRadius: "0.5rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = ITEM_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div className="flex-shrink-0">
            {isCollapsed ? (
              <ChevronsRight size={18} />
            ) : (
              <ChevronsLeft size={18} />
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs font-medium">
              {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </span>
          )}
          {isCollapsed && (
            <span className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity rounded z-50">
              {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;