import API from './api';

export interface MoneyLent {
  id: number;
  borrower_name: string;
  amount_lent: number;
  amount_returned: number;
  currency: string;
  currency_display: string;
  date_lent: string;
  expected_return_date?: string;
  status: string;
  status_display: string;
  borrower_contact?: string;
  purpose?: string;
  notes?: string;
  amount_lent_in_inr: number;
  amount_returned_in_inr: number;
  outstanding_amount: number;
  outstanding_amount_in_inr: number;
  return_percentage: number;
  created_at: string;
  updated_at: string;
}

export const fetchMoneyLent = async (): Promise<MoneyLent[]> =>
  (await API.get('/money-lent/')).data;

export const createMoneyLent = async (data: Omit<MoneyLent, 'id' | 'created_at' | 'updated_at' | 'amount_lent_in_inr' | 'amount_returned_in_inr' | 'outstanding_amount' | 'outstanding_amount_in_inr' | 'return_percentage' | 'currency_display' | 'status_display'>): Promise<MoneyLent> =>
  (await API.post('/money-lent/', data)).data;

export const updateMoneyLent = async (id: number, data: Partial<MoneyLent>): Promise<MoneyLent> =>
  (await API.put(`/money-lent/${id}/`, data)).data;

export const deleteMoneyLent = async (id: number): Promise<void> =>
  (await API.delete(`/money-lent/${id}/`)).data;

export const getMoneyLentStatuses = async (): Promise<Array<[string, string]>> =>
  (await API.get('/money-lent/statuses/')).data;

export const getMoneyLentSummary = async () =>
  (await API.get('/money-lent/summary/')).data;

export const getOverdueMoneyLent = async (): Promise<MoneyLent[]> =>
  (await API.get('/money-lent/overdue/')).data;

export const recordPayment = async (id: number, paymentAmount: number) =>
  (await API.post(`/money-lent/${id}/record_payment/`, { payment_amount: paymentAmount })).data;