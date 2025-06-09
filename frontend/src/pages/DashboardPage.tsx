import { useEffect, useState } from 'react';
import { fetchInvestments } from '../api/investments';
import { fetchIncomes, getIncomeSummary } from '../api/income';
import { fetchExpenses, getExpenseSummary, getCurrentMonthSummary } from '../api/expenses';
import { fetchAssets, getAssetSummary } from '../api/assets';
import { getCurrentRates } from '../api/exchangeRates';
import { Investment, Income, Expense, Asset } from '../types';
import Layout from '../components/Layout';

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>({
    investments: [],
    incomes: [],
    expenses: [],
    assets: [],
    exchangeRates: {},
    summaries: {
      investments: null,
      incomes: null,
      expenses: null,
      assets: null,
      budget: null,
    }
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        investmentsData,
        incomesData,
        expensesData,
        assetsData,
        exchangeRatesData,
        incomeSummaryData,
        expenseSummaryData,
        assetSummaryData,
        budgetSummaryData,
      ] = await Promise.all([
        fetchInvestments(),
        fetchIncomes(),
        fetchExpenses(),
        fetchAssets(),
        getCurrentRates(),
        getIncomeSummary(),
        getExpenseSummary(),
        getAssetSummary(),
        getCurrentMonthSummary(),
      ]);

      setDashboardData({
        investments: investmentsData,
        incomes: incomesData,
        expenses: expensesData,
        assets: assetsData,
        exchangeRates: exchangeRatesData,
        summaries: {
          investments: null, // We'll calculate this
          incomes: incomeSummaryData,
          expenses: expenseSummaryData,
          assets: assetSummaryData,
          budget: budgetSummaryData,
        }
      });
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate investment summary
  const calculateInvestmentSummary = () => {
    const investments = dashboardData.investments;
    if (!investments.length) return null;

    const totalInvested = investments.reduce((sum: number, inv: Investment) => 
      sum + (inv.qty * inv.purchase_value), 0);
    const totalCurrent = investments.reduce((sum: number, inv: Investment) => 
      sum + (inv.qty * inv.current_value), 0);
    const totalGainLoss = totalCurrent - totalInvested;
    const gainLossPercentage = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

    return {
      totalInvested,
      totalCurrent,
      totalGainLoss,
      gainLossPercentage,
      count: investments.length,
    };
  };

  // Calculate net worth
  const calculateNetWorth = () => {
    const investmentSummary = calculateInvestmentSummary();
    const assetSummary = dashboardData.summaries.assets;
    
    const investmentValue = investmentSummary?.totalCurrent || 0;
    const assetValue = assetSummary?.total_value_inr || 0;
    
    return investmentValue + assetValue;
  };

  // Calculate monthly cash flow
  const calculateMonthlyCashFlow = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = dashboardData.incomes
      .filter((income: Income) => {
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, income: Income) => sum + income.amount_in_inr, 0);

    const monthlyExpenses = dashboardData.expenses
      .filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, expense: Expense) => sum + expense.amount_in_inr, 0);

    return {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      netCashFlow: monthlyIncome - monthlyExpenses,
    };
  };

  // Get recent transactions
  const getRecentTransactions = () => {
    const allTransactions = [
      ...dashboardData.incomes.map((income: Income) => ({
        ...income,
        type: 'income',
        amount: income.amount_in_inr,
        title: income.source,
        category: income.category_display,
      })),
      ...dashboardData.expenses.map((expense: Expense) => ({
        ...expense,
        type: 'expense',
        amount: expense.amount_in_inr,
        title: expense.title,
        category: expense.category_display,
      })),
    ];

    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  // Get top investment performers
  const getTopPerformers = () => {
    return dashboardData.investments
      .map((inv: Investment) => {
        const invested = inv.qty * inv.purchase_value;
        const current = inv.qty * inv.current_value;
        const gainLoss = current - invested;
        const percentage = invested > 0 ? ((gainLoss / invested) * 100) : 0;
        return { ...inv, gainLoss, percentage, invested, current };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  };

  // Get budget alerts
  const getBudgetAlerts = () => {
    const budgetSummary = dashboardData.summaries.budget;
    if (!budgetSummary?.budgets) return [];

    return budgetSummary.budgets
      .filter((budget: any) => budget.utilization_percentage > 80)
      .sort((a: any, b: any) => b.utilization_percentage - a.utilization_percentage);
  };

  const investmentSummary = calculateInvestmentSummary();
  const netWorth = calculateNetWorth();
  const cashFlow = calculateMonthlyCashFlow();
  const recentTransactions = getRecentTransactions();
  const topPerformers = getTopPerformers();
  const budgetAlerts = getBudgetAlerts();

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Financial Dashboard
        </h1>
        <button
          className="btn btn-outline-primary"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Net Worth</h6>
                  <h4 className="mb-0">₹{netWorth.toFixed(2)}</h4>
                  <small>Total Assets + Investments</small>
                </div>
                <i className="bi bi-wallet2" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`card text-white h-100 ${cashFlow.netCashFlow >= 0 ? 'bg-success' : 'bg-danger'}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Monthly Cash Flow</h6>
                  <h4 className="mb-0">
                    {cashFlow.netCashFlow >= 0 ? '+' : ''}₹{cashFlow.netCashFlow.toFixed(2)}
                  </h4>
                  <small>Income - Expenses</small>
                </div>
                <i className={`bi ${cashFlow.netCashFlow >= 0 ? 'bi-trending-up' : 'bi-trending-down'}`} 
                   style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Investments</h6>
                  <h4 className="mb-0">₹{investmentSummary?.totalCurrent.toFixed(2) || '0.00'}</h4>
                  <small className={investmentSummary?.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}>
                    {investmentSummary?.totalGainLoss >= 0 ? '+' : ''}
                    {investmentSummary?.gainLossPercentage.toFixed(2) || '0.00'}%
                  </small>
                </div>
                <i className="bi bi-graph-up" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Assets</h6>
                  <h4 className="mb-0">₹{dashboardData.summaries.assets?.total_value_inr.toFixed(2) || '0.00'}</h4>
                  <small>{dashboardData.summaries.assets?.total_count || 0} items</small>
                </div>
                <i className="bi bi-house" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Overview Row */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Monthly Income</h6>
                  <h4 className="mb-0">₹{cashFlow.income.toFixed(2)}</h4>
                  <small>{dashboardData.summaries.incomes?.total_count || 0} entries</small>
                </div>
                <i className="bi bi-cash-coin" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Monthly Expenses</h6>
                  <h4 className="mb-0">₹{cashFlow.expenses.toFixed(2)}</h4>
                  <small>{dashboardData.summaries.expenses?.total_count || 0} entries</small>
                </div>
                <i className="bi bi-credit-card" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-secondary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Budget Utilization</h6>
                  <h4 className="mb-0">
                    {dashboardData.summaries.budget?.overall_utilization_percentage.toFixed(1) || '0.0'}%
                  </h4>
                  <small>
                    ₹{dashboardData.summaries.budget?.total_remaining_inr.toFixed(2) || '0.00'} remaining
                  </small>
                </div>
                <i className="bi bi-speedometer2" style={{ fontSize: '2.5rem', opacity: 0.7 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Transactions */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Transactions
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentTransactions.slice(0, 8).map((transaction, index) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className={`me-3 p-2 rounded-circle ${
                          transaction.type === 'income' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'
                        }`}>
                          <i className={`bi ${
                            transaction.type === 'income' ? 'bi-arrow-down-circle text-success' : 'bi-arrow-up-circle text-danger'
                          }`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold">{transaction.title}</div>
                          <small className="text-muted">
                            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className={`fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="list-group-item text-center text-muted">
                    <i className="bi bi-clock-history me-2"></i>
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Investment Performers */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-trophy me-2"></i>
                Top Investment Performers
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {topPerformers.map((investment, index) => (
                  <div key={investment.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className={`me-3 p-2 rounded-circle ${
                          investment.percentage >= 0 ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'
                        }`}>
                          <i className={`bi ${
                            investment.percentage >= 0 ? 'bi-trending-up text-success' : 'bi-trending-down text-danger'
                          }`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold">{investment.name}</div>
                          <small className="text-muted">
                            {investment.type} • {investment.qty} units
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className={`fw-bold ${investment.percentage >= 0 ? 'text-success' : 'text-danger'}`}>
                          {investment.percentage >= 0 ? '+' : ''}{investment.percentage.toFixed(2)}%
                        </div>
                        <small className="text-muted">₹{investment.current.toFixed(2)}</small>
                      </div>
                    </div>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <div className="list-group-item text-center text-muted">
                    <i className="bi bi-graph-up me-2"></i>
                    No investments yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  Budget Alerts
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {budgetAlerts.map((budget: any) => (
                    <div key={budget.id} className="col-md-6 col-lg-4 mb-3">
                      <div className={`card border-${
                        budget.utilization_percentage > 100 ? 'danger' : 'warning'
                      }`}>
                        <div className="card-body">
                          <h6 className="card-title">{budget.category}</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Utilization:</span>
                            <span className={`fw-bold ${
                              budget.utilization_percentage > 100 ? 'text-danger' : 'text-warning'
                            }`}>
                              {budget.utilization_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="progress mb-2" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar ${
                                budget.utilization_percentage > 100 ? 'bg-danger' : 'bg-warning'
                              }`}
                              style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            ₹{budget.remaining_amount.toFixed(2)} remaining of ₹{budget.allocated_amount_inr.toFixed(2)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Breakdown */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Investment Portfolio Breakdown
              </h5>
            </div>
            <div className="card-body">
              {dashboardData.investments.length > 0 ? (
                <div>
                  {Object.entries(
                    dashboardData.investments.reduce((acc: any, inv: Investment) => {
                      if (!acc[inv.type]) {
                        acc[inv.type] = { count: 0, value: 0 };
                      }
                      acc[inv.type].count += 1;
                      acc[inv.type].value += inv.qty * inv.current_value;
                      return acc;
                    }, {})
                  ).map(([type, data]: [string, any]) => (
                    <div key={type} className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="fw-semibold">{type}</span>
                        <br />
                        <small className="text-muted">{data.count} investments</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">₹{data.value.toFixed(2)}</div>
                        <small className="text-muted">
                          {((data.value / (investmentSummary?.totalCurrent || 1)) * 100).toFixed(1)}%
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-graph-up" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-2">No investments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-house me-2"></i>
                Asset Portfolio Breakdown
              </h5>
            </div>
            <div className="card-body">
              {dashboardData.summaries.assets?.type_summary ? (
                <div>
                  {Object.entries(dashboardData.summaries.assets.type_summary).map(([type, data]: [string, any]) => (
                    <div key={type} className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="fw-semibold">{type}</span>
                        <br />
                        <small className="text-muted">{data.count} assets</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">₹{data.total_value_inr.toFixed(2)}</div>
                        <small className="text-muted">
                          {((data.total_value_inr / dashboardData.summaries.assets.total_value_inr) * 100).toFixed(1)}%
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-house" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-2">No assets yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;