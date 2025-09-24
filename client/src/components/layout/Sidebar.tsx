import {
    BarChart3,
    CreditCard,
    LayoutDashboard,
    Menu,
    Settings,
    Shield,
    Wallet,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Fraud Alerts', href: '/fraud-alerts', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center px-6 py-6 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">
                ExpenseTracker
              </span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} 
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  Smart Wallet
                </p>
                <p className="text-xs text-gray-500">
                  Fraud Protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
