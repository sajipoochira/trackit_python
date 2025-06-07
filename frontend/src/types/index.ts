export interface Investment {
  id: number;
  name: string;
  type: string;
  qty: number;
  current_value: number;
  purchase_value: number;
  created_at: string;
}

export interface Income {
  id: number;
  source: string;
  amount: number;
  currency: string;
  date: string;
  is_recurring: boolean;
  recurring_period?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  currency: string;
  date: string;
  notes?: string;
}

export interface Asset {
  id: number;
  name: string;
  type: string;
  value: number;
  currency: string;
  notes?: string;
}