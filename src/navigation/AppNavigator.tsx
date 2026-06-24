import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, BottomTabParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { GlassBottomTab } from '../components/glass/GlassBottomTab';

import { useSettingsStore } from '../store/useSettingsStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { initDb } from '../database/db';
import { CategoryService } from '../services/CategoryService';
import { BudgetService } from '../services/BudgetService';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { WalletsScreen } from '../screens/WalletsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { InsightsScreen } from '../screens/InsightsScreen';

import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { AddEditWalletScreen } from '../screens/AddEditWalletScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PinLockScreen } from '../screens/PinLockScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { AddEditBudgetScreen } from '../screens/AddEditBudgetScreen';
import { SavingsGoalsScreen } from '../screens/SavingsGoalsScreen';
import { SavingsGoalDetailScreen } from '../screens/SavingsGoalDetailScreen';
import { AddEditSavingsGoalScreen } from '../screens/AddEditSavingsGoalScreen';
import { RecurringTransactionsScreen } from '../screens/RecurringTransactionsScreen';
import { AddEditRecurringTransactionScreen } from '../screens/AddEditRecurringTransactionScreen';
import { PendingRecurringScreen } from '../screens/PendingRecurringScreen';
import { SpendingChartsScreen } from '../screens/SpendingChartsScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { AddEditTemplateScreen } from '../screens/AddEditTemplateScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SavingsDepositsScreen } from '../screens/SavingsDepositsScreen';
import { SavingsDepositDetailScreen } from '../screens/SavingsDepositDetailScreen';
import { AddEditSavingsDepositScreen } from '../screens/AddEditSavingsDepositScreen';
import { YieldPocketsScreen } from '../screens/YieldPocketsScreen';
import { AddEditYieldPocketScreen } from '../screens/AddEditYieldPocketScreen';

