import API from './api';

export interface Liability {
  id: number;
  name: string;
  type: string;
  type_display: string;
  principal_amount: number;
  current_balance: number;
  currency: string;
  currency_display: string;
  interest_rate?: number;
  monthly_payment?: number;
  start_date: string;
  due_date?: string;
  next_payment_date?: string;
  status: string;
  status_display: string;
  lender_name?: string;
  notes?: string;
  principal_amount_in_inr: number;
  current_balance_in_inr: number;
  monthly_payment_in_inr: number;
  paid_amount: number;
  paid_amount_in_inr: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export const fetchLiabilities = async (): Promise<Liability[]> =>
  (await API.get('/liabilities/')).data;

export const createLiability = async (data: Omit<Liability, 'id' | 'created_at' | 'updated_at' | 'principal_amount_in_inr' | 'current_balance_in_inr' | 'monthly_payment_in_inr' | 'paid_amount' | 'paid_amount_in_inr' | 'completion_percentage' | 'type_display' | 'currency_display' | 'status_display'>): Promise<Liability> =>
  (await API.post('/liabilities/', data)).data;

export const updateLiability = async (id: number, data: Partial<Liability>): Promise<Liability> =>
  (await API.put(`/liabilities/${id}/`, data)).data;

export const deleteLiability = async (id: number): Promise<void> =>
  (await API.delete(`/liabilities/${id}/`)).data;

export const getLiabilityTypes = async (): Promise<Array<[string, string]>> =>
  (await API.get('/liabilities/types/')).data;

export const getLiabilityStatuses = async (): Promise<Array<[string, string]>> =>
  (await API.get('/liabilities/statuses/')).data;

export const getLiabilitySummary = async () =>
  (await API.get('/liabilities/summary/')).data;

export const getUpcomingPayments = async (): Promise<Liability[]> =>
  (await API.get('/liabilities/upcoming_payments/')).data;