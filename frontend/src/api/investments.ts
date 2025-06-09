import API from './api';
import { Investment } from '../types';

export const fetchInvestments = async (): Promise<Investment[]> =>
  (await API.get('/investments/')).data;

export const createInvestment = async (data: Omit<Investment, 'id' | 'created_at'>): Promise<Investment> =>
  (await API.post('/investments/', data)).data;

export const updateInvestment = async (id: number, data: Partial<Investment>): Promise<Investment> =>
  (await API.put(`/investments/${id}/`, data)).data;

export const deleteInvestment = async (id: number): Promise<void> =>
  (await API.delete(`/investments/${id}/`)).data;

export const getLTP = async (symbol: string): Promise<{ symbol: string; ltp: number }> => {
  const response = await API.get(`/ltp/get_price/?symbol=${symbol}`);
  return response.data;
};