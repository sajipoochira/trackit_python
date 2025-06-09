export interface Investment {
  id: number;
  name: string;
  symbol?: string;
  type: string;
  qty: number;
  current_value: number;
  purchase_value: number;
  currency: string;
  amount_in_inr: number;
  created_at: string;
  last_updated?: string;
}

export interface Income {
  id: number;
  source: string;
  category: string;
  category_display: string;
  amount: number;
  currency: string;
  currency_display: string;
  amount_in_inr: number;
  date: string;
  is_recurring: boolean;
  recurring_period?: string;
  recurring_period_display?: string;
  next_occurrence?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  category_display: string;
  currency: string;
  currency_display: string;
  amount_in_inr: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Asset {
  id: number;
  name: string;
  type: string;
  type_display: string;
  value: number;
  currency: string;
  currency_display: string;
  value_in_inr: number;
  purchase_date?: string;
  notes?: string;
  created_at: string;
}

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}