import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Shield,
  TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FraudAlertModal from '../components/fraud/FraudAlertModal';
import apiService from '../services/api';
import { FraudAlert } from '../types';

const FraudAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('all');

  useEffect(() => {
    fetchFraudData();
  }, [filter]);

  const fetchFraudData = async () => {
    try {
      setIsLoading(true);
      const [alertsResponse, summaryResponse] = await Promise.all([
        apiService.getFraudAlerts({ status: filter === 'all' ? undefined : filter }),
        apiService.getFraudSummary()
      ]);

      setAlerts(alertsResponse.alerts);
      setSummary(summaryResponse);
    } catch (error: any) {
      toast.error('Failed to load fraud alerts');
      console.error('Fraud alerts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewAlert = async (alertId: string, status: string, notes?: string) => {
    try {
      await apiService.reviewFraudAlert(alertId, { status, notes });
      toast.success('Alert reviewed successfully');
      fetchFraudData();
      setSelectedAlert(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review alert');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reviewed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dismissed': return <Ban className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  if (isLoading) {
    return <LoadingSpinner size="large" className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Fraud Detection</h1>
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="form-select"
          >
            <option value="all">All Alerts</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">High Risk Alerts</p>
                  <p className="text-2xl font-bold text-red-700">
                    {summary.highRiskCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {summary.pendingCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Protected Amount</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(summary.protectedAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Detection Rate</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {(summary.detectionRate || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Alerts
          </h3>
        </div>
        <div className="card-content">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === 'all' ? 'No fraud alerts found' : `No ${filter} alerts`}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Your account is secure and protected
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    alert.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                    alert.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200'
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2`}>
                        {getStatusIcon(alert.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(alert.riskLevel)}`}>
                          {alert.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {typeof alert.transaction === 'object' ? 
                              formatCurrency(alert.transaction.amount) : 
                              'N/A'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(alert.detectedAt)}
                          </div>
                          {alert.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {alert.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        alert.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                        alert.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Tips */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Best Practices
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Monitor Regularly</h4>
                  <p className="text-sm text-blue-700">Check your transactions daily and report suspicious activity immediately.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Secure Connections</h4>
                  <p className="text-sm text-blue-700">Only use secure, trusted networks for financial transactions.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Strong Passwords</h4>
                  <p className="text-sm text-blue-700">Use unique, strong passwords and enable two-factor authentication.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-semibold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Stay Updated</h4>
                  <p className="text-sm text-blue-700">Keep your app and devices updated with the latest security patches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <FraudAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onReview={handleReviewAlert}
        />
      )}
    </div>
  );
};

export default FraudAlerts;
