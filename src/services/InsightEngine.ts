import { Transaction, Budget, SavingsGoal, Category, Insight, InsightType } from '../types';

export class InsightEngine {
  static generateInsights(
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    categories: Category[]
  ): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthTxs = transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
    });

    // 1. Savings Rate Insight
    const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    if (currentIncome > 0) {
      const savingsRate = ((currentIncome - currentExpense) / currentIncome) * 100;
      if (savingsRate >= 20) {
        insights.push({
          id: 'savings_rate_good',
          type: 'success',
          title: 'Great Savings Rate!',
          description: `You saved ${savingsRate.toFixed(1)}% of your income this month.`,
          priority: 80,
          icon: 'wallet'
        });
      } else if (savingsRate < 0) {
        insights.push({
          id: 'savings_rate_negative',
          type: 'warning',
          title: 'Negative Cash Flow',
          description: `You have spent more than you earned this month.`,
          priority: 90,
          icon: 'trending-down'
        });
      }
    } else if (currentExpense > 0) {
      // No income recorded but there are expenses → always negative cash flow
      insights.push({
        id: 'savings_rate_negative',
        type: 'warning',
        title: 'Negative Cash Flow',
        description: `You have expenses this month but no income recorded.`,
        priority: 90,
        icon: 'trending-down'
      });
    }

    // 2. Budget Utilization
    const currentBudgets = budgets;
    currentBudgets.forEach(budget => {
      let spent = 0;
      if (budget.targetType === 'category') {
        spent = currentMonthTxs
          .filter(t => t.type === 'expense' && t.categoryId === budget.targetId)
          .reduce((sum, t) => sum + t.amount, 0);
      } else {
        spent = currentMonthTxs
          .filter(t => t.type === 'expense' && t.tags?.some(tag => tag.id === budget.targetId))
          .reduce((sum, t) => sum + t.amount, 0);
      }
      
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const categoryName = budget.name;

      if (percentage >= 100) {
        insights.push({
          id: `budget_exceeded_${budget.id}`,
          type: 'alert',
          title: 'Budget Exceeded',
          description: `You have exceeded your ${categoryName} budget by ${(percentage - 100).toFixed(1)}%.`,
          priority: 100,
          icon: 'warning',
          actionLabel: 'View Budgets',
          actionRoute: 'Budgets'
        });
      } else if (percentage >= 80) {
        insights.push({
          id: `budget_warning_${budget.id}`,
          type: 'warning',
          title: 'Nearing Budget Limit',
          description: `You have used ${percentage.toFixed(1)}% of your ${categoryName} budget.`,
          priority: 85,
          icon: 'eye',
          actionLabel: 'View Budgets',
          actionRoute: 'Budgets'
        });
      }
    });

    // 3. Spending Comparison (Month over Month)
    const previousExpense = previousMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    if (previousExpense > 0 && currentExpense > 0) {
      const increase = ((currentExpense - previousExpense) / previousExpense) * 100;
      // Note: Only generate if we are halfway through the month to avoid early month skew, 
      // or scale the previous expense to the current day. 
      // For simplicity, let's just do it if it's a significant increase.
      if (increase > 20 && now.getDate() > 15) {
        insights.push({
          id: 'spending_increase',
          type: 'alert',
          title: 'Spending Alert',
          description: `Your spending has increased by ${increase.toFixed(1)}% compared to last month.`,
          priority: 95,
          icon: 'trending-up'
        });
      } else if (increase < -10 && now.getDate() > 15) {
        insights.push({
          id: 'spending_decrease',
          type: 'success',
          title: 'Great Job!',
          description: `Your spending decreased by ${Math.abs(increase).toFixed(1)}% compared to last month.`,
          priority: 75,
          icon: 'trending-down'
        });
      }
    }

    // Sort by priority descending
    return insights.sort((a, b) => b.priority - a.priority);
  }
}
