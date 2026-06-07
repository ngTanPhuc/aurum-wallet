import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { theme } from '../../theme/theme';

export interface SpendingBreakdownChartProps {
  data: any[];
  totalExpense: number;
  formatCurrency: (amount: number) => string;
}

export function SpendingBreakdownChart({ data, totalExpense, formatCurrency }: SpendingBreakdownChartProps) {
  if (!data || data.length === 0) {
    return <Text style={styles.emptyText}>No expenses to show.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        
        {/* Left Column: Legend & Total */}
        <View style={styles.leftColumn}>
          <View style={styles.legendContainer}>
            {data.map((item: any, index: number) => (
              <View key={index} style={styles.legendItem}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendColorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendCategoryName} numberOfLines={1}>{item.label}</Text>
                </View>
                <Text style={styles.legendPercentage}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalWrapper}>
            <Text style={styles.totalAmountLabel}>Total Expense</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalExpense)}</Text>
          </View>
        </View>

        {/* Right Column: Pie Chart */}
        <View style={styles.rightColumn}>
          <PieChart
            data={data}
            donut={false}
            sectionAutoFocus
            radius={70}
            innerCircleColor={'transparent'}
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendCategoryName: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    flexShrink: 1, // Ensures ellipsis works properly in a row
    maxWidth: 100, // Strictly reduces the maximum length before truncating
  },
  legendPercentage: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
  },
  totalWrapper: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalAmountLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  totalAmount: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 20,
    textAlign: 'center',
  },
});
