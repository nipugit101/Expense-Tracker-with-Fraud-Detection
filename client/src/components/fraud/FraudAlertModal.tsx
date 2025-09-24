import { AlertTriangle, Ban, Calendar, CheckCircle, DollarSign, MapPin, Shield, X } from 'lucide-react';
import React, { useState } from 'react';
import { FraudAlert } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface FraudAlertModalProps {
  alert: FraudAlert;
  onClose: () => void;
  onReview: (alertId: string, status: string, notes?: string) => Promise<void>;
}

const FraudAlertModal: React.FC<FraudAlertModalProps> = ({ alert, onClose, onReview }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'dismissed'>('reviewed');
  const [notes, setNotes] = useState('');

  const handleReview = async () => {
    try {
      setIsLoading(true);
      await onReview(alert._id, reviewStatus, notes);
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsLoading(false);
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
      month: 'long',
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

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'high_amount': return <DollarSign className="h-5 w-5" />;
      case 'unusual_pattern': return <AlertTriangle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Fraud Alert Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Alert Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getRiskLevelColor(alert.riskLevel)}`}>
                  {getAlertTypeIcon(alert.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(alert.riskLevel)}`}>
                    {alert.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                alert.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                alert.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
              </div>
            </div>

            {/* Alert Description */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Description</h5>
              <p className="text-gray-700 text-sm leading-relaxed">
                {alert.description}
              </p>
            </div>

            {/* Alert Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Detected At
                  </label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {formatDate(alert.detectedAt)}
                    </span>
                  </div>
                </div>

                {alert.location && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Location
                    </label>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{alert.location}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {typeof alert.transaction === 'object' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Transaction Amount
                    </label>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-medium">
                        {formatCurrency(alert.transaction.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {alert.details && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Details
                    </label>
                    <div className="mt-1 space-y-1">
                      {alert.details.threshold && (
                        <div className="text-sm text-gray-700">
                          Threshold: {formatCurrency(alert.details.threshold)}
                        </div>
                      )}
                      {alert.details.category && (
                        <div className="text-sm text-gray-700">
                          Category: {alert.details.category}
                        </div>
                      )}
                      {alert.details.timeframe && (
                        <div className="text-sm text-gray-700">
                          Timeframe: {alert.details.timeframe}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Notes */}
            {alert.notes && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Previous Notes</h5>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{alert.notes}</p>
                  {alert.reviewedAt && alert.reviewedBy && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed on {formatDate(alert.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {alert.status === 'pending' && (
              <div className="border-t pt-6">
                <h5 className="font-medium text-gray-900 mb-4">Review Alert</h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="reviewed"
                          checked={reviewStatus === 'reviewed'}
                          onChange={(e) => setReviewStatus('reviewed')}
                          className="form-radio"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          Mark as Reviewed (Legitimate)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="dismissed"
                          checked={reviewStatus === 'dismissed'}
                          onChange={(e) => setReviewStatus('dismissed')}
                          className="form-radio"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <Ban className="h-4 w-4 text-gray-600 mr-1" />
                          Dismiss Alert (False Positive)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes about this alert..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Close
            </button>
            {alert.status === 'pending' && (
              <button
                onClick={handleReview}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Submit Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudAlertModal;
