const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export class ApiService {
  constructor() {
    this.baseURL = API_BASE;
    this.token = localStorage.getItem('access_token');
    this.refreshTokenValue = localStorage.getItem('refresh_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async request(endpoint, options = {}, _retried = false) {
    const url = `${this.baseURL}${endpoint}`;
    const config = { headers: this.getHeaders(), ...options };

    const res = await fetch(url, config);
    if (res.status === 401 && !_retried && this.refreshTokenValue) {
      const ok = await this.refreshToken();
      if (ok) return this.request(endpoint, options, true);
    }
    if (!res.ok) {
      let bodyText = await res.text();
      try {
        const json = JSON.parse(bodyText);
        // Build a helpful message and attach field errors if present (DRF style)
        if (json && typeof json === 'object') {
          const err = new Error(json.detail || json.message || 'Request failed');
          err.status = res.status;
          err.errors = json;
          throw err;
        }
      } catch (_) {
        // not JSON
      }
      const err = new Error(bodyText || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get('content-type');
    if (ct && ct.includes('application/json')) return res.json();
    return res;
  }

  async login(username, password) {
    const res = await fetch(`${this.baseURL}/token/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      let text = await res.text();
      try { const j = JSON.parse(text); text = j.detail || text } catch(_) {}
      throw new Error(text || 'Login failed');
    }
    const data = await res.json();
    this.token = data.access;
    if (data.refresh) this.refreshTokenValue = data.refresh;
    localStorage.setItem('access_token', this.token);
    if (this.refreshTokenValue) localStorage.setItem('refresh_token', this.refreshTokenValue);
    return data;
  }

  async refreshToken() {
    try {
      const res = await fetch(`${this.baseURL}/token/refresh/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshTokenValue })
      })
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access) {
        this.token = data.access;
        localStorage.setItem('access_token', data.access);
        return true;
      }
      return false;
    } catch (_) { return false }
  }

  logout() {
    this.token = null;
    this.refreshTokenValue = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Current user
  getCurrentUser() { return this.request('/auth/me/'); }

  // Investments
  getInvestments() { return this.request('/investments/'); }
  createInvestment(payload) { return this.request('/investments/', { method: 'POST', body: JSON.stringify(payload) }); }
  updateInvestment(id, payload) { return this.request(`/investments/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }); }
  deleteInvestment(id) { return this.request(`/investments/${id}/`, { method: 'DELETE' }); }
  // Income
  getIncomes() { return this.request('/incomes/'); }
  createIncome(payload) { return this.request('/incomes/', { method: 'POST', body: JSON.stringify(payload) }); }
  updateIncome(id, payload) { return this.request(`/incomes/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }); }
  deleteIncome(id) { return this.request(`/incomes/${id}/`, { method: 'DELETE' }); }
  // Expenses
  getExpenses() { return this.request('/expenses/'); }
  createExpense(payload) { return this.request('/expenses/', { method: 'POST', body: JSON.stringify(payload) }); }
  updateExpense(id, payload) { return this.request(`/expenses/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }); }
  deleteExpense(id) { return this.request(`/expenses/${id}/`, { method: 'DELETE' }); }
  // Assets
  getAssets() { return this.request('/assets/'); }
  createAsset(payload) { return this.request('/assets/', { method: 'POST', body: JSON.stringify(payload) }); }
  updateAsset(id, payload) { return this.request(`/assets/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }); }
  deleteAsset(id) { return this.request(`/assets/${id}/`, { method: 'DELETE' }); }
  // Liabilities
  getLiabilities() { return this.request('/liabilities/'); }
  createLiability(payload) { return this.request('/liabilities/', { method: 'POST', body: JSON.stringify(payload) }); }
  updateLiability(id, payload) { return this.request(`/liabilities/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }); }
  deleteLiability(id) { return this.request(`/liabilities/${id}/`, { method: 'DELETE' }); }

  // LTP / Stock quotes
  getLtp(symbol) { return this.request(`/ltp/get_price/?symbol=${encodeURIComponent(symbol)}`); }
  getLatestQuote(symbol) { return this.request(`/ltp/latest/?symbol=${encodeURIComponent(symbol)}`); }

  // OPTIONS/metadata
  async options(endpoint) {
    try {
      const res = await fetch(`${this.baseURL}${endpoint}`, { method: 'OPTIONS', headers: this.getHeaders() })
      if (!res.ok) return {}
      return await res.json()
    } catch (_) {
      return {}
    }
  }
}

export const api = new ApiService();
