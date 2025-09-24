import { Calendar, Edit2, PiggyBank, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { AnalyticsData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface SavingsGoalCardProps {
  analyticsData: AnalyticsData | null;
  onUpdate: () => void;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ analyticsData, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

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
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalStatus = (current: number, target: number, deadline: Date) => {
    const percentage = (current / target) * 100;
    const daysRemaining = getDaysRemaining(deadline);
    
    if (percentage >= 100) return { status: 'completed', color: 'green' };
    if (daysRemaining < 0) return { status: 'overdue', color: 'red' };
    if (daysRemaining <= 30 && percentage < 75) return { status: 'behind', color: 'yellow' };
    return { status: 'on-track', color: 'blue' };
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <PiggyBank className="h-5 w-5 mr-2" />
            Savings Goals
          </h3>
          <button className="btn btn-sm btn-secondary flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </button>
        </div>
      </div>
      <div className="card-content">
        {isLoading ? (
          <LoadingSpinner size="small" />
        ) : !analyticsData?.savingsGoals || analyticsData.savingsGoals.length === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No savings goals yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Set goals to track your savings progress
            </p>
            <button className="btn btn-primary mt-4 flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {analyticsData.savingsGoals.map((goal, index) => {
              const goalStatus = getGoalStatus(goal.current, goal.target, goal.deadline);
              const percentage = Math.min((goal.current / goal.target) * 100, 100);
              const daysRemaining = getDaysRemaining(goal.deadline);
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {goal.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        goalStatus.color === 'green' ? 'bg-green-100 text-green-700' :
                        goalStatus.color === 'red' ? 'bg-red-100 text-red-700' :
                        goalStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {goalStatus.status === 'completed' ? 'Completed' :
                         goalStatus.status === 'overdue' ? 'Overdue' :
                         goalStatus.status === 'behind' ? 'Behind Schedule' :
                         'On Track'}
                      </span>
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
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Progress: {formatCurrency(goal.current)}
                      </span>
                      <span className="text-gray-600">
                        Goal: {formatCurrency(goal.target)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          goalStatus.color === 'green' ? 'bg-green-500' :
                          goalStatus.color === 'red' ? 'bg-red-500' :
                          goalStatus.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-medium ${
                        goalStatus.color === 'green' ? 'text-green-600' :
                        goalStatus.color === 'red' ? 'text-red-600' :
                        goalStatus.color === 'yellow' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {percentage.toFixed(1)}% complete
                      </span>
                      
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 
                           daysRemaining === 0 ? 'Due today' : 
                           `${Math.abs(daysRemaining)} days overdue`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Target date: {formatDate(goal.deadline)}
                    </div>
                    
                    {goal.current < goal.target && daysRemaining > 0 && (
                      <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                        💡 Save {formatCurrency((goal.target - goal.current) / daysRemaining)} 
                        per day to reach your goal on time
                      </div>
                    )}
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

export default SavingsGoalCard;
