import { Building2, CreditCard, Plus, Smartphone, X } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface AddFundsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface AddFundsFormData {
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'digital_wallet';
  description?: string;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AddFundsFormData>({
    defaultValues: {
      amount: 0,
      method: 'credit_card',
      description: ''
    }
  });

  const selectedMethod = watch('method');

  const paymentMethods = [
    {
      id: 'credit_card' as const,
      name: 'Credit/Debit Card',
      description: 'Instant funding',
      icon: CreditCard,
      fee: '2.9% + $0.30'
    },
    {
      id: 'bank_transfer' as const,
      name: 'Bank Transfer',
      description: '1-3 business days',
      icon: Building2,
      fee: 'Free'
    },
    {
      id: 'digital_wallet' as const,
      name: 'Digital Wallet',
      description: 'PayPal, Apple Pay, etc.',
      icon: Smartphone,
      fee: '3.5%'
    }
  ];

  const onSubmit = async (data: AddFundsFormData) => {
    try {
      setIsLoading(true);
      console.log('Adding funds:', data);
      
      // Call the wallet add funds endpoint
      const response = await apiService.addFunds(
        data.amount, 
        data.description || `Funds added via ${paymentMethods.find(m => m.id === data.method)?.name}`
      );
      
      console.log('Add funds response:', response);
      toast.success('Funds added successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Add funds error:', error);
      toast.error(error.response?.data?.message || 'Failed to add funds');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFee = (amount: number, method: string) => {
    switch (method) {
      case 'credit_card':
        return amount * 0.029 + 0.30;
      case 'digital_wallet':
        return amount * 0.035;
      case 'bank_transfer':
      default:
        return 0;
    }
  };

  const watchedAmount = watch('amount');
  const amount = typeof watchedAmount === 'string' ? parseFloat(watchedAmount) || 0 : watchedAmount || 0;
  const fee = calculateFee(amount, selectedMethod);
  const total = amount + fee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary-600" />
              Add Funds
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 1, message: 'Minimum amount is $1.00' },
                    max: { value: 5000, message: 'Maximum amount is $5,000.00' }
                  })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-medium"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method.id}
                        {...register('method')}
                        className="sr-only"
                      />
                      <Icon className={`h-6 w-6 mr-3 ${
                        selectedMethod === method.id ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${
                            selectedMethod === method.id ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {method.name}
                          </p>
                          <span className={`text-sm font-medium ${
                            selectedMethod === method.id ? 'text-primary-600' : 'text-gray-500'
                          }`}>
                            {method.fee}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          selectedMethod === method.id ? 'text-primary-700' : 'text-gray-500'
                        }`}>
                          {method.description}
                        </p>
                      </div>
                      {selectedMethod === method.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                id="description"
                type="text"
                placeholder="Personal funds, business expense, etc."
                {...register('description')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Fee Breakdown */}
            {amount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading || amount === 0}
                className="flex-1 btn btn-primary py-3 font-medium"
              >
                {isSubmitting || isLoading ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Funds
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              🔒 Your payment information is secured with bank-level encryption. 
              We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;
