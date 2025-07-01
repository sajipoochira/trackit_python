// Investments functionality

let investments = [];

async function showInvestments() {
    hideAllSections();
    document.getElementById('investmentsContent').style.display = 'block';
    updateActiveNav('investments');
    await loadInvestments();
}

async function loadInvestments() {
    showLoading();
    
    try {
        investments = await api.getInvestments() || [];
        renderInvestments();
    } catch (error) {
        console.error('Failed to load investments:', error);
        showError('Failed to load investments');
    } finally {
        hideLoading();
    }
}

function renderInvestments() {
    renderInvestmentSummary();
    renderInvestmentsList();
}

function renderInvestmentSummary() {
    const summaryContainer = document.getElementById('investmentSummary');
    
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.qty * inv.purchase_value), 0);
    const totalCurrent = investments.reduce((sum, inv) => sum + (inv.qty * inv.current_value), 0);
    const totalGainLoss = totalCurrent - totalInvested;
    const gainLossPercentage = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;
    
    summaryContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Invested</h6>
                        <h4 class="mb-0">${formatCurrency(totalInvested)}</h4>
                    </div>
                    <i class="bi bi-wallet2" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Current Value</h6>
                        <h4 class="mb-0">${formatCurrency(totalCurrent)}</h4>
                    </div>
                    <i class="bi bi-graph-up" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card ${totalGainLoss >= 0 ? 'success' : 'danger'}">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Gain/Loss</h6>
                        <h4 class="mb-0">${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss)}</h4>
                        <small>${totalGainLoss >= 0 ? '+' : ''}${gainLossPercentage.toFixed(2)}%</small>
                    </div>
                    <i class="bi ${totalGainLoss >= 0 ? 'bi-trending-up' : 'bi-trending-down'}" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Investments</h6>
                        <h4 class="mb-0">${investments.length}</h4>
                    </div>
                    <i class="bi bi-collection" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderInvestmentsList() {
    const listContainer = document.getElementById('investmentsList');
    
    if (investments.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-graph-up text-muted" style="font-size: 4rem;"></i>
                <h3 class="text-muted mt-3">No investments yet</h3>
                <p class="text-muted">Start tracking your investments by adding your first one!</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addInvestmentModal">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Your First Investment
                </button>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = `
        <div class="row">
            ${investments.map(investment => {
                const totalInvested = investment.qty * investment.purchase_value;
                const totalCurrent = investment.qty * investment.current_value;
                const gainLoss = totalCurrent - totalInvested;
                const gainLossPercentage = totalInvested > 0 ? ((gainLoss / totalInvested) * 100) : 0;
                const isProfit = gainLoss >= 0;
                
                return `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card investment-card ${isProfit ? 'profit' : 'loss'}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="card-title mb-1">${investment.name}</h5>
                                        <div class="d-flex gap-2">
                                            <span class="badge bg-primary">${investment.type}</span>
                                            ${investment.symbol ? `<span class="badge bg-info">${investment.symbol}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editInvestment(${investment.id})">Edit</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteInvestment(${investment.id})">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <small class="text-muted">Quantity</small>
                                        <div class="fw-bold">${investment.qty}</div>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">Purchase Value</small>
                                        <div class="fw-bold">${formatCurrency(investment.purchase_value)}</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <small class="text-muted">Current Value</small>
                                        <div class="fw-bold">${formatCurrency(investment.current_value)}</div>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">Total Invested</small>
                                        <div class="fw-bold text-info">${formatCurrency(totalInvested)}</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <small class="text-muted">Total Current</small>
                                        <div class="fw-bold text-primary">${formatCurrency(totalCurrent)}</div>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted">Gain/Loss</small>
                                        <div class="fw-bold ${isProfit ? 'text-success' : 'text-danger'}">
                                            ${isProfit ? '+' : ''}${formatCurrency(gainLoss)}
                                        </div>
                                        <small class="${isProfit ? 'text-success' : 'text-danger'}">
                                            ${isProfit ? '+' : ''}${gainLossPercentage.toFixed(2)}%
                                        </small>
                                    </div>
                                </div>
                                
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar ${isProfit ? 'bg-success' : 'bg-danger'}" 
                                         style="width: ${Math.min(Math.abs(gainLossPercentage), 100)}%"></div>
                                </div>
                            </div>
                            <div class="card-footer text-muted">
                                <small>
                                    <i class="bi bi-calendar me-1"></i>
                                    Added ${formatDate(investment.created_at)}
                                </small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function saveInvestment() {
    const form = document.getElementById('addInvestmentForm');
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        symbol: formData.get('symbol') || null,
        type: formData.get('type'),
        qty: parseInt(formData.get('qty')),
        purchase_value: parseFloat(formData.get('purchase_value')),
        current_value: parseFloat(formData.get('current_value')),
        currency: 'INR'
    };
    
    try {
        await api.createInvestment(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addInvestmentModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload investments
        await loadInvestments();
        
        showSuccess('Investment added successfully');
    } catch (error) {
        console.error('Failed to save investment:', error);
        showError('Failed to save investment');
    }
}

async function deleteInvestment(id) {
    if (confirm('Are you sure you want to delete this investment?')) {
        try {
            await api.deleteInvestment(id);
            await loadInvestments();
            showSuccess('Investment deleted successfully');
        } catch (error) {
            console.error('Failed to delete investment:', error);
            showError('Failed to delete investment');
        }
    }
}

async function refreshStockPrices() {
    showLoading();
    
    let updatedCount = 0;
    const stockInvestments = investments.filter(inv => inv.symbol && inv.type === 'Stock');
    
    for (const investment of stockInvestments) {
        try {
            const priceData = await api.getStockPrice(investment.symbol);
            const newCurrentValue = priceData.ltp;
            
            await api.updateInvestment(investment.id, {
                current_value: newCurrentValue
            });
            updatedCount++;
        } catch (error) {
            console.error(`Failed to update price for ${investment.symbol}:`, error);
        }
    }
    
    hideLoading();
    
    if (updatedCount > 0) {
        await loadInvestments();
        showSuccess(`Successfully updated ${updatedCount} stock prices!`);
    } else {
        showError('No stock prices were updated');
    }
}

// Set today's date as default for investment form
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[name="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
});