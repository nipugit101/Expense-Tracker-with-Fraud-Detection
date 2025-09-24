import { AlertTriangle, Edit2, Plus, Target, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { AnalyticsData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface BudgetCardProps {
  analyticsData: AnalyticsData | null;
  onUpdate: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ analyticsData, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    
    if (percentage >= 100) return { status: 'over', color: 'red' };
    if (percentage >= 80) return { status: 'warning', color: 'yellow' };
    return { status: 'good', color: 'green' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Budget Tracking
          </h3>
          <button className="btn btn-sm btn-secondary flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Add Budget
          </button>
        </div>
      </div>
      <div className="card-content">
        {isLoading ? (
          <LoadingSpinner size="small" />
        ) : !analyticsData?.budgets || analyticsData.budgets.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No budgets set yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create budgets to track your spending limits
            </p>
            <button className="btn btn-primary mt-4 flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {analyticsData.budgets.map((budget, index) => {
              const budgetStatus = getBudgetStatus(budget.spent, budget.limit);
              const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {budget.category}
                      </h4>
                      {budgetStatus.status === 'over' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Spent: {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-gray-600">
                        Limit: {formatCurrency(budget.limit)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          budgetStatus.color === 'red' ? 'bg-red-500' :
                          budgetStatus.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${
                        budgetStatus.color === 'red' ? 'text-red-600' :
                        budgetStatus.color === 'yellow' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      
                      {budget.remaining > 0 ? (
                        <span className="text-xs text-gray-500">
                          {formatCurrency(budget.remaining)} remaining
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">
                          {formatCurrency(Math.abs(budget.remaining))} over budget
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;
