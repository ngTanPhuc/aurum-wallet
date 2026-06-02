import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { TransactionItem } from '../components/TransactionItem';
import { MoneyAmount } from '../components/MoneyAmount';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

export const CalendarScreen = ({ navigation }: Props) => {
  const transactions = useFinanceStore(state => state.transactions);
  const wallets = useFinanceStore(state => state.wallets);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    transactions.forEach(t => {
      const dateStr = t.transactionDate.split('T')[0];
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(t);
    });
    return map;
  }, [transactions]);

  const handleDayPress = (day: Date) => {
    setSelectedDate(day);
  };

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return transactionsByDate.get(dateStr) || [];
  }, [selectedDate, transactionsByDate]);

  const renderDay = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTransactions = transactionsByDate.get(dateStr) || [];
    
    const hasIncome = dayTransactions.some(t => t.type === 'income');
    const hasExpense = dayTransactions.some(t => t.type === 'expense');

    return (
      <TouchableOpacity 
        key={day.toISOString()} 
        style={[styles.dayCell, isToday(day) && styles.todayCell]}
        onPress={() => handleDayPress(day)}
      >
        <Text style={[
          styles.dayText, 
          !isCurrentMonth && styles.dayTextOutside,
          isToday(day) && styles.todayText
        ]}>
          {format(day, 'd')}
        </Text>
        <View style={styles.indicators}>
          {hasIncome && <View style={[styles.indicator, { backgroundColor: '#4caf50' }]} />}
          {hasExpense && <View style={[styles.indicator, { backgroundColor: '#f44336' }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Selected Day Summary Calculation
  let selectedDayIncome = 0;
  let selectedDayExpense = 0;
  selectedDayTransactions.forEach(t => {
    if (t.type === 'income') selectedDayIncome += t.amount;
    if (t.type === 'expense') selectedDayExpense += t.amount;
  });

  return (
    <View style={styles.container}>
      <CustomHeader title="Calendar" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))}>
          <Text style={styles.navBtn}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))}>
          <Text style={styles.navBtn}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {daysInMonth.map(renderDay)}
      </View>

      {/* Selected Day Modal/Bottom Sheet */}
      <Modal
        visible={!!selectedDate}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Text style={styles.closeBtn}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Income</Text>
                <MoneyAmount amount={selectedDayIncome} currency="VND" style={[styles.summaryAmount, { color: '#4caf50' }]} />
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Expense</Text>
                <MoneyAmount amount={selectedDayExpense} currency="VND" style={[styles.summaryAmount, { color: '#f44336' }]} />
              </View>
            </View>

            <Text style={styles.listTitle}>Transactions ({selectedDayTransactions.length})</Text>
            
            <ScrollView style={styles.transactionList}>
              {selectedDayTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No activity on this day.</Text>
              ) : (
                selectedDayTransactions.map(t => {
                  return (
                    <TransactionItem 
                      key={t.id} 
                      transaction={t} 
                      onPress={() => {
                        setSelectedDate(null);
                        navigation.navigate('AddEditTransaction', { transactionId: t.id });
                      }}
                    />
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navBtn: {
    fontSize: 24,
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    fontWeight: 'bold',
  },
  monthTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, },
  weekDays: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weekDayText: { ...theme.typography.caption, flex: 1,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontWeight: '600', },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 60,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
  },
  todayCell: {
    backgroundColor: theme.colors.surfaceStrong,
  },
  dayText: { ...theme.typography.body2, color: theme.colors.textPrimary, },
  dayTextOutside: {
    color: theme.colors.textMuted,
    opacity: 0.5,
  },
  todayText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  indicators: {
    flexDirection: 'row',
    marginTop: 'auto',
    gap: 2,
    paddingBottom: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, },
  closeBtn: { ...theme.typography.body1, color: theme.colors.primary,
    fontWeight: '600', },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4, },
  summaryAmount: { ...theme.typography.h3 },
  listTitle: { ...theme.typography.body1, fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md, },
  transactionList: {
    maxHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  }
});
