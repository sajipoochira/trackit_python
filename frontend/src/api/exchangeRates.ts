import API from './api';

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export const fetchExchangeRates = async (): Promise<ExchangeRate[]> =>
  (await API.get('/exchange-rates/')).data;

export const getCurrentRates = async () =>
  (await API.get('/exchange-rates/current_rates/')).data;

export const updateExchangeRate = async (data: {
  from_currency: string;
  to_currency: string;
  rate: number;
}) => (await API.post('/exchange-rates/update_rate/', data)).data;

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: any): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const rateKey = `${fromCurrency}_to_${toCurrency}`;
  const rate = rates[rateKey];
  
  if (rate) {
    return amount * rate.rate;
  }
  
  // If direct conversion not available, try reverse
  const reverseKey = `${toCurrency}_to_${fromCurrency}`;
  const reverseRate = rates[reverseKey];
  
  if (reverseRate) {
    return amount / reverseRate.rate;
  }
  
  return amount; // Return original if no conversion available
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols = {
    INR: '₹',
    QAR: 'ر.ق'
  };
  
  const symbol = symbols[currency as keyof typeof symbols] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};