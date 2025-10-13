# App de Gestão Financeira Inteligente 💰

## Overview

A mobile React Native/Expo application designed for smart financial management. It enables users to log expenses, set category-based budgets, create financial goals, and visualize spending projections and insights. The project aims to provide a comprehensive tool for personal finance, with a strong focus on intuitive UI/UX and actionable financial intelligence. The current version includes a complete and functional MVP, along with a robust income management system.

**Business Vision:** To empower users with intelligent tools for financial control, fostering better spending habits and goal achievement.
**Market Potential:** Addresses the growing demand for personal finance applications, differentiating through advanced features like intelligent projections and a user-friendly interface.
**Project Ambitions:** Evolve into a leading personal finance app with AI-driven insights, advanced automation, and seamless cloud synchronization.

## User Preferences

- **Communication Style:** I prefer detailed explanations.
- **Coding Style:** Always use TypeScript. Always validate forms with Zod. Always use the theme from the design system. Always animate with Reanimated (not Animated API). Always save to SQLite via the store (not directly). Never create components without types. Never use hardcoded colors (use `theme.colors`).
- **Workflow Preferences:** I want an iterative development process. For new features, create a screen and add it to the navigator. For data modification, edit `DatabaseService` and `Store`. For new calculations, add them to `useFinanceEngine`. For UI components, create them in `src/components/`.
- **Interaction Preferences:** Provide comprehensive context by reading this document, examining the `src/` folder structure, understanding the `Store → Database → UI` flow, and reviewing types in `src/types/index.ts`.
- **General Working Preferences:** Please test on Expo Go and update this document after implementing features.

## System Architecture

The application is built with React Native and Expo (TypeScript) for mobile, utilizing a local-first SQLite database. Global state management is handled by Zustand, and animations are powered by React Native Reanimated v3 for fluid 60fps performance. Forms are managed with React Hook Form and validated using Zod.

**UI/UX Decisions:**
- **Design System:** Consistent color palette, typography, spacing, and shadows defined in `theme/index.ts`. Supports both light and dark themes with adaptive colors.
- **Color Palette:** 
  - Light Theme: Primary (`#6366F1`), Secondary (`#8B5CF6`), Success (`#10B981`), Warning (`#F59E0B`), Danger (`#EF4444`), light backgrounds and dark text.
  - Dark Theme: Primary (`#818CF8`), Secondary (`#A78BFA`), Success (`#34D399`), Warning (`#FBBF24`), Danger (`#F87171`), dark backgrounds and light text.
- **Categorization:** Expenses and incomes are categorized with distinct colors and icons for visual clarity.
- **Components:** Reusable components like `Card`, `ProgressBar` (animated with dynamic colors), `AlertBanner`, and `AnimatedBarChart` ensure consistency. All components adapt to theme changes.
- **Navigation:** Uses React Navigation v6 with a `Bottom Tabs Navigator` for main screens and a `Stack Navigator` for modals and deeper views. Icons powered by `react-native-vector-icons` for consistent display.

**Technical Implementations:**
- **Financial Engine (`useFinanceEngine.ts`):** Custom hook for automatic financial calculations including total spent, projected spending, budget progress, and goal ETA (estimated time to achievement). It now incorporates income into calculations for available balance and goal progress.
- **Data Persistence:** Platform-aware database abstraction with SQLite for native platforms (`SQLiteDatabaseService`) and IndexedDB/LocalForage for web (`WebDatabaseService`). Tables/stores include `expenses`, `incomes` (with goal allocations), `budgets`, `goals`, and `alerts`. Indices optimize data retrieval by date and category.
- **State Management (`store/financeStore.ts`):** Zustand store manages the global state of expenses, incomes, budgets, goals, and alerts. It includes actions for loading, adding, deleting data, and automatic logic for checking budget alerts and updating goal progress. Additional stores: `useThemeStore` for dark/light mode management.
- **Forms:** Implemented with `React Hook Form` and `Zod` for robust validation and improved performance.
- **Animations:** `React Native Reanimated` is used for all animations, ensuring smooth UI interactions.
- **Theme Management:** `useThemeStore` hook manages app-wide theme state with instant switching between light and dark modes.
- **Security:** Inputs are validated with Zod. The local database is not exposed over the network.

