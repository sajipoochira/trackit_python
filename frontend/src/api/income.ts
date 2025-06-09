import API from './api';
import { Income } from '../types';

export const fetchIncomes = async (): Promise<Income[]> =>
  (await API.get('/incomes/')).data;

export const createIncome = async (data: Omit<Income, 'id' | 'created_at'>): Promise<Income> =>
  (await API.post('/incomes/', data)).data;

export const updateIncome = async (id: number, data: Partial<Income>): Promise<Income> =>
  (await API.put(`/incomes/${id}/`, data)).data;

export const deleteIncome = async (id: number): Promise<void> =>
  (await API.delete(`/incomes/${id}/`)).data;

export const getIncomeCategories = async (): Promise<Array<[string, string]>> =>
  (await API.get('/incomes/categories/')).data;

export const getRecurringPeriods = async (): Promise<Array<[string, string]>> =>
  (await API.get('/incomes/recurring_periods/')).data;

export const getIncomeSummary = async () =>
  (await API.get('/incomes/summary/')).data;