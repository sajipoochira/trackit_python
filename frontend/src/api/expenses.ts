import API from './api';
import { Expense } from '../types';

export interface Budget {
  id: number;
  category: string;
  allocated_amount: number;
  currency: string;
  currency_display: string;
  period: string;
  period_display: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes: string;
  allocated_amount_in_inr: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  created_at: string;
  updated_at: string;
}

export const fetchExpenses = async (): Promise<Expense[]> =>
  (await API.get('/expenses/')).data;

export const createExpense = async (data: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> =>
  (await API.post('/expenses/', data)).data;

export const updateExpense = async (id: number, data: Partial<Expense>): Promise<Expense> =>
  (await API.put(`/expenses/${id}/`, data)).data;

export const deleteExpense = async (id: number): Promise<void> =>
  (await API.delete(`/expenses/${id}/`)).data;

export const getExpenseCategories = async (): Promise<Array<[string, string]>> =>
  (await API.get('/expenses/categories/')).data;

export const getExpenseSummary = async () =>
  (await API.get('/expenses/summary/')).data;

export const getBudgetAnalysis = async () =>
  (await API.get('/expenses/budget_analysis/')).data;

// Budget API functions
export const fetchBudgets = async (): Promise<Budget[]> =>
  (await API.get('/budgets/')).data;

export const createBudget = async (data: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> =>
  (await API.post('/budgets/', data)).data;

export const updateBudget = async (id: number, data: Partial<Budget>): Promise<Budget> =>
  (await API.put(`/budgets/${id}/`, data)).data;

export const deleteBudget = async (id: number): Promise<void> =>
  (await API.delete(`/budgets/${id}/`)).data;

export const getBudgetCategories = async (): Promise<Array<[string, string]>> =>
  (await API.get('/budgets/categories/')).data;

export const getBudgetPeriods = async (): Promise<Array<[string, string]>> =>
  (await API.get('/budgets/periods/')).data;

export const createMonthlyBudget = async (data: {
  category: string;
  allocated_amount: number;
  currency: string;
  notes?: string;
}) => (await API.post('/budgets/create_monthly_budget/', data)).data;

export const getCurrentMonthSummary = async () =>
  (await API.get('/budgets/current_month_summary/')).data;