**Feature Specifications (MVP):**
- **Dashboard:** Monthly summary, intelligent projection, available balance (income - expenses), animated bar chart for category spending, visual alerts for budget limits.
- **Expense & Income Tracking:** Detailed forms for adding expenses and incomes with categories, values, dates, and recurrence options. Income form includes goal allocation feature to directly assign portions of income to specific savings goals.
- **Monthly Budgets:** List of budgets by category with animated progress bars, indicators for spent/limit, and remaining value.
- **Financial Goals:** Support for savings and spending limit goals with animated progress, ETA calculation, and automatic updates based on income and expenses. Goals can receive direct allocations from income entries.
- **Timeline:** Enhanced transaction timeline showing both expenses and incomes, with color-coded indicators (red for expenses, green for income). Includes edit and delete functionality for both transaction types, plus a period selector (this month, last 3 months, last 6 months, last year, all time) and filter by transaction type (all, expenses only, incomes only).
- **Alert System:** Dedicated screen to list system-generated alerts (budget warnings, goal achievements) with read/unread status.
- **Dark Mode:** Complete dark/light theme support with toggle button in the header. All screens adapt to the selected theme with appropriate color schemes and contrast.

**System Design Choices:**
- **SQLite Local First:** Chosen for simplicity and offline capability, with a clear path for future cloud synchronization.
- **Zustand:** Selected over Redux for its simplicity, less boilerplate, native TypeScript support, and performance benefits.
- **Reanimated:** Preferred for its guaranteed 60fps animations and modern API.
- **Expo:** Chosen for rapid setup, OTA updates, and simplified native module management.

## External Dependencies

- **React Native:** Core framework for mobile development.
- **Expo:** Development platform for React Native, managing native modules and build processes.
- **React Navigation v6:** Library for app navigation (Stack and Bottom Tabs).
- **React Native Paper:** UI component library implementing Material Design with MD3 theme support.
- **Zustand:** Global state management library (used for finance data and theme management).
- **React Hook Form:** Library for form management.
- **Zod:** Schema declaration and validation library.
- **Expo SQLite:** For local database persistence on native platforms.
- **LocalForage:** For web-based IndexedDB persistence.
- **React Native Reanimated v3:** For high-performance animations.
- **React Native Gesture Handler:** For native-driven gesture management.
- **date-fns:** Utility library for date manipulation.
- **React Native Vector Icons:** For consistent iconography across the app (MaterialCommunityIcons).
## Recent Changes

### October 2025 - Major Feature Update
- **Dark Mode Implementation:** Added complete dark/light theme system with `useThemeStore` hook. All screens now support theme switching with a toggle button in the header. Both light and dark color palettes optimized for readability and aesthetics.
- **Icon System Fixed:** Replaced IconButton with direct Icon components from react-native-vector-icons/MaterialCommunityIcons to ensure proper icon display across all screens.
- **Enhanced Timeline:** Complete redesign of TimelineScreen to show both expenses and incomes with:
  - Color-coded transaction indicators (red for expenses, green for income)
  - Edit and delete functionality for both transaction types
  - Period selector with options: this month, last 3 months, last 6 months, last year, all time
  - Filter toggle for viewing all transactions, expenses only, or incomes only
  - Improved UI with transaction type badges and detailed information display
- **Goal Allocation System:** Added ability to allocate income directly to savings goals when adding income:
  - Visual goal allocation interface in AddIncomeScreen
  - Real-time calculation of remaining unallocated amount
  - Validation to prevent over-allocation
  - Automatic goal progress updates when income is allocated
  - Support for multiple goal allocations per income entry
- **Database Architecture:** Implemented platform-aware database abstraction supporting both native (SQLite) and web (IndexedDB) platforms with unified interface.
- **Type System Updates:** Extended Income type to support GoalAllocation for tracking income-to-goal assignments.
