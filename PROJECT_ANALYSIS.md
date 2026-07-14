# Aurum Wallet — Project Analysis

## Overview

Aurum Wallet is a personal finance management mobile application built with Expo SDK 56 (React Native 0.85.3). It features a dark glassmorphism design system and supports multi-wallet tracking, transactions, budgets, savings goals, recurring transactions, debt/lending management, and financial insights.

**Version:** 1.1.4  
**Package:** `com.ngtanphuc.aurumwallet`  
**Orientation:** Portrait-only, dark mode only  
**Platform support:** Android (primary), iOS (configured for tablets), Web (via react-native-web)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 56 (React Native 0.85.3) |
| **Language** | TypeScript ~5.9.2 (strict mode) |
| **Navigation** | React Navigation 7 (native-stack + bottom-tabs) |
| **State Management** | Zustand 5 |
| **Database** | expo-sqlite (local SQLite with 10 sequential migrations, 14 tables, 10 indexes) |
| **Secure Storage** | expo-secure-store |
| **Fonts** | Hanken Grotesk (headings), Inter (body), JetBrains Mono (labels/metadata) |
| **Charts** | react-native-gifted-charts + react-native-svg |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Date Handling** | date-fns v4 |
| **Gradients** | expo-linear-gradient |
| **Keypad** | Custom KeypadContext (animated numeric overlay) |
| **Testing** | Jest 29 + @testing-library/react-native 13 |
| **UUID** | react-native-uuid |
| **Build** | EAS Build (preview/APK), Metro bundler |

---

## Architecture

### Data Flow
```
Screens → Zustand Store (optimistic updates) → Services (CRUD) → SQLite Database
```

### Navigation Structure
- **Root:** Single `NativeStackNavigator` containing:
  - `HomeTabs`: 5-tab `BottomTabNavigator` (Dashboard, Transactions, Wallets, Plan, Insights)
  - `Onboarding`: First-run flow (conditional)
  - `PinLock`: PIN create/verify/remove (wired but incomplete)
  - ~25 modal/full-screen routes for entity CRUD and detail views

### State Management (Zustand)
- **`useFinanceStore`** — all financial data (wallets, transactions, categories, budgets, savings goals, recurring transactions, templates, tags, savings deposits, yield pockets, people, debts, debt payments) plus CRUD operations, filtering/sorting, and computed metrics
  - Uses **optimistic updates** for transactions (update UI immediately, persist to DB in background, revert on failure)
- **`useSettingsStore`** — app preferences (default currency, PIN toggle, theme, first-run flag)

### Services Layer
15 service modules, each encapsulating all SQL queries for a domain entity:
- `WalletService`, `CategoryService`, `TransactionService`, `BudgetService`, `SavingsGoalService`, `RecurringTransactionService`, `TransactionTemplateService`, `TagService`, `SavingsDepositService`, `YieldPocketService`, `PersonService`, `DebtService`, `FinancialIntegrityService`, `InsightEngine`, `SettingsService`

### Database (SQLite)
- Singleton connection via `getDb()` with `PRAGMA foreign_keys = ON`
- 10 sequential migrations tracked in a `migrations` table
- 14 tables: wallets, categories, transactions, budgets, recurring_transactions, savings_goals, app_settings, transaction_templates, tags, transaction_tags, savings_deposits, yield_pocket_settings, people, debts, debt_payments
- 10 indexes for query performance
- `resetDb()` drops all tables and re-runs migrations

### Design System (`src/theme/theme.ts`)
- **Glassmorphism dark theme** on deep blue/black backgrounds (`#020C17`, `#051121`)
- **Gold accents** (`#D4AF37` primary) with emerald success, crimson danger, amber warning, muted blue info
- **Surfaces:** Semi-transparent white (`rgba(255,255,255,0.06)` to `0.10`) with glass borders
- **Typography:** 3-font system (Hanken Grotesk headings, Inter body, JetBrains Mono labels)
- **Spacing:** xs(4) through xxxl(36)
- **Radii:** sm(8) to round(9999), with inputs at md(14), buttons at lg(18), glass cards at xl(22)
- **Shadows:** All explicitly disabled (transparent) for glass aesthetic

### Key Components
- **Glass UI System:** `GlassCard` (3 variants), `GlassButton` (primary/secondary/danger), `GlassInput`, `GlassBottomTab` (floating pill), `MoneyDisplay`, `AmountInput`, `CustomKeypad`
- **Layout:** `AppScreen` (safe area + optional scroll + background), `SectionHeader`, `CustomHeader`
- **Data Display:** `TransactionItem`, `WalletCard`, `BudgetProgressCard`, `SavingsGoalCard`, `SavingsDepositCard`, `InsightCard`, `MetricCard`, `SummaryCard`, `SummaryMetricCard`, `FeatureTile`, `EmptyState`
- **Charts:** `SpendingBreakdownChart` (donut: expenses by category, bar: income vs expense)
- **Pickers:** `CategoryPicker`, `WalletPicker`, `TagPicker`, `FilterModal`
- **FAB:** `GlobalFAB`

---

## Features (Implemented)

