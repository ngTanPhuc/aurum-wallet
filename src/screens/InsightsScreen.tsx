import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, BottomTabParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateDonutChartData, generateBarChartData, ChartDateRange } from '../utils/chartHelpers';
import { CustomHeader } from '../components/CustomHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { InsightCard } from '../components/InsightCard';
import { SpendingBreakdownChart } from '../components/charts/SpendingBreakdownChart';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Insights'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterOption = 'Week' | 'Month' | 'Year' | 'Custom';

export const InsightsScreen = ({ navigation }: Props) => {
  const { transactions, categories, getInsights } = useFinanceStore();
  const { settings } = useSettingsStore();
  const [filter, setFilter] = useState<FilterOption>('Month');
  
  const [customStart, setCustomStart] = useState<Date>(startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState<Date>(endOfMonth(new Date()));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const insights = useMemo(() => getInsights().slice(0, 3), [transactions, getInsights]);

  const dateRange = useMemo<ChartDateRange>(() => {
    const now = new Date();
    switch (filter) {
      case 'Week': return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'Month': return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'Year': return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'Custom': return { startDate: customStart, endDate: customEnd };
    }
  }, [filter, customStart, customEnd]);

  const { data: donutData, totalExpense } = useMemo(
    () => generateDonutChartData(transactions, categories, dateRange),
    [transactions, categories, dateRange]
  );

  const { barData, totalIncome, totalExpense: barExpense } = useMemo(
    () => generateBarChartData(transactions, dateRange),
    [transactions, dateRange]
  );

  const netCashFlow = totalIncome - barExpense;

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

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Insights" 
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('Calendar' as any)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 80, padding: theme.spacing.lg }}>
        
        <View style={styles.headerArea}>
          <Text style={styles.subtitle}>Understand where your money goes</Text>
        </View>

        {renderFilterPills()}

        {filter === 'Custom' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
              <Text style={styles.dateLabel}>Start</Text>
              <Text style={styles.dateValue}>{format(customStart, 'MMM d')}</Text>
            </TouchableOpacity>
            <Text style={styles.dateTo}>to</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
              <Text style={styles.dateLabel}>End</Text>
              <Text style={styles.dateValue}>{format(customEnd, 'MMM d')}</Text>
            </TouchableOpacity>
          </View>
        )}

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

        <GlassCard variant="strong" style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Cash Flow Summary</Text>
          <Text style={styles.dateSubtitle}>{format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}</Text>
          
          <Text style={styles.netCashFlowValue}>{netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}</Text>
          <Text style={styles.netCashFlowLabel}>Net Cash Flow</Text>
          
          <View style={styles.summaryStatsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.success }]} />
              <View>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={styles.statValue}>{formatCurrency(totalIncome)}</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statDot, { backgroundColor: theme.colors.danger }]} />
              <View>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={styles.statValue}>{formatCurrency(barExpense)}</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>Spending Breakdown</Text>
        <GlassCard style={styles.chartCard}>
          <SpendingBreakdownChart 
            data={donutData} 
            totalExpense={totalExpense} 
            formatCurrency={formatCurrency} 
          />
        </GlassCard>

        <Text style={styles.sectionTitle}>Income vs Expense Trend</Text>
        <GlassCard style={styles.chartCard}>
          {totalIncome > 0 || barExpense > 0 ? (
            <View style={styles.barChartWrapper}>
              <BarChart
                data={barData}
                barWidth={16}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules={false}
                rulesColor={theme.colors.border}
                xAxisThickness={1}
                xAxisColor={theme.colors.border}
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
                maxValue={Math.max(...barData.map(d => d.value), 100) * 1.1}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No data to show.</Text>
          )}
        </GlassCard>

        {donutData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <GlassCard style={styles.categoriesCard}>
              {donutData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.label}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                    <Text style={styles.categoryPercent}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {insights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Smart Insights</Text>
            {insights.map(insight => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onActionPress={(route) => navigation.navigate(route as any)} 
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { flex: 1 },
  headerArea: { marginBottom: 16 },
  subtitle: { ...theme.typography.body1, color: theme.colors.textMuted },
  
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.round,
    padding: 4,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.subtle,
  },
  filterPill: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.radii.round },
  filterPillActive: { backgroundColor: theme.colors.primary },
  filterText: { ...theme.typography.caption, fontWeight: '600', color: theme.colors.textMuted },
  filterTextActive: { color: theme.colors.background },

  customDateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  dateBtn: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, flex: 1, alignItems: 'center', ...theme.shadows.subtle },
  dateLabel: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 4 },
  dateValue: { ...theme.typography.body2, fontWeight: '600', color: theme.colors.textPrimary },
  dateTo: { marginHorizontal: theme.spacing.md, color: theme.colors.textMuted, fontWeight: 'bold' },

  summaryCard: { padding: 20, marginBottom: 20, alignItems: 'center' },
  summaryCardTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 4 },
  dateSubtitle: { ...theme.typography.caption, color: theme.colors.textMuted, marginBottom: 16 },
  netCashFlowValue: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: 4 },
  netCashFlowLabel: { ...theme.typography.body2, color: theme.colors.textMuted, marginBottom: 20 },
  
  summaryStatsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statBox: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  statDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  statValue: { ...theme.typography.body1, fontWeight: 'bold', color: theme.colors.textPrimary },

  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: 12, marginTop: 8 },
  chartCard: { padding: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  chartWrapper: { alignItems: 'center', justifyContent: 'center' },
  barChartWrapper: { marginTop: 10, width: '100%' },
  emptyText: { ...theme.typography.body2, color: theme.colors.textMuted, fontStyle: 'italic', paddingVertical: 20 },

  categoriesCard: { padding: 16, marginBottom: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryColor: { width: 12, height: 12, borderRadius: 4, marginRight: 12 },
  categoryName: { ...theme.typography.body1, color: theme.colors.textPrimary },
  categoryRight: { alignItems: 'flex-end' },
  categoryAmount: { ...theme.typography.body2, fontWeight: '600', color: theme.colors.textPrimary },
  categoryPercent: { ...theme.typography.caption, color: theme.colors.textMuted },
});
