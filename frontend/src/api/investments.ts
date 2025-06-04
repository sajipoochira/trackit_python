import axios from 'axios';
const API = 'http://localhost:8000/api';
const headers = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const fetchInvestments = async (token: string) =>
  (await axios.get(`${API}/investments/`, headers(token))).data;

export const createInvestment = async (data: any, token: string) =>
  (await axios.post(`${API}/investments/`, data, headers(token))).data;

export const deleteInvestment = async (id: number, token: string) =>
  (await axios.delete(`${API}/investments/${id}/`, headers(token))).data;
