import axios from 'axios';
import { Investment } from '../types';

const API = 'http://localhost:8000/api';
const headers = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const fetchInvestments = async (token: string): Promise<Investment[]> =>
  (await axios.get(`${API}/investments/`, headers(token))).data;

export const createInvestment = async (data: Omit<Investment, 'id' | 'created_at'>, token: string): Promise<Investment> =>
  (await axios.post(`${API}/investments/`, data, headers(token))).data;

export const deleteInvestment = async (id: number, token: string): Promise<void> =>
  (await axios.delete(`${API}/investments/${id}/`, headers(token))).data;