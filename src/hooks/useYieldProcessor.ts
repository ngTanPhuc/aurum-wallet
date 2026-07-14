import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { YieldPocketService } from '../services/YieldPocketService';
import { TransactionService } from '../services/TransactionService';
import uuid from 'react-native-uuid';
import { getDb } from '../database/db';

export const useYieldProcessor = () => {
  const isLoading = useFinanceStore(state => state.isLoading);
  const yieldPocketSettings = useFinanceStore(state => state.yieldPocketSettings);
  const loadData = useFinanceStore(state => state.loadData);
  const appState = useRef(AppState.currentState);

  const processYield = async () => {
    if (isLoading) return;
    let yieldProcessed = false;
    const now = new Date();
    
    const db = await getDb();
    const defaultCategory = await db.getFirstAsync<{ id: string }>("SELECT id FROM categories WHERE name = 'Yield Interest' AND type = 'income'");
    const interestCategoryId = defaultCategory?.id;

    for (const settings of yieldPocketSettings) {
      if (settings.postingMode === 'auto') {
        const nextDateStr = settings.nextYieldDate || settings.createdAt;
        let currentDate = new Date(nextDateStr);
        let didAdvance = false;

        const wallet = await db.getFirstAsync<{balance: number}>('SELECT balance FROM wallets WHERE id = ?', settings.walletId);
        let currentWalletBalance = wallet?.balance || 0;
        
        while (currentDate.getTime() <= now.getTime()) {
          didAdvance = true;

          // T+1 Rollover: settle pending deposits FIRST, then calculate yield on the settled balance.
          if (settings.yieldRule === 'T1_FUND') {
            settings.interestBearingBalance += settings.pendingDeposit;
            settings.pendingDeposit = 0;
          }

          let expectedYield = 0;
          let baseBalance = settings.yieldRule === 'T1_FUND' ? settings.interestBearingBalance : currentWalletBalance;
          
          if (settings.yieldFrequency === 'daily') {
            expectedYield = YieldPocketService.calculateDailyYield(baseBalance, settings.currentApy);
          } else {
            expectedYield = YieldPocketService.calculateMonthlyYield(baseBalance, settings.currentApy);
          }
          
          if (expectedYield > 0) {
            const isoDate = currentDate.toISOString();
            // addTransaction → income → onDeposit will update the pocket's pendingDeposit.
            // The yield starts as "pending" for T+1 settlement (it earns on next day's rollover).
            await TransactionService.addTransaction({
              id: uuid.v4() as string,
              type: 'income',
              amount: expectedYield,
              sourceWalletId: settings.walletId,
              categoryId: interestCategoryId,
              note: 'Yield earned',
              transactionDate: isoDate,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            currentWalletBalance += expectedYield;
            // NOTE: Do NOT manually update settings.interestBearingBalance here.
            // The income transaction above calls onDeposit, which adds to pendingDeposit.
            // It will be settled into interestBearingBalance on the NEXT day's rollover — correct T+1 behavior.
          }

          settings.lastRolloverDate = currentDate.toISOString();
          const nextStr = YieldPocketService.getNextYieldDate(currentDate.toISOString(), settings.yieldFrequency);
          currentDate = new Date(nextStr);
          settings.nextYieldDate = nextStr;
          settings.lastYieldCalculatedAt = new Date().toISOString();
        }
        
        if (didAdvance) {
          settings.updatedAt = new Date().toISOString();
          await YieldPocketService.saveSettings(settings);
          yieldProcessed = true;
        }
      }
    }
    
    if (yieldProcessed) {
      await loadData();
    }
  };

  useEffect(() => {
    if (isLoading) return;
    
    processYield();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        processYield();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [yieldPocketSettings, isLoading]);
};
