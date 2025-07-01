// API Service for TrackIt Finance Tracker

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('access_token');
    }

    // Get headers with authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired, redirect to login
                this.logout();
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const response = await fetch(`${this.baseURL}/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            this.token = data.access;
            localStorage.setItem('access_token', data.access);
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }
            return data;
        } else {
            throw new Error('Login failed');
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
    }

    // Investments
    async getInvestments() {
        return this.request('/investments/');
    }

    async createInvestment(data) {
        return this.request('/investments/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateInvestment(id, data) {
        return this.request(`/investments/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteInvestment(id) {
        return this.request(`/investments/${id}/`, {
            method: 'DELETE',
        });
    }

    async getStockPrice(symbol) {
        return this.request(`/ltp/get_price/?symbol=${symbol}`);
    }

    // Income
    async getIncomes() {
        return this.request('/incomes/');
    }

    async createIncome(data) {
        return this.request('/incomes/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateIncome(id, data) {
        return this.request(`/incomes/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteIncome(id) {
        return this.request(`/incomes/${id}/`, {
            method: 'DELETE',
        });
    }

    async getIncomeSummary() {
        return this.request('/incomes/summary/');
    }

    // Expenses
    async getExpenses() {
        return this.request('/expenses/');
    }

    async createExpense(data) {
        return this.request('/expenses/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateExpense(id, data) {
        return this.request(`/expenses/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteExpense(id) {
        return this.request(`/expenses/${id}/`, {
            method: 'DELETE',
        });
    }

    async getExpenseSummary() {
        return this.request('/expenses/summary/');
    }

    // Budgets
    async getBudgets() {
        return this.request('/budgets/');
    }

    async createBudget(data) {
        return this.request('/budgets/create_monthly_budget/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateBudget(id, data) {
        return this.request(`/budgets/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteBudget(id) {
        return this.request(`/budgets/${id}/`, {
            method: 'DELETE',
        });
    }

    async getCurrentMonthSummary() {
        return this.request('/budgets/current_month_summary/');
    }

    // Assets
    async getAssets() {
        return this.request('/assets/');
    }

    async createAsset(data) {
        return this.request('/assets/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAsset(id, data) {
        return this.request(`/assets/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAsset(id) {
        return this.request(`/assets/${id}/`, {
            method: 'DELETE',
        });
    }

    async getAssetSummary() {
        return this.request('/assets/summary/');
    }

    // Liabilities
    async getLiabilities() {
        return this.request('/liabilities/');
    }

    async createLiability(data) {
        return this.request('/liabilities/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLiability(id, data) {
        return this.request(`/liabilities/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteLiability(id) {
        return this.request(`/liabilities/${id}/`, {
            method: 'DELETE',
        });
    }

    async getLiabilitySummary() {
        return this.request('/liabilities/summary/');
    }

    // Money Lent
    async getMoneyLent() {
        return this.request('/money-lent/');
    }

    async createMoneyLent(data) {
        return this.request('/money-lent/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateMoneyLent(id, data) {
        return this.request(`/money-lent/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteMoneyLent(id) {
        return this.request(`/money-lent/${id}/`, {
            method: 'DELETE',
        });
    }

    async getMoneyLentSummary() {
        return this.request('/money-lent/summary/');
    }

    async recordPayment(id, amount) {
        return this.request(`/money-lent/${id}/record_payment/`, {
            method: 'POST',
            body: JSON.stringify({ payment_amount: amount }),
        });
    }

    // Exchange Rates
    async getCurrentRates() {
        return this.request('/exchange-rates/current_rates/');
    }

    async updateExchangeRate(data) {
        return this.request('/exchange-rates/update_rate/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

// Create global API instance
const api = new ApiService();

// Utility functions
function formatCurrency(amount, currency = 'INR') {
    const symbols = {
        INR: '₹',
        QAR: 'ر.ق'
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('#mainContent');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('#mainContent');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}