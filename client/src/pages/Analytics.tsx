import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import apiService from '../services/api';
import { AnalyticsData, Transaction } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        apiService.getDashboard(),
        apiService.getTransactions({ limit: 100, timeRange })
      ]);

      // Transform the backend response to match our interface
      const transformedData = {
        totalIncome: analyticsResponse.summary.currentMonthIncome,
        totalExpenses: analyticsResponse.summary.currentMonthExpenses,
        previousPeriodExpenses: 0, // We'll calculate this from monthly trends
        averageDailySpending: analyticsResponse.summary.currentMonthExpenses / 30,
        categoryBreakdown: analyticsResponse.categorySpending.map((cat: any) => ({
          category: cat._id,
          amount: cat.total,
          percentage: (cat.total / analyticsResponse.summary.currentMonthExpenses) * 100
        })),
        monthlyTrend: analyticsResponse.monthlyTrends.map((trend: any) => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          income: trend._id.type === 'income' ? trend.total : 0,
          expenses: trend._id.type === 'expense' ? trend.total : 0
        })),
        insights: [],
        budgets: [],
        savingsGoals: []
      };

      setAnalyticsData(transformedData);
      setTransactions(transactionsResponse.transactions);
    } catch (error: any) {
      toast.error('Failed to load analytics data');
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      console.log('Starting export...');
      
      const csvData = await apiService.exportTransactions({ 
        timeRange,
        format: 'csv'
      });
      
      console.log('Export response received');
      
      // Create and download CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export report: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateAIInsights = () => {
    if (!analyticsData) return [];

    const insights = [];
    const { totalIncome, totalExpenses, categoryBreakdown, averageDailySpending } = analyticsData;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Savings rate analysis
    if (savingsRate >= 20) {
      insights.push("🎉 Excellent savings rate! You're saving " + savingsRate.toFixed(1) + "% of your income, which is above the recommended 20%.");
    } else if (savingsRate >= 10) {
      insights.push("👍 Good savings rate of " + savingsRate.toFixed(1) + "%. Consider increasing to 20% for optimal financial health.");
    } else if (savingsRate > 0) {
      insights.push("⚠️ Your savings rate is " + savingsRate.toFixed(1) + "%. Try to reduce expenses or increase income to save at least 10-20%.");
    } else {
      insights.push("🚨 You're spending more than you earn. Focus on reducing expenses or finding additional income sources.");
    }

    // Category spending analysis
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown.reduce((max, cat) => cat.amount > max.amount ? cat : max);
      const categoryPercentage = (topCategory.amount / totalExpenses) * 100;
      
      if (categoryPercentage > 40) {
        insights.push(`💡 ${topCategory.category} accounts for ${categoryPercentage.toFixed(1)}% of your spending. Consider if this allocation aligns with your priorities.`);
      }

      // Dining out analysis
      const diningCategory = categoryBreakdown.find(cat => 
        cat.category.toLowerCase().includes('food') || 
        cat.category.toLowerCase().includes('dining') ||
        cat.category.toLowerCase().includes('restaurant')
      );
      if (diningCategory && (diningCategory.amount / totalExpenses) > 0.15) {
        insights.push(`🍽️ Dining expenses are ${((diningCategory.amount / totalExpenses) * 100).toFixed(1)}% of your budget. Cooking at home more could boost your savings.`);
      }
    }

    // Daily spending analysis
    if (averageDailySpending > 100) {
      insights.push(`💰 Your average daily spending is ${formatCurrency(averageDailySpending)}. Small daily savings can add up to significant monthly amounts.`);
    }

    // Budgeting recommendations
    if (totalExpenses > 0) {
      const recommendedCategories = {
        housing: 30,
        transportation: 15,
        food: 12,
        entertainment: 8,
        savings: 20
      };
      
      insights.push("📊 Recommended budget allocation: Housing (30%), Transportation (15%), Food (12%), Entertainment (8%), Savings (20%).");
    }

    // Seasonal insights
    const currentMonth = new Date().getMonth();
    if (currentMonth === 11) { // December
      insights.push("🎄 December spending typically increases due to holidays. Plan ahead and set a holiday budget to avoid overspending.");
    } else if (currentMonth === 0) { // January
      insights.push("🎯 New Year is a great time to review and set financial goals. Consider automating your savings to stay on track.");
    }

    return insights.slice(0, 6); // Limit to 6 insights
  };

  const toggleAIInsights = async () => {
    if (!showAIInsights) {
      setIsGeneratingInsights(true);
      // Simulate AI processing time
      setTimeout(() => {
        setIsGeneratingInsights(false);
        setShowAIInsights(true);
      }, 1500);
    } else {
      setShowAIInsights(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSpendingTrend = () => {
    if (!analyticsData) return { percentage: 0, isIncrease: false };
    
    const current = analyticsData.totalExpenses;
    const previous = analyticsData.previousPeriodExpenses || 0;
    
    if (previous === 0) return { percentage: 100, isIncrease: true };
    
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      isIncrease: percentage > 0
    };
  };

  // Chart configurations
  const categoryChartData = {
    labels: analyticsData?.categoryBreakdown.map(item => item.category) || [],
    datasets: [
      {
        data: analyticsData?.categoryBreakdown.map(item => item.amount) || [],
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
          '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
        ],
        borderWidth: 0,
      }
    ]
  };

  const monthlyTrendData = {
    labels: analyticsData?.monthlyTrend.map(item => item.month) || [],
    datasets: [
      {
        label: 'Income',
        data: analyticsData?.monthlyTrend.map(item => item.income) || [],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: analyticsData?.monthlyTrend.map(item => item.expenses) || [],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1,
      }
    ]
  };

  const savingsData = {
    labels: analyticsData?.monthlyTrend.map(item => item.month) || [],
    datasets: [
      {
        label: 'Net Savings',
        data: analyticsData?.monthlyTrend.map(item => item.income - item.expenses) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const spendingTrend = getSpendingTrend();

  if (isLoading) {
    return <LoadingSpinner size="large" className="min-h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAIInsights}
            disabled={isGeneratingInsights}
            className={`btn flex items-center transition-all duration-200 ${
              showAIInsights 
                ? 'btn-primary' 
                : 'btn-secondary border-purple-300 text-purple-700 hover:bg-purple-50'
            }`}
          >
            {isGeneratingInsights ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            {isGeneratingInsights ? 'Generating...' : showAIInsights ? 'Hide AI Insights' : 'Generate AI Insights'}
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="form-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={exportReport}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analyticsData?.totalIncome || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analyticsData?.totalExpenses || 0)}
                </p>
                <div className="flex items-center mt-1">
                  {spendingTrend.isIncrease ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${spendingTrend.isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                    {spendingTrend.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Savings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency((analyticsData?.totalIncome || 0) - (analyticsData?.totalExpenses || 0))}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Daily Spending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData?.averageDailySpending || 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Spending by Category
            </h3>
          </div>
          <div className="card-content">
            {analyticsData?.categoryBreakdown.length ? (
              <Pie data={categoryChartData} options={pieChartOptions} />
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Income vs Expenses
            </h3>
          </div>
          <div className="card-content">
            {analyticsData?.monthlyTrend.length ? (
              <Bar data={monthlyTrendData} options={chartOptions} />
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Savings Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Savings Trend
          </h3>
        </div>
        <div className="card-content">
          {analyticsData?.monthlyTrend.length ? (
            <Line data={savingsData} options={chartOptions} />
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No savings data available</p>
            </div>
          )}
        </div>
      </div>

    

      {/* AI Insights */}
      {showAIInsights && (
        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 animate-fadeIn">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                AI-Powered Financial Insights
              </h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  ✨ AI Generated
                </span>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {generateAIInsights().map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg border border-purple-100">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-semibold">{index + 1}</span>
                  </div>
                  <p className="text-purple-800 text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
              
              {/* Financial Health Score */}
              {analyticsData && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-900">Financial Health Score</h4>
                      <p className="text-sm text-purple-700 mt-1">Based on your spending patterns and savings rate</p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const savingsRate = analyticsData.totalIncome > 0 ? 
                          ((analyticsData.totalIncome - analyticsData.totalExpenses) / analyticsData.totalIncome) * 100 : 0;
                        const score = Math.min(100, Math.max(0, 
                          (savingsRate * 2) + 
                          (analyticsData.totalIncome > analyticsData.totalExpenses ? 30 : 0) +
                          (analyticsData.categoryBreakdown.length > 0 ? 20 : 0)
                        ));
                        const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
                        const scoreText = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement';
                        
                        return (
                          <>
                            <div className={`text-2xl font-bold ${scoreColor}`}>
                              {Math.round(score)}/100
                            </div>
                            <div className={`text-sm font-medium ${scoreColor}`}>
                              {scoreText}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