import { DebtDashboardScreen } from '../screens/DebtDashboardScreen';
import { AddEditDebtScreen } from '../screens/AddEditDebtScreen';
import { DebtDetailScreen } from '../screens/DebtDetailScreen';
import { RecordDebtPaymentScreen } from '../screens/RecordDebtPaymentScreen';
import { PeopleScreen } from '../screens/PeopleScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddEditPersonScreen } from '../screens/AddEditPersonScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <GlassBottomTab {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Wallets" component={WalletsScreen} options={{ title: 'Wallets' }} />
      <Tab.Screen name="Plan" component={PlanScreen} options={{ title: 'Plan' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const { settings, isLoading: settingsLoading, loadSettings } = useSettingsStore();
  const { loadData } = useFinanceStore();
  const [dbReady, setDbReady] = React.useState(false);
  const [pinVerified, setPinVerified] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [initTimedOut, setInitTimedOut] = React.useState(false);

  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!settings.pinEnabled) {
      setPinVerified(true);
    }
  }, [settings.pinEnabled]);

  const runInit = React.useCallback(async () => {
    setInitError(null);
    setInitTimedOut(false);
    setDbReady(false);

    // Start a 12s timeout; if init doesn't finish, show retry UI
    initTimeoutRef.current = setTimeout(() => {
      setInitTimedOut(true);
    }, 12000);

    try {
      await initDb();
      await CategoryService.seedDefaultCategories();
      setDbReady(true);
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      await loadSettings();
      await loadData();
    } catch (e: any) {
      console.error('Initialization error:', e);
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      setInitError(e?.message || e?.toString() || 'Unknown initialization error');
    }
  }, [loadSettings, loadData]);

  useEffect(() => {
    runInit();
  }, [runInit]);

  if (!dbReady || settingsLoading) {
    if (initError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020C17', padding: 24 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>
            Initialization failed
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
            {initError}
          </Text>
          <TouchableOpacity
            onPress={runInit}
            style={{ backgroundColor: '#D4AF37', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#020C17', fontWeight: '700', fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (initTimedOut) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020C17', padding: 24 }}>
          <Text style={{ color: '#fbbf24', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>
            Taking longer than expected
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
            The app may still be loading. Check your internet connection.
          </Text>
          <TouchableOpacity
            onPress={runInit}
            style={{ backgroundColor: '#D4AF37', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#020C17', fontWeight: '700', fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020C17' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        {settings.isFirstRun ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />

        <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
          <Stack.Screen 
            name="AddEditTransaction" 
            component={AddTransactionScreen} 
            options={{ title: 'Transaction' }} 
          />
          <Stack.Screen 
        name="AddEditWallet" 
        component={AddEditWalletScreen} 
        options={{ title: 'Wallet', presentation: 'modal' }}
      />
      <Stack.Screen 
        name="Budgets" 
        component={BudgetsScreen} 
        options={{ title: 'Monthly Budgets' }}
      />
      <Stack.Screen 
        name="AddEditBudget" 
        component={AddEditBudgetScreen} 
        options={{ title: 'Budget', presentation: 'modal' }}
      />
          <Stack.Screen 
            name="AddEditSavingsGoal" 
            component={AddEditSavingsGoalScreen} 
            options={({ route }) => ({
              title: route.params?.goalId ? 'Edit Goal' : 'New Goal'
            })} 
          />
          <Stack.Screen 
            name="AddEditSavingsDeposit" 
            component={AddEditSavingsDepositScreen} 
            options={{ title: 'Deposit', presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="AddEditYieldPocket" 
            component={AddEditYieldPocketScreen} 
            options={{ title: 'Yield Pocket', presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="AddEditDebt" 
            component={AddEditDebtScreen} 
            options={{ title: 'Debt', presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="RecordDebtPayment" 
            component={RecordDebtPaymentScreen} 
            options={{ title: 'Record Payment', presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="AddEditPerson" 
            component={AddEditPersonScreen} 
            options={{ title: 'Person', presentation: 'modal' }} 
          />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Settings', headerShown: false }} 
          />
          <Stack.Screen 
            name="SavingsGoals" 
            component={SavingsGoalsScreen} 
            options={{ title: 'Savings Goals', headerShown: false }} 
          />
          <Stack.Screen 
            name="SavingsGoalDetail" 
            component={SavingsGoalDetailScreen} 
            options={{ title: 'Goal Details', headerShown: false }} 
          />
          <Stack.Screen 
            name="SavingsDeposits" 
            component={SavingsDepositsScreen} 
            options={{ title: 'Savings Deposits', headerShown: false }} 
          />
          <Stack.Screen 
            name="SavingsDepositDetail" 
            component={SavingsDepositDetailScreen} 
            options={{ title: 'Deposit Details', headerShown: false }} 
          />
          <Stack.Screen 
            name="YieldPockets" 
            component={YieldPocketsScreen} 
            options={{ title: 'Yield Pockets', headerShown: false }} 
          />
          <Stack.Screen 
            name="RecurringTransactions" 
            component={RecurringTransactionsScreen} 
            options={{ title: 'Recurring Transactions', headerShown: false }} 
          />
          <Stack.Screen 
            name="AddEditRecurringTransaction" 
            component={AddEditRecurringTransactionScreen} 
            options={({ route }) => ({
              title: route.params?.recurringId ? 'Edit Recurring' : 'New Recurring',
              headerShown: false
            })} 
          />
          <Stack.Screen 
            name="PendingRecurring" 
            component={PendingRecurringScreen} 
            options={{ title: 'Pending Transactions', headerShown: false }} 
          />
          <Stack.Screen 
            name="SpendingCharts" 
            component={SpendingChartsScreen} 
            options={{ title: 'Spending Charts', headerShown: false }} 
          />
          <Stack.Screen 
            name="Templates" 
            component={TemplatesScreen} 
            options={{ title: 'Transaction Templates', headerShown: false }} 
          />
          <Stack.Screen 
            name="Tags" 
            component={TagsScreen} 
            options={{ title: 'Manage Tags', headerShown: false }} 
          />
          <Stack.Screen 
            name="Subscriptions" 
            component={SubscriptionsScreen} 
            options={{ title: 'Subscriptions', headerShown: false }} 
          />
          <Stack.Screen 
            name="Calendar" 
            component={CalendarScreen} 
            options={{ title: 'Calendar', headerShown: false }} 
          />
          <Stack.Screen 
            name="DebtDashboard" 
            component={DebtDashboardScreen} 
            options={{ title: 'Debt & Lending', headerShown: false }} 
          />
          <Stack.Screen 
            name="DebtDetail" 
            component={DebtDetailScreen} 
            options={{ title: 'Debt Details', headerShown: false }} 
          />
          <Stack.Screen 
            name="People" 
            component={PeopleScreen} 
            options={{ title: 'People', headerShown: false }} 
          />
          <Stack.Screen 
            name="PersonDetail" 
            component={PersonDetailScreen} 
            options={{ title: 'Person Details', headerShown: false }} 
          />
        </Stack.Group>
        <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
          <Stack.Screen 
            name="AddEditTemplate" 
            component={AddEditTemplateScreen} 
            options={({ route }) => ({
              title: route.params?.templateId ? 'Edit Template' : 'New Template'
            })} 
          />
        </Stack.Group>
        </>
        )}
        <Stack.Screen
          name="PinLock"
          component={PinLockScreen}
          initialParams={{ mode: 'verify' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
