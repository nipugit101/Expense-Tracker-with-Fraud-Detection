import { Bell, LogOut, User } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900 ml-12 md:ml-0">
            Welcome back, {user?.firstName}!
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-gray-500">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
