import API from './api';
import { Asset } from '../types';

export const fetchAssets = async (): Promise<Asset[]> =>
  (await API.get('/assets/')).data;

export const createAsset = async (data: Omit<Asset, 'id' | 'created_at'>): Promise<Asset> =>
  (await API.post('/assets/', data)).data;

export const updateAsset = async (id: number, data: Partial<Asset>): Promise<Asset> =>
  (await API.put(`/assets/${id}/`, data)).data;

export const deleteAsset = async (id: number): Promise<void> =>
  (await API.delete(`/assets/${id}/`)).data;

export const getAssetTypes = async (): Promise<Array<[string, string]>> =>
  (await API.get('/assets/types/')).data;

export const getAssetSummary = async () =>
  (await API.get('/assets/summary/')).data;