// Liabilities functionality

let liabilities = [];
let moneyLent = [];

async function showLiabilities() {
    hideAllSections();
    document.getElementById('liabilitiesContent').style.display = 'block';
    updateActiveNav('liabilities');
    await loadLiabilities();
}

async function loadLiabilities() {
    showLoading();
    
    try {
        [liabilities, moneyLent] = await Promise.all([
            api.getLiabilities() || [],
            api.getMoneyLent() || []
        ]);
        renderLiabilities();
    } catch (error) {
        console.error('Failed to load liabilities:', error);
        showError('Failed to load liabilities');
    } finally {
        hideLoading();
    }
}

function renderLiabilities() {
    renderLiabilitySummary();
    renderLiabilitiesList();
}

function renderLiabilitySummary() {
    const summaryContainer = document.getElementById('liabilitySummary');
    
    const totalDebt = liabilities.reduce((sum, liability) => sum + liability.current_balance_in_inr, 0);
    const totalMonthlyPayment = liabilities.reduce((sum, liability) => sum + liability.monthly_payment_in_inr, 0);
    const totalMoneyLentAmount = moneyLent.reduce((sum, record) => sum + record.amount_lent_in_inr, 0);
    const totalOutstanding = moneyLent.reduce((sum, record) => sum + record.outstanding_amount_in_inr, 0);
    
    summaryContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card danger">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Debt</h6>
                        <h4 class="mb-0">${formatCurrency(totalDebt)}</h4>
                    </div>
                    <i class="bi bi-credit-card-2-back" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Monthly Payments</h6>
                        <h4 class="mb-0">${formatCurrency(totalMonthlyPayment)}</h4>
                    </div>
                    <i class="bi bi-calendar-month" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Money Lent</h6>
                        <h4 class="mb-0">${formatCurrency(totalMoneyLentAmount)}</h4>
                    </div>
                    <i class="bi bi-cash-stack" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card success">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Outstanding</h6>
                        <h4 class="mb-0">${formatCurrency(totalOutstanding)}</h4>
                    </div>
                    <i class="bi bi-hourglass-split" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderLiabilitiesList() {
    const listContainer = document.getElementById('liabilitiesList');
    
    if (liabilities.length === 0 && moneyLent.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-credit-card-2-back text-muted" style="font-size: 4rem;"></i>
                <h3 class="text-muted mt-3">No liabilities or money lent records yet</h3>
                <p class="text-muted">Start tracking your debts and money lent by adding your first entry!</p>
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#addLiabilityModal">
                        <i class="bi bi-plus-circle me-1"></i>
                        Add Liability
                    </button>
                    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addMoneyLentModal">
                        <i class="bi bi-cash-stack me-1"></i>
                        Add Money Lent
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = `
        ${liabilities.length > 0 ? `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-credit-card-2-back me-2"></i>
                        Liabilities
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Liability</th>
                                    <th>Type</th>
                                    <th class="text-end">Principal Amount</th>
                                    <th class="text-end">Current Balance</th>
                                    <th class="text-end">Monthly Payment</th>
                                    <th class="text-center">Progress</th>
                                    <th>Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${liabilities.map(liability => `
                                    <tr>
                                        <td>
                                            <div>
                                                <div class="fw-semibold">${liability.name}</div>
                                                ${liability.lender_name ? `<small class="text-muted">${liability.lender_name}</small>` : ''}
                                                <br>
                                                <small class="text-muted">Started ${formatDate(liability.start_date)}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-${getLiabilityTypeColor(liability.type)}">
                                                <i class="${getLiabilityTypeIcon(liability.type)} me-1"></i>
                                                ${liability.type_display}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            <div>
                                                <span class="fw-semibold">${formatCurrency(liability.principal_amount, liability.currency)}</span>
                                                <br>
                                                <small class="text-muted">${formatCurrency(liability.principal_amount_in_inr)}</small>
                                            </div>
                                        </td>
                                        <td class="text-end">
                                            <div>
                                                <span class="fw-semibold text-danger">${formatCurrency(liability.current_balance, liability.currency)}</span>
                                                <br>
                                                <small class="text-muted">${formatCurrency(liability.current_balance_in_inr)}</small>
                                            </div>
                                        </td>
                                        <td class="text-end">
                                            ${liability.monthly_payment ? `
                                                <div>
                                                    <span class="fw-semibold">${formatCurrency(liability.monthly_payment, liability.currency)}</span>
                                                    <br>
                                                    <small class="text-muted">${formatCurrency(liability.monthly_payment_in_inr)}</small>
                                                </div>
                                            ` : '<span class="text-muted">-</span>'}
                                        </td>
                                        <td class="text-center">
                                            <div class="d-flex flex-column align-items-center">
                                                <div class="progress mb-1" style="width: 80px; height: 8px;">
                                                    <div class="progress-bar bg-success" style="width: ${liability.completion_percentage}%"></div>
                                                </div>
                                                <small class="fw-bold">${liability.completion_percentage.toFixed(1)}%</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-${getStatusColor(liability.status)}">${liability.status_display}</span>
                                        </td>
                                        <td class="text-center">
                                            <div class="d-flex gap-1 justify-content-center">
                                                <button class="btn btn-outline-primary btn-sm" onclick="editLiability(${liability.id})" title="Edit liability">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-outline-danger btn-sm" onclick="deleteLiability(${liability.id})" title="Delete liability">
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
        ` : ''}
        
        ${moneyLent.length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-cash-stack me-2"></i>
                        Money Given as Loan
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Borrower</th>
                                    <th>Purpose</th>
                                    <th class="text-end">Amount Lent</th>
                                    <th class="text-end">Amount Returned</th>
                                    <th class="text-end">Outstanding</th>
                                    <th class="text-center">Progress</th>
                                    <th>Expected Return</th>
                                    <th>Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${moneyLent.map(record => {
                                    const isOverdue = record.expected_return_date && 
                                        new Date(record.expected_return_date) < new Date() && 
                                        record.status !== 'fully_returned';
                                    
                                    return `
                                        <tr ${isOverdue ? 'class="table-warning"' : ''}>
                                            <td>
                                                <div>
                                                    <div class="fw-semibold">${record.borrower_name}</div>
                                                    ${record.borrower_contact ? `<small class="text-muted">${record.borrower_contact}</small>` : ''}
                                                    <br>
                                                    <small class="text-muted">Lent on ${formatDate(record.date_lent)}</small>
                                                </div>
                                            </td>
                                            <td>
                                                ${record.purpose ? 
                                                    `<span class="badge bg-info">${record.purpose}</span>` : 
                                                    '<span class="text-muted">Not specified</span>'
                                                }
                                            </td>
                                            <td class="text-end">
                                                <div>
                                                    <span class="fw-semibold">${formatCurrency(record.amount_lent, record.currency)}</span>
                                                    <br>
                                                    <small class="text-muted">${formatCurrency(record.amount_lent_in_inr)}</small>
                                                </div>
                                            </td>
                                            <td class="text-end">
                                                <div>
                                                    <span class="fw-semibold text-success">${formatCurrency(record.amount_returned, record.currency)}</span>
                                                    <br>
                                                    <small class="text-muted">${formatCurrency(record.amount_returned_in_inr)}</small>
                                                </div>
                                            </td>
                                            <td class="text-end">
                                                <div>
                                                    <span class="fw-semibold text-danger">${formatCurrency(record.outstanding_amount, record.currency)}</span>
                                                    <br>
                                                    <small class="text-muted">${formatCurrency(record.outstanding_amount_in_inr)}</small>
                                                </div>
                                            </td>
                                            <td class="text-center">
                                                <div class="d-flex flex-column align-items-center">
                                                    <div class="progress mb-1" style="width: 80px; height: 8px;">
                                                        <div class="progress-bar bg-success" style="width: ${record.return_percentage}%"></div>
                                                    </div>
                                                    <small class="fw-bold">${record.return_percentage.toFixed(1)}%</small>
                                                </div>
                                            </td>
                                            <td>
                                                ${record.expected_return_date ? `
                                                    <div>
                                                        <div>${formatDate(record.expected_return_date)}</div>
                                                        ${isOverdue ? '<small class="text-warning fw-bold">OVERDUE</small>' : ''}
                                                    </div>
                                                ` : '<span class="text-muted">Not set</span>'}
                                            </td>
                                            <td>
                                                <span class="badge bg-${getStatusColor(record.status)}">${record.status_display}</span>
                                            </td>
                                            <td class="text-center">
                                                <div class="d-flex gap-1 justify-content-center">
                                                    ${record.status !== 'fully_returned' ? `
                                                        <button class="btn btn-success btn-sm" onclick="recordPayment(${record.id})" title="Record payment">
                                                            <i class="bi bi-cash"></i>
                                                        </button>
                                                    ` : ''}
                                                    <button class="btn btn-outline-danger btn-sm" onclick="deleteMoneyLent(${record.id})" title="Delete record">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

function getLiabilityTypeIcon(type) {
    const icons = {
        'personal_loan': 'bi-person-circle',
        'home_loan': 'bi-house',
        'car_loan': 'bi-car-front',
        'education_loan': 'bi-mortarboard',
        'credit_card': 'bi-credit-card',
        'business_loan': 'bi-building',
        'money_borrowed': 'bi-cash-stack',
        'mortgage': 'bi-house-door',
        'other': 'bi-question-circle'
    };
    return icons[type] || 'bi-question-circle';
}

function getLiabilityTypeColor(type) {
    const colors = {
        'personal_loan': 'primary',
        'home_loan': 'success',
        'car_loan': 'info',
        'education_loan': 'warning',
        'credit_card': 'danger',
        'business_loan': 'dark',
        'money_borrowed': 'secondary',
        'mortgage': 'success',
        'other': 'secondary'
    };
    return colors[type] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'active': 'warning',
        'paid_off': 'success',
        'defaulted': 'danger',
        'partially_returned': 'info',
        'fully_returned': 'success'
    };
    return colors[status] || 'secondary';
}

async function saveLiability() {
    const form = document.getElementById('addLiabilityForm');
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        type: formData.get('type'),
        principal_amount: parseFloat(formData.get('principal_amount')),
        current_balance: parseFloat(formData.get('current_balance')),
        currency: formData.get('currency'),
        monthly_payment: formData.get('monthly_payment') ? parseFloat(formData.get('monthly_payment')) : null,
        start_date: formData.get('start_date'),
        status: 'active',
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createLiability(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLiabilityModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload liabilities
        await loadLiabilities();
        
        showSuccess('Liability added successfully');
    } catch (error) {
        console.error('Failed to save liability:', error);
        showError('Failed to save liability');
    }
}

async function saveMoneyLent() {
    const form = document.getElementById('addMoneyLentForm');
    const formData = new FormData(form);
    
    const data = {
        borrower_name: formData.get('borrower_name'),
        amount_lent: parseFloat(formData.get('amount_lent')),
        amount_returned: 0,
        currency: formData.get('currency'),
        date_lent: formData.get('date_lent'),
        expected_return_date: formData.get('expected_return_date') || null,
        status: 'active',
        borrower_contact: formData.get('borrower_contact') || null,
        purpose: formData.get('purpose') || null,
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createMoneyLent(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMoneyLentModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload liabilities
        await loadLiabilities();
        
        showSuccess('Money lent record added successfully');
    } catch (error) {
        console.error('Failed to save money lent record:', error);
        showError('Failed to save money lent record');
    }
}

async function deleteLiability(id) {
    if (confirm('Are you sure you want to delete this liability?')) {
        try {
            await api.deleteLiability(id);
            await loadLiabilities();
            showSuccess('Liability deleted successfully');
        } catch (error) {
            console.error('Failed to delete liability:', error);
            showError('Failed to delete liability');
        }
    }
}

async function deleteMoneyLent(id) {
    if (confirm('Are you sure you want to delete this money lent record?')) {
        try {
            await api.deleteMoneyLent(id);
            await loadLiabilities();
            showSuccess('Money lent record deleted successfully');
        } catch (error) {
            console.error('Failed to delete money lent record:', error);
            showError('Failed to delete money lent record');
        }
    }
}

function editLiability(id) {
    // TODO: Implement edit functionality
    showError('Edit functionality coming soon');
}

function recordPayment(id) {
    const amount = prompt('Enter payment amount received:');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        recordMoneyLentPayment(id, parseFloat(amount));
    }
}

async function recordMoneyLentPayment(id, amount) {
    try {
        await api.recordPayment(id, amount);
        await loadLiabilities();
        showSuccess('Payment recorded successfully');
    } catch (error) {
        console.error('Failed to record payment:', error);
        showError('Failed to record payment');
    }
}