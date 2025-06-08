import API from './api';

export interface KiteLoginResponse {
  login_url: string;
}

export interface KiteCallbackResponse {
  access_token: string;
  user_id: string;
  user_name: string;
}

export const getKiteLoginUrl = async (): Promise<KiteLoginResponse> => {
  const response = await API.get('/kite/login-url/');
  return response.data;
};

export const handleKiteCallback = async (requestToken: string): Promise<KiteCallbackResponse> => {
  const response = await API.post('/kite/callback/', {
    request_token: requestToken
  });
  return response.data;
};

export const getLTPWithToken = async (symbol: string, accessToken: string): Promise<{ symbol: string; ltp: number }> => {
  const response = await API.get(`/ltp/get_ltp/?symbol=${symbol}&access_token=${accessToken}`);
  return response.data;
};