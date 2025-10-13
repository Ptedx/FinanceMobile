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
- **Design System:** Consistent color palette, typography, spacing, and shadows defined in `theme/index.ts`.
- **Color Palette:** Primary (`#6366F1`), Secondary (`#8B5CF6`), Success (`#10B981`), Warning (`#F59E0B`), Danger (`#EF4444`), and various shades of gray for background and text.
- **Categorization:** Expenses and incomes are categorized with distinct colors and icons for visual clarity.
- **Components:** Reusable components like `Card`, `ProgressBar` (animated with dynamic colors), `AlertBanner`, and `AnimatedBarChart` ensure consistency.
- **Navigation:** Uses React Navigation v6 with a `Bottom Tabs Navigator` for main screens and a `Stack Navigator` for modals and deeper views.

**Technical Implementations:**
- **Financial Engine (`useFinanceEngine.ts`):** Custom hook for automatic financial calculations including total spent, projected spending, budget progress, and goal ETA (estimated time to achievement). It now incorporates income into calculations for available balance and goal progress.
- **Data Persistence:** Local SQLite database (`services/database.ts`) with tables for `expenses`, `incomes`, `budgets`, `goals`, and `alerts`. Indices are used to optimize data retrieval by date and category.
- **State Management (`store/financeStore.ts`):** Zustand store manages the global state of expenses, incomes, budgets, goals, and alerts. It includes actions for loading, adding, deleting data, and automatic logic for checking budget alerts and updating goal progress.
- **Forms:** Implemented with `React Hook Form` and `Zod` for robust validation and improved performance.
- **Animations:** `React Native Reanimated` is used for all animations, ensuring smooth UI interactions.
- **Security:** Inputs are validated with Zod. The local SQLite database is not exposed over the network.

**Feature Specifications (MVP):**
- **Dashboard:** Monthly summary, intelligent projection, available balance (income - expenses), animated bar chart for category spending, visual alerts for budget limits.
- **Expense & Income Tracking:** Detailed forms for adding expenses and incomes with categories, values, dates, and recurrence options.
- **Monthly Budgets:** List of budgets by category with animated progress bars, indicators for spent/limit, and remaining value.
- **Financial Goals:** Support for savings and spending limit goals with animated progress, ETA calculation, and automatic updates based on income and expenses.
- **Spending Timeline:** Chronological list of all transactions with filtering options and swipe-to-delete functionality.
- **Alert System:** Dedicated screen to list system-generated alerts (budget warnings, goal achievements) with read/unread status.

**System Design Choices:**
- **SQLite Local First:** Chosen for simplicity and offline capability, with a clear path for future cloud synchronization.
- **Zustand:** Selected over Redux for its simplicity, less boilerplate, native TypeScript support, and performance benefits.
- **Reanimated:** Preferred for its guaranteed 60fps animations and modern API.
- **Expo:** Chosen for rapid setup, OTA updates, and simplified native module management.

## External Dependencies

- **React Native:** Core framework for mobile development.
- **Expo:** Development platform for React Native, managing native modules and build processes.
- **React Navigation v6:** Library for app navigation (Stack and Bottom Tabs).
- **React Native Paper:** UI component library implementing Material Design.
- **Zustand:** Global state management library.
- **React Hook Form:** Library for form management.
- **Zod:** Schema declaration and validation library.
- **Expo SQLite:** For local database persistence.
- **React Native Reanimated v3:** For high-performance animations.
- **React Native Gesture Handler:** For native-driven gesture management.
- **date-fns:** Utility library for date manipulation.
- **React Native Vector Icons:** For consistent iconography across the app.