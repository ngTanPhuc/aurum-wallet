import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateDonutChartData, generateBarChartData, ChartDateRange } from '../utils/chartHelpers';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SpendingCharts'>;
type FilterOption = 'Week' | 'Month' | 'Year' | 'Custom';

export const SpendingChartsScreen = ({ navigation }: Props) => {
  const { transactions, categories } = useFinanceStore();
  const { settings } = useSettingsStore();
  const [filter, setFilter] = useState<FilterOption>('Month');
  
  // Custom Date Picker State
  const [customStart, setCustomStart] = useState<Date>(startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState<Date>(endOfMonth(new Date()));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Compute date range based on filter
  const dateRange = useMemo<ChartDateRange>(() => {
    const now = new Date();
    switch (filter) {
      case 'Week':
        return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'Month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'Year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'Custom':
        return { startDate: customStart, endDate: customEnd };
    }
  }, [filter, customStart, customEnd]);

  // Aggregate Data
  const { data: donutData, totalExpense } = useMemo(
    () => generateDonutChartData(transactions, categories, dateRange),
    [transactions, categories, dateRange]
  );

  const { barData, totalIncome, totalExpense: barExpense } = useMemo(
    () => generateBarChartData(transactions, dateRange),
    [transactions, dateRange]
  );

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { style: 'currency', currency: settings.defaultCurrency });
  };

  const renderFilterPills = () => {
    const options: FilterOption[] = ['Week', 'Month', 'Year', 'Custom'];
    return (
      <View style={styles.filterContainer}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterPill, filter === opt && styles.filterPillActive]}
            onPress={() => setFilter(opt)}
          >
            <Text style={[styles.filterText, filter === opt && styles.filterTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCustomDatePickers = () => {
    if (filter !== 'Custom') return null;
    return (
      <View style={styles.customDateContainer}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
          <Text style={styles.dateLabel}>Start</Text>
          <Text style={styles.dateValue}>{format(customStart, 'MMM d, yyyy')}</Text>
        </TouchableOpacity>
        <Text style={styles.dateTo}>to</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
          <Text style={styles.dateLabel}>End</Text>
          <Text style={styles.dateValue}>{format(customEnd, 'MMM d, yyyy')}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? customStart : customEnd}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPicker(null);
              if (date) {
                if (showPicker === 'start') setCustomStart(date);
                else setCustomEnd(date);
              }
            }}
          />
        )}
      </View>
    );
  };

  const renderLegend = () => {
    if (donutData.length === 0) return null;
    return (
      <View style={styles.legendContainer}>
        {donutData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.legendPercent}>{item.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Analytics" />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40, padding: theme.spacing.lg }}>
        {renderFilterPills()}
      {renderCustomDatePickers()}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense Breakdown</Text>
        <Text style={styles.dateSubtitle}>{format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}</Text>

        {donutData.length > 0 ? (
          <>
            <View style={styles.chartWrapper}>
              <PieChart
                data={donutData}
                donut
                showGradient
                sectionAutoFocus
                radius={100}
                innerRadius={65}
                innerCircleColor={'#ffffff'}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelText}>Total Spent</Text>
                    <Text style={styles.centerLabelAmount}>{formatCurrency(totalExpense)}</Text>
                  </View>
                )}
              />
            </View>
            {renderLegend()}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses found for this period.</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Income vs Expense</Text>
        <Text style={styles.dateSubtitle}>{format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: '#10B981' }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>{formatCurrency(barExpense)}</Text>
          </View>
        </View>

        {barData.length > 0 ? (
          <View style={styles.barChartWrapper}>
            <BarChart
              data={barData}
              barWidth={16}
              spacing={20}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: 'gray', fontSize: 11 }}
              yAxisLabelWidth={50}
              formatYLabel={(val) => {
                const num = Number(val);
                if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
                return num.toString();
              }}
              noOfSections={4}
              maxValue={Math.max(totalIncome, barExpense, 100) * 1.1} // Dynamic max
              isAnimated
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No data to show.</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.round,
    padding: 4,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.subtle,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.round,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: { ...theme.typography.caption, fontWeight: '600',
    color: theme.colors.textMuted, },
  filterTextActive: {
    color: theme.colors.background,
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  dateBtn: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    flex: 1,
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  dateLabel: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginBottom: 4, },
  dateValue: { ...theme.typography.body2, fontWeight: '600',
    color: theme.colors.text, },
  dateTo: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.subtle,
  },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text, },
  dateSubtitle: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginTop: 4,
    marginBottom: theme.spacing.xl, },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelText: { ...theme.typography.caption, color: theme.colors.textMuted, },
  centerLabelAmount: { ...theme.typography.body1, fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4, },
  legendContainer: {
    marginTop: theme.spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.sm,
  },
  legendLabel: { ...theme.typography.body2, color: theme.colors.text,
    fontWeight: '500', },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: { ...theme.typography.body2, fontWeight: '600',
    color: theme.colors.text, },
  legendPercent: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginTop: 2, },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.md,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted,
    marginBottom: 4, },
  summaryAmount: { ...theme.typography.h3 },
  barChartWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: { ...theme.typography.body2, color: theme.colors.textMuted,
    fontStyle: 'italic', },
});
