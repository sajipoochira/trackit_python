// Expenses functionality

let expenses = [];
let budgets = [];

async function showExpenses() {
    hideAllSections();
    document.getElementById('expensesContent').style.display = 'block';
    updateActiveNav('expenses');
    await loadExpenses();
}

async function loadExpenses() {
    showLoading();
    
    try {
        [expenses, budgets] = await Promise.all([
            api.getExpenses() || [],
            api.getBudgets() || []
        ]);
        renderExpenses();
    } catch (error) {
        console.error('Failed to load expenses:', error);
        showError('Failed to load expenses');
    } finally {
        hideLoading();
    }
}

function renderExpenses() {
    renderExpenseSummary();
    renderExpensesList();
}

function renderExpenseSummary() {
    const summaryContainer = document.getElementById('expenseSummary');
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount_in_inr, 0);
    const categories = [...new Set(expenses.map(expense => expense.category))];
    
    // Calculate current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses
        .filter(expense => {
            const date = new Date(expense.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount_in_inr, 0);
    
    // Calculate budget utilization
    const totalBudget = budgets.reduce((sum, budget) => sum + (budget.allocated_amount_in_inr || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (monthlyExpenses / totalBudget) * 100 : 0;
    
    summaryContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card danger">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Expenses</h6>
                        <h4 class="mb-0">${formatCurrency(totalExpenses)}</h4>
                    </div>
                    <i class="bi bi-credit-card" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Monthly Expenses</h6>
                        <h4 class="mb-0">${formatCurrency(monthlyExpenses)}</h4>
                    </div>
                    <i class="bi bi-calendar-month" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Entries</h6>
                        <h4 class="mb-0">${expenses.length}</h4>
                    </div>
                    <i class="bi bi-list-ul" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card ${budgetUtilization > 80 ? 'danger' : budgetUtilization > 60 ? 'warning' : 'success'}">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Budget Usage</h6>
                        <h4 class="mb-0">${budgetUtilization.toFixed(1)}%</h4>
                    </div>
                    <i class="bi bi-speedometer2" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderExpensesList() {
    const listContainer = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-credit-card text-muted" style="font-size: 4rem;"></i>
                <h3 class="text-muted mt-3">No expenses yet</h3>
                <p class="text-muted">Start tracking your expenses by adding your first entry!</p>
                <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Your First Expense
                </button>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = `
        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Expense</th>
                                <th>Category</th>
                                <th class="text-end">Amount</th>
                                <th class="text-end">Amount (INR)</th>
                                <th>Date</th>
                                <th>Budget Status</th>
                                <th>Notes</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(expense => `
                                <tr>
                                    <td>
                                        <div class="fw-semibold">${expense.title}</div>
                                        <small class="text-muted">Added ${formatDate(expense.created_at)}</small>
                                    </td>
                                    <td>
                                        <span class="badge bg-danger">${expense.category_display}</span>
                                    </td>
                                    <td class="text-end">
                                        <div>
                                            <span class="fw-semibold">${formatCurrency(expense.amount, expense.currency)}</span>
                                            <br>
                                            <small class="text-muted">${expense.currency_display}</small>
                                        </div>
                                    </td>
                                    <td class="text-end fw-semibold text-danger">
                                        ${formatCurrency(expense.amount_in_inr)}
                                    </td>
                                    <td>${formatDate(expense.date)}</td>
                                    <td>
                                        ${expense.budget_info ? 
                                            `<div>
                                                <small class="badge bg-${getBudgetStatusColor(expense.budget_info.utilization_percentage)}">
                                                    ${expense.budget_info.utilization_percentage.toFixed(1)}% used
                                                </small>
                                                <br>
                                                <small class="text-muted">
                                                    ${formatCurrency(expense.budget_info.remaining_amount)} left
                                                </small>
                                            </div>` : 
                                            '<span class="badge bg-secondary">No Budget</span>'
                                        }
                                    </td>
                                    <td>
                                        <div style="max-width: 200px;">
                                            ${expense.notes ? 
                                                `<small class="text-muted">${expense.notes}</small>` : 
                                                '<small class="text-muted fst-italic">No notes</small>'
                                            }
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <div class="d-flex gap-1 justify-content-center">
                                            <button class="btn btn-outline-primary btn-sm" onclick="editExpense(${expense.id})" title="Edit expense">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="deleteExpense(${expense.id})" title="Delete expense">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function getBudgetStatusColor(utilization) {
    if (utilization <= 50) return 'success';
    if (utilization <= 80) return 'warning';
    return 'danger';
}

async function saveExpense() {
    const form = document.getElementById('addExpenseForm');
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        currency: formData.get('currency'),
        date: formData.get('date'),
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createExpense(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload expenses
        await loadExpenses();
        
        showSuccess('Expense added successfully');
    } catch (error) {
        console.error('Failed to save expense:', error);
        showError('Failed to save expense');
    }
}

async function saveBudget() {
    const form = document.getElementById('addBudgetForm');
    const formData = new FormData(form);
    
    const data = {
        category: formData.get('category'),
        allocated_amount: parseFloat(formData.get('allocated_amount')),
        currency: formData.get('currency'),
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createBudget(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBudgetModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload expenses and budgets
        await loadExpenses();
        
        showSuccess('Budget added successfully');
    } catch (error) {
        console.error('Failed to save budget:', error);
        showError('Failed to save budget');
    }
}

async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await api.deleteExpense(id);
            await loadExpenses();
            showSuccess('Expense deleted successfully');
        } catch (error) {
            console.error('Failed to delete expense:', error);
            showError('Failed to delete expense');
        }
    }
}

function editExpense(id) {
    // TODO: Implement edit functionality
    showError('Edit functionality coming soon');
}