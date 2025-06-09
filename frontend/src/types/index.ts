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

export interface Budget {
  id: number;
  category: string;
  allocated_amount: number;
  currency: string;
  currency_display: string;
  period: string;
  period_display: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes: string;
  allocated_amount_in_inr: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  created_at: string;
  updated_at: string;
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
  budget_info?: {
    id: number;
    allocated_amount: number;
    currency: string;
    remaining_amount: number;
    utilization_percentage: number;
  };
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
  // Bank account specific fields
  account_number?: string;
  bank_name?: string;
  account_type?: string;
}

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

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}