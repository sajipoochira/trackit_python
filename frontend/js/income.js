// Income functionality

let incomes = [];

async function showIncome() {
    hideAllSections();
    document.getElementById('incomeContent').style.display = 'block';
    updateActiveNav('income');
    await loadIncomes();
}

async function loadIncomes() {
    showLoading();
    
    try {
        incomes = await api.getIncomes() || [];
        renderIncomes();
    } catch (error) {
        console.error('Failed to load incomes:', error);
        showError('Failed to load incomes');
    } finally {
        hideLoading();
    }
}

function renderIncomes() {
    renderIncomeSummary();
    renderIncomeList();
}

function renderIncomeSummary() {
    const summaryContainer = document.getElementById('incomeSummary');
    
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount_in_inr, 0);
    const recurringIncomes = incomes.filter(income => income.is_recurring);
    const categories = [...new Set(incomes.map(income => income.category))];
    
    // Calculate current month income
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyIncome = incomes
        .filter(income => {
            const date = new Date(income.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, income) => sum + income.amount_in_inr, 0);
    
    summaryContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card success">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Income</h6>
                        <h4 class="mb-0">${formatCurrency(totalIncome)}</h4>
                    </div>
                    <i class="bi bi-cash-coin" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Monthly Income</h6>
                        <h4 class="mb-0">${formatCurrency(monthlyIncome)}</h4>
                    </div>
                    <i class="bi bi-calendar-month" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Entries</h6>
                        <h4 class="mb-0">${incomes.length}</h4>
                    </div>
                    <i class="bi bi-list-ul" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Recurring</h6>
                        <h4 class="mb-0">${recurringIncomes.length}</h4>
                    </div>
                    <i class="bi bi-arrow-repeat" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderIncomeList() {
    const listContainer = document.getElementById('incomeList');
    
    if (incomes.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cash-coin text-muted" style="font-size: 4rem;"></i>
                <h3 class="text-muted mt-3">No income records yet</h3>
                <p class="text-muted">Start tracking your income by adding your first entry!</p>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addIncomeModal">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Your First Income
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
                                <th>Source</th>
                                <th>Category</th>
                                <th class="text-end">Amount</th>
                                <th class="text-end">Amount (INR)</th>
                                <th>Date</th>
                                <th>Recurring</th>
                                <th>Notes</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${incomes.map(income => `
                                <tr>
                                    <td>
                                        <div class="fw-semibold">${income.source}</div>
                                        <small class="text-muted">Added ${formatDate(income.created_at)}</small>
                                    </td>
                                    <td>
                                        <span class="badge bg-success">${income.category_display}</span>
                                    </td>
                                    <td class="text-end">
                                        <div>
                                            <span class="fw-semibold">${formatCurrency(income.amount, income.currency)}</span>
                                            <br>
                                            <small class="text-muted">${income.currency_display}</small>
                                        </div>
                                    </td>
                                    <td class="text-end fw-semibold text-success">
                                        ${formatCurrency(income.amount_in_inr)}
                                    </td>
                                    <td>
                                        <div>${formatDate(income.date)}</div>
                                        ${income.next_occurrence ? `<small class="text-muted">Next: ${formatDate(income.next_occurrence)}</small>` : ''}
                                    </td>
                                    <td>
                                        ${income.is_recurring ? 
                                            `<span class="badge bg-info">
                                                <i class="bi bi-arrow-repeat me-1"></i>
                                                ${income.recurring_period_display || 'Recurring'}
                                            </span>` : 
                                            '<span class="badge bg-secondary">One-time</span>'
                                        }
                                    </td>
                                    <td>
                                        <div style="max-width: 200px;">
                                            ${income.notes ? 
                                                `<small class="text-muted">${income.notes}</small>` : 
                                                '<small class="text-muted fst-italic">No notes</small>'
                                            }
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <div class="d-flex gap-1 justify-content-center">
                                            <button class="btn btn-outline-primary btn-sm" onclick="editIncome(${income.id})" title="Edit income">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="deleteIncome(${income.id})" title="Delete income">
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

async function saveIncome() {
    const form = document.getElementById('addIncomeForm');
    const formData = new FormData(form);
    
    const data = {
        source: formData.get('source'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        currency: formData.get('currency'),
        date: formData.get('date'),
        is_recurring: false, // Simplified for now
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createIncome(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addIncomeModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload incomes
        await loadIncomes();
        
        showSuccess('Income added successfully');
    } catch (error) {
        console.error('Failed to save income:', error);
        showError('Failed to save income');
    }
}

async function deleteIncome(id) {
    if (confirm('Are you sure you want to delete this income?')) {
        try {
            await api.deleteIncome(id);
            await loadIncomes();
            showSuccess('Income deleted successfully');
        } catch (error) {
            console.error('Failed to delete income:', error);
            showError('Failed to delete income');
        }
    }
}

function editIncome(id) {
    // TODO: Implement edit functionality
    showError('Edit functionality coming soon');
}