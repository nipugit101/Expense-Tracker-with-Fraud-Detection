import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import {
    ArrowDownRight,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import apiService from '../services/api';
import { DashboardData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiService.getDashboard();
        setDashboardData(data);
      } catch (error: any) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="large" className="min-h-96" />;
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { summary, categorySpending, monthlyTrends, recentTransactions } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const categoryChartData = {
    labels: categorySpending.map(cat => cat._id),
    datasets: [
      {
        data: categorySpending.map(cat => cat.total),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const monthlyTrendData = {
    labels: monthlyTrends.map(trend => 
      `${trend._id.month}/${trend._id.year}`
    ),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends
          .filter(trend => trend._id.type === 'income')
          .map(trend => trend.total),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: monthlyTrends
          .filter(trend => trend._id.type === 'expense')
          .map(trend => trend.total),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.currentMonthIncome)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {summary.incomeChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(summary.incomeChange)}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.currentMonthExpenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {summary.expenseChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatChange(Math.abs(summary.expenseChange))}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">This month's net flow</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.walletBalance)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Available for transfers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Spending by Category</h3>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <Doughnut data={categoryChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Monthly Trends</h3>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <Line data={monthlyTrendData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </button>
          </div>
        </div>
        <div className="card-content">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {transaction.type === 'expense' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500 capitalize">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
