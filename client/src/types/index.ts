export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
  wallet: {
    balance: number;
    currency: string;
  };
  preferences: {
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
  };
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id: string;
  user: string | User;
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'healthcare' | 'utilities' | 'salary' | 'freelance' | 'investment' | 'transfer' | 'other';
  subcategory?: string;
  date: Date;
  location?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'wallet' | 'other';
  merchant?: string;
  currency: string;
  exchangeRate: number;
  tags: string[];
  receipt?: {
    url: string;
    filename: string;
  };
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  transfer?: {
    fromUser: string | User;
    toUser: string | User;
    transferId: string;
  };
  fraudFlags: FraudFlag[];
  isReviewed: boolean;
  notes?: string;
  aiCategorized: boolean;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FraudFlag {
  type: 'high_amount' | 'category_limit' | 'unusual_time' | 'unusual_location' | 'frequent_transactions';
  severity: 'low' | 'medium' | 'high';
  message: string;
  flaggedAt: Date;
}

export interface FraudAlert {
  _id: string;
  user: string | User;
  transaction: string | Transaction;
  alertType: 'high_amount' | 'category_limit' | 'unusual_pattern' | 'suspicious_activity';
  type: 'high_amount' | 'category_limit' | 'unusual_pattern' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  message: string;
  description: string;
  location?: string;
  detectedAt: Date;
  details?: {
    threshold?: number;
    actualAmount?: number;
    category?: string;
    timeframe?: string;
  };
  status: 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
  emailSent: boolean;
  emailSentAt?: Date;
  reviewedBy?: string | User;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardData {
  summary: {
    currentMonthIncome: number;
    currentMonthExpenses: number;
    balance: number;
    walletBalance: number;
    incomeChange: number;
    expenseChange: number;
  };
  categorySpending: {
    _id: string;
    total: number;
    count: number;
  }[];
  monthlyTrends: {
    _id: {
      year: number;
      month: number;
      type: string;
    };
    total: number;
  }[];
  recentTransactions: Transaction[];
}

export interface CategorySpending {
  category: string;
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  status: 'good' | 'warning' | 'over';
  transactions: number;
}

export interface BudgetAnalysis {
  budgetStatus: CategorySpending[];
  overallBudgetStatus: {
    totalSpent: number;
    monthlyLimit: number;
    remaining: number;
    percentage: number;
  };
  savingsGoals: {
    currentSavingsRate: number;
    recommendedSavingsRate: number;
    potentialSavings: number;
    actualSavings: number;
  };
  recommendations: {
    type: 'warning' | 'alert' | 'tip';
    message: string;
  }[];
}

export interface WalletContact {
  email: string;
  name: string;
  lastTransferDate: Date;
  totalTransferred: number;
}

export interface TransferRequest {
  toEmail: string;
  amount: number;
  description: string;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TransactionFilters extends PaginationParams {
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  previousPeriodExpenses: number;
  averageDailySpending: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expenses: number;
  }[];
  insights: string[];
  budgets: {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
  }[];
  savingsGoals: {
    name: string;
    target: number;
    current: number;
    deadline: Date;
  }[];
}
