// utils->aiService.js
const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const categorizeTransactionAI = async (description, merchant, amount) => {
  if (!openai) {
    console.log('OpenAI not configured, skipping AI categorization');
    return null;
  }

  try {
    const prompt = `
Categorize this transaction into one of these categories: food, transport, shopping, entertainment, healthcare, utilities, salary, freelance, investment, other.

Transaction details:
- Description: ${description}
- Merchant: ${merchant || 'N/A'}
- Amount: $${amount}

Respond with JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}

Categories explained:
- food: restaurants, groceries, cafes, food delivery
- transport: gas, uber, taxi, public transit, parking
- shopping: retail, clothing, electronics, online purchases
- entertainment: movies, games, concerts, subscriptions
- healthcare: medical, pharmacy, insurance, fitness
- utilities: electricity, water, internet, phone
- salary: regular employment income
- freelance: contract work, gig economy
- investment: stocks, bonds, savings, retirement
- other: anything that doesn't fit above categories
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial transaction categorization expert. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);

    if (result.category && result.confidence >= 0.6) {
      return result;
    }

    return null;
  } catch (error) {
    console.error('AI categorization error:', error);
    return null;
  }
};

const generateSavingsTips = async (spendingData, userPreferences) => {
  if (!openai) {
    return getDefaultSavingsTips(spendingData);
  }

  try {
    const prompt = `
Based on this spending data, provide 3-5 personalized money-saving tips:

Spending by category:
${spendingData.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.transactions} transactions)`).join('\n')}

Monthly budget limits:
${Object.entries(userPreferences.categoryLimits || {}).map(([cat, limit]) => `- ${cat}: $${limit}`).join('\n')}

Total monthly spending: $${spendingData.reduce((sum, cat) => sum + cat.amount, 0).toFixed(2)}

Respond with JSON format:
{
  "tips": [
    {
      "title": "Reduce Food Delivery",
      "description": "You spent $X on food delivery. Try cooking more meals at home.",
      "category": "food",
      "potentialSavings": 150
    }
  ]
}

Make tips specific, actionable, and include potential monthly savings amounts.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a personal finance advisor. Provide practical, specific money-saving advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.tips || getDefaultSavingsTips(spendingData);
  } catch (error) {
    console.error('AI savings tips error:', error);
    return getDefaultSavingsTips(spendingData);
  }
};

const generateBudgetInsights = async (transactions, budget) => {
  if (!openai) {
    return getDefaultBudgetInsights(transactions, budget);
  }

  try {
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const prompt = `
Analyze this spending pattern and provide insights:

Top 5 expenses this month:
${topExpenses.map(t => `- $${t.amount.toFixed(2)}: ${t.description} (${t.category})`).join('\n')}

Budget status:
- Monthly limit: $${budget.monthlyLimit || 0}
- Current spending: $${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}

Respond with JSON format:
{
  "insights": [
    {
      "type": "warning|tip|achievement",
      "title": "Insight Title",
      "message": "Detailed message about spending pattern",
      "category": "category if applicable"
    }
  ]
}

Provide 2-4 insights about spending patterns, budget adherence, or opportunities.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst providing spending insights and recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.insights || getDefaultBudgetInsights(transactions, budget);
  } catch (error) {
    console.error('AI budget insights error:', error);
    return getDefaultBudgetInsights(transactions, budget);
  }
};

const getDefaultSavingsTips = (spendingData) => {
  const tips = [];

  const topCategory = spendingData.sort((a, b) => b.amount - a.amount)[0];
  if (topCategory) {
    const categoryTips = {
      food: {
        title: 'Cook More at Home',
        description: `You spent $${topCategory.amount.toFixed(2)} on food. Cooking at home could save you 30-50%.`,
        potentialSavings: Math.round(topCategory.amount * 0.3)
      },
      transport: {
        title: 'Use Public Transport',
        description: `Consider using public transport or carpooling to reduce your $${topCategory.amount.toFixed(2)} transport costs.`,
        potentialSavings: Math.round(topCategory.amount * 0.25)
      },
      entertainment: {
        title: 'Find Free Activities',
        description: `Look for free entertainment options to reduce your $${topCategory.amount.toFixed(2)} entertainment spending.`,
        potentialSavings: Math.round(topCategory.amount * 0.4)
      }
    };

    if (categoryTips[topCategory.category]) {
      tips.push(categoryTips[topCategory.category]);
    }
  }

  tips.push({
    title: 'Track Small Purchases',
    description: 'Small daily purchases can add up. Track every expense to identify saving opportunities.',
    potentialSavings: 50
  });

  tips.push({
    title: 'Review Subscriptions',
    description: 'Cancel unused subscriptions and services to reduce monthly recurring expenses.',
    potentialSavings: 75
  });

  return tips;
};

const getDefaultBudgetInsights = (transactions, budget) => {
  const insights = [];
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  if (budget.monthlyLimit && totalExpenses > budget.monthlyLimit) {
    insights.push({
      type: 'warning',
      title: 'Budget Exceeded',
      message: `You've exceeded your monthly budget by $${(totalExpenses - budget.monthlyLimit).toFixed(2)}.`
    });
  }

  const highestExpense = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];

  if (highestExpense) {
    insights.push({
      type: 'tip',
      title: 'Largest Expense',
      message: `Your biggest expense was $${highestExpense.amount.toFixed(2)} for ${highestExpense.description}. Consider if this was necessary.`,
      category: highestExpense.category
    });
  }

  return insights;
};

module.exports = {
  categorizeTransactionAI,
  generateSavingsTips,
  generateBudgetInsights
};
