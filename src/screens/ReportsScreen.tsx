import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../types';
import { CustomHeader } from '../components/CustomHeader';
import { theme } from '../theme/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Reports'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ReportsScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <CustomHeader title="Insights & Planning" />
      <View style={styles.content}>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('Budgets')}
      >
        <Ionicons name="flag" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Monthly Budgets</Text>
          <Text style={styles.cardDesc}>Set spending limits and track your progress</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('Subscriptions')}
      >
        <Ionicons name="swap-horizontal" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Subscriptions</Text>
          <Text style={styles.cardDesc}>Manage recurring subscription costs</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('Calendar')}
      >
        <Ionicons name="calendar" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Calendar View</Text>
          <Text style={styles.cardDesc}>View your transactions by day</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('SavingsGoals')}
      >
        <Ionicons name="wallet" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Savings Goals</Text>
          <Text style={styles.cardDesc}>Save up for a vacation, new laptop, or emergency fund</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('RecurringTransactions')}
      >
        <Ionicons name="repeat" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Recurring Transactions</Text>
          <Text style={styles.cardDesc}>Manage your automated bills, subscriptions, and salary</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('SpendingCharts')}
      >
        <Ionicons name="bar-chart" size={32} color={theme.colors.primary} style={styles.cardIcon} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Spending Charts</Text>
          <Text style={styles.cardDesc}>Visualize your income and expenses</Text>
        </View>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: theme.spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: { ...theme.typography.h3, color: theme.colors.textPrimary,
    marginBottom: 4, },
  cardDesc: { ...theme.typography.body2, color: theme.colors.textMuted, }
});
