import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
      if (settings.postingMode !== 'auto') continue;

      const nextDateStr = settings.nextYieldDate || settings.createdAt;
      let currentDate = new Date(nextDateStr);
      let didAdvance = false;

      // Read current wallet balance for STANDARD rule
      const walletRow = await db.getFirstAsync<{ balance: number }>('SELECT balance FROM wallets WHERE id = ?', settings.walletId);
      let currentWalletBalance = walletRow?.balance ?? 0;

      while (currentDate.getTime() <= now.getTime()) {
        didAdvance = true;

        // ── T1_FUND: settle pendingDeposit once the settlement date has passed ──
        if (settings.yieldRule === 'T1_FUND' && settings.pendingDeposit > 0) {
          const settlementDate = settings.pendingSettlementDate
            ? new Date(settings.pendingSettlementDate)
            : null;

          if (!settlementDate || currentDate >= settlementDate) {
            settings.interestBearingBalance += settings.pendingDeposit;
            settings.pendingDeposit = 0;
            settings.pendingSettlementDate = null;
          }
        }

        // ── Determine base balance for yield calculation ──────────────────────
        const baseBalance = settings.yieldRule === 'T1_FUND'
          ? settings.interestBearingBalance
          : currentWalletBalance;

        // ── Threshold gate ────────────────────────────────────────────────────
        const minBalance = settings.minimumBalance ?? 0;
        const meetsThreshold = minBalance <= 0 || baseBalance >= minBalance;

        // ── Settlement gate for STANDARD rule ────────────────────────────────
        // T1_FUND gate is implicit: interestBearingBalance is 0 until settled.
        const stdSettlementPassed = settings.yieldRule !== 'STANDARD' ||
          !settings.pendingSettlementDate ||
          currentDate >= new Date(settings.pendingSettlementDate);

        // ── Calculate yield with fractional carry ─────────────────────────────
        let expectedYield = 0;
        let newCarry = settings.fractionalYieldCarry ?? 0;

        if (
          meetsThreshold &&
          settings.isQualified &&
          baseBalance > 0 &&
          stdSettlementPassed
        ) {
          if (settings.yieldFrequency === 'daily') {
            const result = YieldPocketService.calculateDailyYieldWithCarry(
              baseBalance, settings.currentApy, newCarry
            );
            expectedYield = result.yield;
            newCarry = result.newCarry;
          } else {
            const result = YieldPocketService.calculateMonthlyYieldWithCarry(
              baseBalance, settings.currentApy, newCarry
            );
            expectedYield = result.yield;
            newCarry = result.newCarry;
          }
        }
        // Always persist the updated carry (even if 0 yield this day, carry accumulates)
        settings.fractionalYieldCarry = newCarry;

        // ── Post yield transaction ────────────────────────────────────────────
        if (expectedYield > 0) {
          const isoDate = currentDate.toISOString();
          // note = 'Yield earned' is checked in TransactionService to set isYieldIncome=true,
          // preventing onDeposit from re-triggering the threshold settlement window.
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
          // NOTE: onDeposit (called via addTransaction) adds yield to pendingDeposit.
          // It will settle into interestBearingBalance on the NEXT day's rollover — T+1 compound.
        }

        // ── Advance loop ──────────────────────────────────────────────────────
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
