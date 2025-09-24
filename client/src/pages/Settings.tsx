import {
    Bell,
    CreditCard,
    Download,
    Eye,
    EyeOff,
    Save,
    Shield,
    Trash2,
    User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface UserPreferences {
  emailNotifications: boolean;
  fraudAlerts: boolean;
  monthlySpendingLimit: number;
  categoryLimits: {
    food: number;
    transport: number;
    shopping: number;
    entertainment: number;
    healthcare: number;
    utilities: number;
    other: number;
  };
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    }
  });

  const passwordForm = useForm<PasswordFormData>();

  useEffect(() => {
    if (user) {
      setPreferences(user.preferences);
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || ''
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      const updatedUser = await apiService.updateProfile(data);
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      passwordForm.reset();
      toast.success('Password updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      if (!preferences) return;
      
      const updatedPreferences = { ...preferences, ...newPreferences } as UserPreferences;
      setPreferences(updatedPreferences);
      
      const updatedUser = await apiService.updateProfile({ 
        preferences: updatedPreferences 
      } as any);
      updateUser(updatedUser);
      toast.success('Preferences updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    }
  };

  const exportData = async () => {
    try {
      const response = await apiService.exportUserData();
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmation = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      await apiService.deleteAccount();
      toast.success('Account deleted successfully');
      // Redirect will happen automatically due to 401 response
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const tabs = [
    { id: 'profile' as const, name: 'Profile', icon: User },
    { id: 'preferences' as const, name: 'Preferences', icon: Bell },
    { id: 'security' as const, name: 'Security', icon: Shield },
    { id: 'data' as const, name: 'Data & Privacy', icon: Download }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="card">
            <div className="card-content p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </h3>
              </div>
              <div className="card-content">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        {...profileForm.register('firstName', { required: 'First name is required' })}
                        className="form-input"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        {...profileForm.register('lastName', { required: 'Last name is required' })}
                        className="form-input"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Email address cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      {...profileForm.register('phone')}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || profileForm.formState.isSubmitting}
                      className="btn btn-primary flex items-center"
                    >
                      {isLoading || profileForm.formState.isSubmitting ? (
                        <LoadingSpinner size="small" className="mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && preferences && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => updatePreferences({ emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Fraud Alerts</h4>
                        <p className="text-sm text-gray-500">Get notified about suspicious activities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.fraudAlerts}
                          onChange={(e) => updatePreferences({ fraudAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Spending Limits
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Spending Limit
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={preferences.monthlySpendingLimit}
                          onChange={(e) => updatePreferences({ 
                            monthlySpendingLimit: parseFloat(e.target.value) || 0 
                          })}
                          className="form-input pl-8"
                          min="0"
                          step="100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(preferences.categoryLimits).map(([category, limit]) => (
                        <div key={category}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {category} Limit
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              value={limit}
                              onChange={(e) => updatePreferences({
                                categoryLimits: {
                                  ...preferences.categoryLimits,
                                  [category]: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="form-input pl-8"
                              min="0"
                              step="50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Change Password
                </h3>
              </div>
              <div className="card-content">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                        className="form-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('newPassword', {
                          required: 'New password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' }
                        })}
                        className="form-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register('confirmPassword', { required: 'Please confirm your new password' })}
                      className="form-input"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || passwordForm.formState.isSubmitting}
                      className="btn btn-primary flex items-center"
                    >
                      {isLoading || passwordForm.formState.isSubmitting ? (
                        <LoadingSpinner size="small" className="mr-2" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Data Export
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Download a copy of all your data including transactions, preferences, and account information.
                    </p>
                    <button
                      onClick={exportData}
                      className="btn btn-secondary flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export My Data
                    </button>
                  </div>
                </div>
              </div>

              <div className="card border-red-200 bg-red-50">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-red-800 flex items-center">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Account
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <p className="text-red-700">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">What will be deleted:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• All transaction records</li>
                        <li>• Wallet and transfer history</li>
                        <li>• Preferences and settings</li>
                        <li>• Account information</li>
                      </ul>
                    </div>
                    <button
                      onClick={deleteAccount}
                      className="btn bg-red-600 hover:bg-red-700 text-white flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