| Feature | Details |
|---|---|
| **Multi-wallet** | Cash, bank, e-wallet, savings, credit, custom types; balance tracking, archiving, include-in-total toggle |
| **Transactions** | Expense, income, transfer, adjustment types; tags, notes, fees, filters, search, sort, category linkage |
| **Categories** | Default seeding, expense/income types, icons, colors, archiving |
| **Budgets** | Monthly per-category budgets with progress tracking (spent/budgeted/remaining/percentage) |
| **Savings Goals** | Target amount, linked wallet, progress tracking, auto-completion detection |
| **Savings Deposits** | Term deposits with interest rates, maturity dates, payout types (at_maturity/monthly/upfront), status tracking (active/matured/closed_early) |
| **Yield Pockets** | Per-wallet yield rate settings, auto/manual posting modes |
| **Recurring Transactions** | Daily/weekly/monthly/yearly frequency, subscription flag, pending confirmation flow |
| **Transaction Templates** | Reusable presets with icons/colors |
| **Tags** | Flexible tagging with colors, transaction-tag M2M join table |
| **Debt & Lending** | Full debt tracking (lent/borrowed), interest types (none/flat/simple_annual), payment recording, person management |
| **People Management** | Contact info, avatar colors, debt linking |
| **Spending Charts** | Donut chart (expenses by category, top-5 + others) and bar chart (income vs expense) |
| **Smart Insights** | Auto-generated savings rate, budget utilization, spending comparison alerts |
| **Dashboard** | Total balance (glass card), income/expense summary, horizontal metric scroll, recent transactions |
| **Calendar View** | Transaction calendar |
| **Custom Keypad** | Full-screen numeric input with animation |
| **PIN Lock** | Create/verify/remove PIN (wired in navigation, not fully implemented) |
| **Onboarding** | First-run flow |
| **Settings** | Currency selection, data wipe, PIN toggle, first-run completion |
| **Financial Integrity** | Balance reconciliation & repair tool |

---

## File Structure

```
src/
├── components/
│   ├── __tests__/              # 13 component test files
│   ├── charts/                  # SpendingBreakdownChart
│   ├── dashboard/               # FeatureTile, SummaryMetricCard
│   ├── glass/                   # Glass UI system (7 components)
│   ├── layout/                  # AppScreen, SectionHeader
│   └── (17 individual components)
├── context/
│   └── KeypadContext.tsx
├── database/
│   ├── __tests__/
│   ├── db.ts                    # DB init, 10 migrations, reset
│   └── schema.ts                # 14 table schemas + 10 indexes
├── navigation/
│   └── AppNavigator.tsx         # Stack + Bottom Tab navigation
├── screens/
│   ├── __tests__/               # 16 screen test files
│   └── (36 screen files)
├── services/
│   ├── __tests__/               # 10 service test files
│   └── (15 service files)
├── store/
│   ├── __tests__/
│   ├── useFinanceStore.ts       # Main finance state (Zustand, ~722 lines)
│   └── useSettingsStore.ts      # App settings state (Zustand)
├── theme/
│   └── theme.ts                 # Design system
├── types/
│   ├── index.ts                 # All data types + navigation param lists
│   └── insights.ts              # Insight type definitions
└── utils/
    ├── __tests__/
    ├── chartHelpers.ts
    └── formatters.ts
```

---

## Test Coverage

- **Overall line coverage:** ~80% (1,691 lines total, 1,354 covered)
- **Test files:** 40+ across components (13), screens (16), services (10), store (2), utils (1)
- **0% coverage areas:** Navigation (`AppNavigator.tsx`), `SpendingChartsScreen`, `OnboardingScreen`, `PinLockScreen`, `AddEditWalletScreen`, `SavingsGoalsScreen` and several other screens

---

## Known Issues

### TypeScript Errors (75 total)
Systematically categorized:

1. **Duplicate `color` property in spread operators** (~35 errors) — Components like `CategoryPicker`, `FilterModal`, `TagPicker`, `WalletPicker`, and many screens apply `{ ...item, color }` where `item` already has an optional `color` property, causing TS2783. Fix: destructure `color` out before spreading, or rename the variable.

2. **Missing required properties in test fixtures** (~30 errors) — Test files haven't been updated to match latest type definitions:
   - Missing `note` field on `Transaction` and `TransactionTemplate` objects
   - Missing `initialBalance`, `includeInTotal`, `isArchived` on `Wallet` objects
   - Missing `isDefault`, `isArchived`, `createdAt`, `updatedAt` on `Category` objects
   - `walletId` used instead of `sourceWalletId` on `Transaction` objects
   - Missing `priority` on `Insight` objects

3. **`full` property missing on `radii`** (2 errors) — `SpendingChartsScreen` and `SubscriptionsScreen` reference `theme.radii.full` which doesn't exist (should be `round`)

4. **`never` type in `WalletsScreen` tests** (4 errors) — Object literals not assignable to `never` type

### PIN Feature Incomplete
- `PinLockScreen` is registered in the navigator with modes `'create' | 'verify' | 'remove'`
- Navigation comments indicate "In a real app we'd verify PIN before showing HomeTabs. For now" — showing HomeTabs directly
- No secure storage integration for PIN hashing/verification is implemented in the store or services

---

## Development

### Scripts
| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Start Expo dev server for web |
| `npm test` | Run Jest test suite |

### Config Files
- `app.json` — Expo configuration (app name, plugins, Android package)
- `eas.json` — EAS Build profiles (Android APK preview)
- `metro.config.js` — Metro bundler with WASM asset support for expo-sqlite
- `tsconfig.json` — Strict TypeScript, extends expo/tsconfig.base
- `jest.config.js` — Jest with jest-expo preset
- `jest.setup.js` — Global mock setup (SQLite, navigation, AsyncStorage)

---

## Next Steps / Improvement Areas

1. **Fix 75 TypeScript errors** — Mostly mechanical: remove duplicate `color` spreads, add missing fields to test fixtures
2. **Complete PIN feature** — Implement PIN hashing/verification with expo-secure-store, connect to navigation flow
3. **Increase test coverage** — Focus on 0% coverage screens and navigation
4. **iOS configuration** — Add `bundleIdentifier` to app.json, test on iOS
5. **README.md** — Create project documentation
6. **TypeScript config improvements** — Enable `strict: true` checks beyond the base config (noUnusedLocals, etc.)
