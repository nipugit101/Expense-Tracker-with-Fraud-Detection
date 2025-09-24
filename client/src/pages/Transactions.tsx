import {
    ArrowDownRight,
    ArrowUpRight,
    Download,
    Edit,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TransactionModal from '../components/transactions/TransactionModal';
import apiService from '../services/api';
import { Transaction, TransactionFilters } from '../types';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTransactions(filters);
      setTransactions(response.transactions);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load transactions');
      console.error('Transactions error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await apiService.deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (error: any) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleTransactionSaved = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
      case 'transfer_in':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'expense':
      case 'transfer_out':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowDownRight className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income':
      case 'transfer_in':
        return 'text-green-600';
      case 'expense':
      case 'transfer_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const categories = [
    'food', 'transport', 'shopping', 'entertainment', 'healthcare', 
    'utilities', 'salary', 'freelance', 'investment', 'transfer', 'other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {}}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleCreateTransaction}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="input pl-10"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                className="input min-w-32"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
              </select>

              <select
                className="input min-w-32"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="input"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
              />

              <input
                type="date"
                className="input"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner size="large" className="py-12" />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found</p>
              <button
                onClick={handleCreateTransaction}
                className="btn btn-primary mt-4"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type.includes('expense') || transaction.type.includes('transfer_out') 
                                ? 'bg-red-100' 
                                : 'bg-green-100'
                            }`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              {transaction.merchant && (
                                <p className="text-sm text-gray-500">{transaction.merchant}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="badge badge-primary capitalize">
                            {transaction.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className={`py-4 px-4 text-right font-semibold ${getAmountColor(transaction.type)}`}>
                          {(transaction.type.includes('expense') || transaction.type.includes('transfer_out')) ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} transactions
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="btn btn-secondary text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                      className="btn btn-secondary text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTransactionSaved}
        />
      )}
    </div>
  );
};

export default Transactions;
