import { Transaction, Budget, SavingsGoal, Category, Insight, InsightType } from '../types';

type GetBudgetProgressFn = (budgetId: string, targetDate: string) => {
  spent: number;
  budgeted: number;
  remaining: number;
  percentage: number;
  cycleStart: string;
  cycleEnd: string;
};

export class InsightEngine {
  static generateInsights(
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    categories: Category[],
    getBudgetProgress: GetBudgetProgressFn
  ): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();

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
      // Bug 3 fix: soften the wording — don't assume negative cash flow, just nudge the user
      insights.push({
        id: 'no_income_recorded',
        type: 'warning',
        title: 'No Income Recorded Yet',
        description: `No income recorded yet this month. Make sure your income is up to date.`,
        priority: 60,
        icon: 'information-circle'
      });
    }

    // 2. Budget Utilization
    // Bug 1 fix: use getBudgetProgress which respects the budget's own recurrence window
    // Bug 4 fix: improved threshold messaging
    const todayIso = now.toISOString();

    budgets.forEach(budget => {
      const { spent, budgeted, percentage: rawPct } = getBudgetProgress(budget.id, todayIso);
      // Note: getBudgetProgress already caps percentage at 100, so we recalculate uncapped here
      const uncappedPct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
      const budgetName = budget.name;

      if (uncappedPct >= 100) {
        const overspentAmount = spent - budgeted;
        let description: string;

        if (uncappedPct === 100) {
          description = `You've hit your ${budgetName} budget limit (100% used).`;
        } else {
          // Format the overspent amount
          const overFormatted = overspentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
          description = `You've exceeded your ${budgetName} budget by ${overFormatted} (${uncappedPct.toFixed(0)}% used).`;
        }

        insights.push({
          id: `budget_exceeded_${budget.id}`,
          type: 'alert',
          title: 'Budget Exceeded',
          description,
          priority: 100,
          icon: 'warning',
          actionLabel: 'View Budgets',
          actionRoute: 'Budgets'
        });
      } else if (uncappedPct >= 80) {
        insights.push({
          id: `budget_warning_${budget.id}`,
          type: 'warning',
          title: 'Nearing Budget Limit',
          description: `You've used ${uncappedPct.toFixed(0)}% of your ${budgetName} budget.`,
          priority: 85,
          icon: 'eye',
          actionLabel: 'View Budgets',
          actionRoute: 'Budgets'
        });
      }
    });

    // 3. Spending Comparison (Month over Month)
    // Bug 2 fix: pro-rate previous month spending for fair comparison
    const previousExpense = previousMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    if (previousExpense > 0 && currentExpense > 0) {
      // Scale previous month spending to what it would be up to the current day
      const proRatedPreviousExpense = previousExpense * (currentDay / daysInPreviousMonth);
      const increase = ((currentExpense - proRatedPreviousExpense) / proRatedPreviousExpense) * 100;

      if (increase > 20) {
        insights.push({
          id: 'spending_increase',
          type: 'alert',
          title: 'Spending Alert',
          description: `Your spending has increased by ${increase.toFixed(1)}% compared to the same period last month.`,
          priority: 95,
          icon: 'trending-up'
        });
      } else if (increase < -10) {
        insights.push({
          id: 'spending_decrease',
          type: 'success',
          title: 'Great Job!',
          description: `Your spending decreased by ${Math.abs(increase).toFixed(1)}% compared to the same period last month.`,
          priority: 75,
          icon: 'trending-down'
        });
      }
    }

    // Sort by priority descending
    return insights.sort((a, b) => b.priority - a.priority);
  }
}
