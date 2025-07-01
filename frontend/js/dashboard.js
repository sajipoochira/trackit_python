// Dashboard functionality

let dashboardData = {
    investments: [],
    incomes: [],
    expenses: [],
    assets: [],
    liabilities: [],
    moneyLent: [],
    budgetSummary: null
};

async function showDashboard() {
    // Hide all content sections
    hideAllSections();
    
    // Show dashboard content
    document.getElementById('dashboardContent').style.display = 'block';
    
    // Update active nav
    updateActiveNav('dashboard');
    
    // Load dashboard data
    await loadDashboardData();
}

function hideAllSections() {
    const sections = [
        'dashboardContent', 'investmentsContent', 'incomeContent', 
        'expensesContent', 'assetsContent', 'liabilitiesContent'
    ];
    
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
}

function updateActiveNav(activeSection) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current section
    const navMap = {
        'dashboard': 0,
        'investments': 1,
        'income': 2,
        'expenses': 3,
        'assets': 4,
        'liabilities': 5
    };
    
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks[navMap[activeSection]]) {
        navLinks[navMap[activeSection]].classList.add('active');
    }
}

async function loadDashboardData() {
    showLoading();
    
    try {
        // Load all data in parallel
        const [
            investments,
            incomes,
            expenses,
            assets,
            liabilities,
            moneyLent,
            budgetSummary
        ] = await Promise.all([
            api.getInvestments(),
            api.getIncomes(),
            api.getExpenses(),
            api.getAssets(),
            api.getLiabilities(),
            api.getMoneyLent(),
            api.getCurrentMonthSummary()
        ]);
        
        dashboardData = {
            investments: investments || [],
            incomes: incomes || [],
            expenses: expenses || [],
            assets: assets || [],
            liabilities: liabilities || [],
            moneyLent: moneyLent || [],
            budgetSummary
        };
        
        renderDashboard();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showError('Failed to load dashboard data');
    } finally {
        hideLoading();
    }
}

function renderDashboard() {
    renderDashboardMetrics();
    renderPortfolioChart();
    renderRecentTransactions();
}

function renderDashboardMetrics() {
    const metricsContainer = document.getElementById('dashboardMetrics');
    
    // Calculate metrics
    const totalInvestments = dashboardData.investments.reduce((sum, inv) => 
        sum + (inv.qty * inv.current_value), 0);
    
    const totalAssets = dashboardData.assets.reduce((sum, asset) => 
        sum + asset.value_in_inr, 0);
    
    const totalDebt = dashboardData.liabilities.reduce((sum, liability) => 
        sum + liability.current_balance_in_inr, 0);
    
    const totalMoneyLent = dashboardData.moneyLent.reduce((sum, record) => 
        sum + record.outstanding_amount_in_inr, 0);
    
    const netWorth = totalInvestments + totalAssets - totalDebt + totalMoneyLent;
    
    // Calculate monthly cash flow
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = dashboardData.incomes
        .filter(income => {
            const date = new Date(income.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, income) => sum + income.amount_in_inr, 0);
    
    const monthlyExpenses = dashboardData.expenses
        .filter(expense => {
            const date = new Date(expense.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount_in_inr, 0);
    
    const netCashFlow = monthlyIncome - monthlyExpenses;
    
    metricsContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Net Worth</h6>
                        <h4 class="mb-0">${formatCurrency(netWorth)}</h4>
                        <small>Total Assets - Liabilities</small>
                    </div>
                    <i class="bi bi-wallet2" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card ${netCashFlow >= 0 ? 'success' : 'danger'}">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Monthly Cash Flow</h6>
                        <h4 class="mb-0">${netCashFlow >= 0 ? '+' : ''}${formatCurrency(netCashFlow)}</h4>
                        <small>Income - Expenses</small>
                    </div>
                    <i class="bi ${netCashFlow >= 0 ? 'bi-trending-up' : 'bi-trending-down'}" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Investments</h6>
                        <h4 class="mb-0">${formatCurrency(totalInvestments)}</h4>
                        <small>${dashboardData.investments.length} investments</small>
                    </div>
                    <i class="bi bi-graph-up" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Assets</h6>
                        <h4 class="mb-0">${formatCurrency(totalAssets)}</h4>
                        <small>${dashboardData.assets.length} assets</small>
                    </div>
                    <i class="bi bi-house" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;
    
    // Group investments by type
    const investmentsByType = {};
    dashboardData.investments.forEach(investment => {
        const type = investment.type;
        if (!investmentsByType[type]) {
            investmentsByType[type] = 0;
        }
        investmentsByType[type] += investment.qty * investment.current_value;
    });
    
    const labels = Object.keys(investmentsByType);
    const data = Object.values(investmentsByType);
    const colors = [
        '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    
    // Destroy existing chart if it exists
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
    }
    
    window.portfolioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    
    // Combine incomes and expenses
    const transactions = [
        ...dashboardData.incomes.map(income => ({
            ...income,
            type: 'income',
            title: income.source,
            category: income.category_display,
            amount: income.amount_in_inr
        })),
        ...dashboardData.expenses.map(expense => ({
            ...expense,
            type: 'expense',
            title: expense.title,
            category: expense.category_display,
            amount: expense.amount_in_inr
        }))
    ];
    
    // Sort by date (most recent first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only the first 8 transactions
    const recentTransactions = transactions.slice(0, 8);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-clock-history text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-2">No transactions yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => {
        const isIncome = transaction.type === 'income';
        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                    <div class="me-3 p-2 rounded-circle ${isIncome ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}">
                        <i class="bi ${isIncome ? 'bi-arrow-down-circle text-success' : 'bi-arrow-up-circle text-danger'}"></i>
                    </div>
                    <div>
                        <div class="fw-semibold">${transaction.title}</div>
                        <small class="text-muted">${transaction.category} • ${formatDate(transaction.date)}</small>
                    </div>
                </div>
                <div class="fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

async function refreshDashboard() {
    await loadDashboardData();
    showSuccess('Dashboard refreshed successfully');
}