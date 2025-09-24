import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { Transaction } from '../../types';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: 'other',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'bank_transfer' | 'wallet' | 'other',
    merchant: '',
    tags: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type as 'income' | 'expense',
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        subcategory: transaction.subcategory || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        location: transaction.location || '',
        paymentMethod: transaction.paymentMethod,
        merchant: transaction.merchant || '',
        tags: transaction.tags.join(', '),
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (transaction) {
        await apiService.updateTransaction(transaction._id, transactionData);
        toast.success('Transaction updated successfully');
      } else {
        await apiService.createTransaction(transactionData);
        toast.success('Transaction created successfully');
      }

      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'salary', label: 'Salary' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              placeholder="What was this transaction for?"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="input"
                placeholder="Optional subcategory"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="input"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wallet">Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant/Location
              </label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                className="input"
                placeholder="Where did this transaction occur?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Additional notes about this transaction"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                transaction ? 'Update Transaction' : 'Create Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
