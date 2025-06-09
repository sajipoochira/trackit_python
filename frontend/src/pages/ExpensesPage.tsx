import { useEffect, useState } from 'react';
import { 
  fetchExpenses, 
  createExpense, 
  deleteExpense, 
  updateExpense,
  getExpenseCategories,
  getExpenseSummary,
  getBudgetAnalysis,
  fetchBudgets,
  createMonthlyBudget,
  getCurrentMonthSummary,
  deleteBudget,
  updateBudget,
  Budget
} from '../api/expenses';
import { getCurrentRates, updateExchangeRate, formatCurrency, convertCurrency } from '../api/exchangeRates';
import { Expense } from '../types';
import Layout from '../components/Layout';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [categories, setCategories] = useState<Array<[string, string]>>([]);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'summary' | 'budget'>('list');
  const [editingExpense, setEditingExpense] = useState<number | null>(null);
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    notes: '',
  });
  const [editBudgetData, setEditBudgetData] = useState({
    allocated_amount: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    currency: 'QAR',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    allocated_amount: '',
    currency: 'QAR',
    notes: '',
  });
  const [exchangeRateForm, setExchangeRateForm] = useState({
    from_currency: 'QAR',
    to_currency: 'INR',
    rate: '',
  });

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { value: 'QAR', label: 'Qatari Riyal (ر.ق)', symbol: 'ر.ق' },
  ];

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        expensesData, 
        categoriesData, 
        ratesData, 
        summaryData, 
        budgetsData,
        budgetSummaryData,
        budgetAnalysisData
      ] = await Promise.all([
        fetchExpenses(),
        getExpenseCategories(),
        getCurrentRates(),
        getExpenseSummary(),
        fetchBudgets(),
        getCurrentMonthSummary(),
        getBudgetAnalysis(),
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      setExchangeRates(ratesData);
      setSummary(summaryData);
      setBudgets(budgetsData);
      setBudgetSummary(budgetSummaryData);
      setBudgetAnalysis(budgetAnalysisData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: formData.date,
        notes: formData.notes,
      };

      await createExpense(data);
      setFormData({
        title: '',
        category: '',
        amount: '',
        currency: 'QAR',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create expense');
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        category: budgetFormData.category,
        allocated_amount: parseFloat(budgetFormData.allocated_amount),
        currency: budgetFormData.currency,
        notes: budgetFormData.notes,
      };

      await createMonthlyBudget(data);
      setBudgetFormData({
        category: '',
        allocated_amount: '',
        currency: 'QAR',
        notes: '',
      });
      setShowBudgetForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create budget');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete expense');
      }
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete budget');
      }
    }
  };

  const handleEditExpenseStart = (expense: Expense) => {
    setEditingExpense(expense.id);
    setEditFormData({
      amount: expense.amount.toString(),
      notes: expense.notes || '',
    });
  };

  const handleEditBudgetStart = (budget: Budget) => {
    setEditingBudget(budget.id);
    setEditBudgetData({
      allocated_amount: budget.allocated_amount.toString(),
      notes: budget.notes || '',
    });
  };

  const handleEditExpenseCancel = () => {
    setEditingExpense(null);
    setEditFormData({ amount: '', notes: '' });
  };

  const handleEditBudgetCancel = () => {
    setEditingBudget(null);
    setEditBudgetData({ allocated_amount: '', notes: '' });
  };

  const handleEditExpenseSave = async (expenseId: number) => {
    try {
      const amount = parseFloat(editFormData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        return;
      }

      await updateExpense(expenseId, {
        amount: amount,
        notes: editFormData.notes,
      });
      
      setEditingExpense(null);
      setEditFormData({ amount: '', notes: '' });
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update expense');
    }
  };

  const handleEditBudgetSave = async (budgetId: number) => {
    try {
      const amount = parseFloat(editBudgetData.allocated_amount);
      
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        return;
      }

      await updateBudget(budgetId, {
        allocated_amount: amount,
        notes: editBudgetData.notes,
      });
      
      setEditingBudget(null);
      setEditBudgetData({ allocated_amount: '', notes: '' });
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update budget');
    }
  };

  const handleUpdateExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rate = parseFloat(exchangeRateForm.rate);
      if (isNaN(rate) || rate <= 0) {
        setError('Exchange rate must be a positive number');
        return;
      }

      await updateExchangeRate({
        from_currency: exchangeRateForm.from_currency,
        to_currency: exchangeRateForm.to_currency,
        rate: rate,
      });

      setExchangeRateForm({
        from_currency: 'QAR',
        to_currency: 'INR',
        rate: '',
      });
      
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update exchange rate');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'food_and_groceries': 'bi-basket',
      'internet': 'bi-wifi',
      'mobile': 'bi-phone',
      'residency_renewal': 'bi-file-text',
      'car_petrol': 'bi-fuel-pump',
      'medical': 'bi-heart-pulse',
      'car_insurance_maintenance': 'bi-car-front',
      'tickets': 'bi-ticket',
      'school': 'bi-mortarboard',
      'electronics_items': 'bi-laptop',
      'misc': 'bi-three-dots',
      'madrasa': 'bi-book',
      'rent_we': 'bi-house',
      'clothes': 'bi-bag',
      'transport': 'bi-bus-front',
      'shopping': 'bi-bag-check',
      'entertainment': 'bi-controller',
      'bills': 'bi-receipt',
      'healthcare': 'bi-hospital',
      'education': 'bi-book',
      'travel': 'bi-airplane',
      'investment': 'bi-graph-up',
      'insurance': 'bi-shield-check',
      'rent': 'bi-house',
      'groceries': 'bi-basket',
      'fuel': 'bi-fuel-pump',
      'other': 'bi-question-circle'
    };
    return icons[category] || 'bi-question-circle';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'food_and_groceries': 'success',
      'internet': 'info',
      'mobile': 'primary',
      'residency_renewal': 'warning',
      'car_petrol': 'danger',
      'medical': 'danger',
      'car_insurance_maintenance': 'warning',
      'tickets': 'info',
      'school': 'primary',
      'electronics_items': 'dark',
      'misc': 'secondary',
      'madrasa': 'success',
      'rent_we': 'dark',
      'clothes': 'info',
      'transport': 'primary',
      'shopping': 'success',
      'entertainment': 'warning',
      'bills': 'danger',
      'healthcare': 'danger',
      'education': 'primary',
      'travel': 'info',
      'investment': 'success',
      'insurance': 'warning',
      'rent': 'dark',
      'groceries': 'success',
      'fuel': 'danger',
      'other': 'secondary'
    };
    return colors[category] || 'secondary';
  };

  const getBudgetStatus = (utilization: number) => {
    if (utilization <= 50) return { color: 'success', text: 'Good' };
    if (utilization <= 80) return { color: 'warning', text: 'Caution' };
    if (utilization <= 100) return { color: 'danger', text: 'High' };
    return { color: 'danger', text: 'Over Budget' };
  };

  const renderBudgetView = () => {
    if (!budgetSummary) return null;

    return (
      <div>
        {/* Budget Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Total Allocated</h6>
                    <h4 className="mb-0">₹{budgetSummary.total_allocated_inr.toFixed(2)}</h4>
                  </div>
                  <i className="bi bi-wallet2" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Total Spent</h6>
                    <h4 className="mb-0">₹{budgetSummary.total_spent_inr.toFixed(2)}</h4>
                  </div>
                  <i className="bi bi-credit-card" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`card text-white ${budgetSummary.total_remaining_inr >= 0 ? 'bg-success' : 'bg-danger'}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Remaining</h6>
                    <h4 className="mb-0">₹{budgetSummary.total_remaining_inr.toFixed(2)}</h4>
                  </div>
                  <i className="bi bi-piggy-bank" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`card text-white ${
              budgetSummary.overall_utilization_percentage <= 80 ? 'bg-success' : 
              budgetSummary.overall_utilization_percentage <= 100 ? 'bg-warning' : 'bg-danger'
            }`}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="card-title">Utilization</h6>
                    <h4 className="mb-0">{budgetSummary.overall_utilization_percentage.toFixed(1)}%</h4>
                  </div>
                  <i className="bi bi-speedometer2" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-calendar-month me-2"></i>
              Budget Details - {budgetSummary.period}
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Category</th>
                    <th className="text-end">Allocated</th>
                    <th className="text-end">Allocated (INR)</th>
                    <th className="text-end">Spent (INR)</th>
                    <th className="text-end">Remaining (INR)</th>
                    <th className="text-center">Utilization</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSummary.budgets.map((budget: any) => {
                    const status = getBudgetStatus(budget.utilization_percentage);
                    return (
                      <tr key={budget.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`${getCategoryIcon(budget.category.toLowerCase().replace(' ', '_'))} me-2 text-${getCategoryColor(budget.category.toLowerCase().replace(' ', '_'))}`}></i>
                            <span className="fw-semibold">{budget.category}</span>
                          </div>
                        </td>
                        <td className="text-end">
                          {editingBudget === budget.id ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '120px' }}
                              value={editBudgetData.allocated_amount}
                              onChange={(e) => setEditBudgetData({ ...editBudgetData, allocated_amount: e.target.value })}
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span className="fw-semibold">{formatCurrency(budget.allocated_amount, budget.currency)}</span>
                          )}
                        </td>
                        <td className="text-end fw-semibold text-primary">₹{budget.allocated_amount_inr.toFixed(2)}</td>
                        <td className="text-end fw-semibold text-danger">₹{budget.spent_amount.toFixed(2)}</td>
                        <td className={`text-end fw-semibold ${budget.remaining_amount >= 0 ? 'text-success' : 'text-danger'}`}>
                          ₹{budget.remaining_amount.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                              <div
                                className={`progress-bar bg-${status.color}`}
                                style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                              ></div>
                            </div>
                            <small className="fw-bold">{budget.utilization_percentage.toFixed(1)}%</small>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`badge bg-${status.color}`}>{status.text}</span>
                        </td>
                        <td className="text-center">
                          {editingBudget === budget.id ? (
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleEditBudgetSave(budget.id)}
                                title="Save changes"
                              >
                                <i className="bi bi-check"></i>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleEditBudgetCancel}
                                title="Cancel edit"
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditBudgetStart(budget)}
                                title="Edit budget"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteBudget(budget.id)}
                                title="Delete budget"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!summary) return null;

    return (
      <div>
        {/* Category Summary */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-pie-chart me-2"></i>
              Expenses by Category
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(summary.category_summary).map(([category, data]: [string, any]) => (
                <div key={category} className="col-md-6 col-lg-4 mb-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title mb-1">
                            <i className={`${getCategoryIcon(category.toLowerCase())} me-2 text-${getCategoryColor(category.toLowerCase())}`}></i>
                            {category}
                          </h6>
                          <p className="card-text mb-0">
                            <strong>₹{data.total_amount_inr.toFixed(2)}</strong>
                            <br />
                            <small className="text-muted">{data.count} entries</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Expense</th>
                <th>Category</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Amount (INR)</th>
                <th>Date</th>
                <th>Budget Status</th>
                <th>Notes</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <div className="fw-semibold">{expense.title}</div>
                    <small className="text-muted">
                      Added {new Date(expense.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <span className={`badge bg-${getCategoryColor(expense.category)}`}>
                      <i className={`${getCategoryIcon(expense.category)} me-1`}></i>
                      {expense.category_display}
                    </span>
                  </td>
                  <td className="text-end">
                    {editingExpense === expense.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '120px' }}
                        value={editFormData.amount}
                        onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div>
                        <span className="fw-semibold">{formatCurrency(expense.amount, expense.currency)}</span>
                        <br />
                        <small className="text-muted">{expense.currency_display}</small>
                      </div>
                    )}
                  </td>
                  <td className="text-end fw-semibold text-danger">
                    ₹{expense.amount_in_inr.toFixed(2)}
                  </td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>
                    {expense.budget_info ? (
                      <div>
                        <small className={`badge bg-${getBudgetStatus(expense.budget_info.utilization_percentage).color}`}>
                          {expense.budget_info.utilization_percentage.toFixed(1)}% used
                        </small>
                        <br />
                        <small className="text-muted">
                          ₹{expense.budget_info.remaining_amount.toFixed(2)} left
                        </small>
                      </div>
                    ) : (
                      <span className="badge bg-secondary">No Budget</span>
                    )}
                  </td>
                  <td>
                    {editingExpense === expense.id ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="Notes..."
                      />
                    ) : (
                      <div style={{ maxWidth: '200px' }}>
                        {expense.notes ? (
                          <small className="text-muted">{expense.notes}</small>
                        ) : (
                          <small className="text-muted fst-italic">No notes</small>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {editingExpense === expense.id ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEditExpenseSave(expense.id)}
                          title="Save changes"
                        >
                          <i className="bi bi-check"></i>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleEditExpenseCancel}
                          title="Cancel edit"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditExpenseStart(expense)}
                          title="Edit expense"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          title="Delete expense"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-credit-card me-2 text-danger"></i>
          Expenses & Budget
        </h1>
        <div className="d-flex gap-2 align-items-center">
          {/* View Toggle */}
          <div className="d-flex align-items-center me-3">
            <span className="me-2 text-muted small">View:</span>
            <div className="btn-group" role="group">
              <input
                type="radio"
                className="btn-check"
                name="viewMode"
                id="listView"
                checked={viewMode === 'list'}
                onChange={() => setViewMode('list')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="listView">
                <i className="bi bi-list-ul me-1"></i>
                List
              </label>

              <input
                type="radio"
                className="btn-check"
                name="viewMode"
                id="summaryView"
                checked={viewMode === 'summary'}
                onChange={() => setViewMode('summary')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="summaryView">
                <i className="bi bi-pie-chart me-1"></i>
                Summary
              </label>

              <input
                type="radio"
                className="btn-check"
                name="viewMode"
                id="budgetView"
                checked={viewMode === 'budget'}
                onChange={() => setViewMode('budget')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="budgetView">
                <i className="bi bi-wallet2 me-1"></i>
                Budget
              </label>
            </div>
          </div>

          <button
            className="btn btn-outline-info"
            onClick={() => setShowExchangeRates(!showExchangeRates)}
          >
            <i className="bi bi-currency-exchange me-1"></i>
            Exchange Rates
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowBudgetForm(!showBudgetForm)}
          >
            <i className="bi bi-wallet2 me-1"></i>
            {showBudgetForm ? 'Cancel' : 'Add Budget'}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Exchange Rates Section */}
      {showExchangeRates && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-currency-exchange me-2"></i>
              Exchange Rates Management
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Current Exchange Rates</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Rate</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(exchangeRates).map(([key, rate]: [string, any]) => {
                        const [from, to] = key.split('_to_');
                        return (
                          <tr key={key}>
                            <td>{from}</td>
                            <td>{to}</td>
                            <td>{rate.rate}</td>
                            <td>
                              <small className="text-muted">
                                {new Date(rate.updated_at).toLocaleDateString()}
                              </small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-md-6">
                <h6>Update Exchange Rate</h6>
                <form onSubmit={handleUpdateExchangeRate}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">From Currency</label>
                      <select
                        className="form-select"
                        value={exchangeRateForm.from_currency}
                        onChange={(e) => setExchangeRateForm({ ...exchangeRateForm, from_currency: e.target.value })}
                      >
                        {currencyOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">To Currency</label>
                      <select
                        className="form-select"
                        value={exchangeRateForm.to_currency}
                        onChange={(e) => setExchangeRateForm({ ...exchangeRateForm, to_currency: e.target.value })}
                      >
                        {currencyOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-control"
                      value={exchangeRateForm.rate}
                      onChange={(e) => setExchangeRateForm({ ...exchangeRateForm, rate: e.target.value })}
                      placeholder="e.g., 22.5"
                      required
                    />
                    <small className="text-muted">
                      1 {exchangeRateForm.from_currency} = ? {exchangeRateForm.to_currency}
                    </small>
                  </div>
                  <button type="submit" className="btn btn-info">
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Update Rate
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Form */}
      {showBudgetForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-wallet2 me-2"></i>
              Add Monthly Budget
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddBudget}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="budget_category" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="budget_category"
                    value={budgetFormData.category}
                    onChange={e => setBudgetFormData({ ...budgetFormData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(([value, label]) => (
                      <option key={value} value={label}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="budget_amount" className="form-label">Allocated Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="budget_amount"
                    value={budgetFormData.allocated_amount}
                    onChange={e => setBudgetFormData({ ...budgetFormData, allocated_amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="budget_currency" className="form-label">Currency</label>
                  <select
                    className="form-select"
                    id="budget_currency"
                    value={budgetFormData.currency}
                    onChange={e => setBudgetFormData({ ...budgetFormData, currency: e.target.value })}
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="budget_notes" className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="budget_notes"
                  rows={3}
                  value={budgetFormData.notes}
                  onChange={e => setBudgetFormData({ ...budgetFormData, notes: e.target.value })}
                  placeholder="Additional notes about this budget..."
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Budget
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBudgetForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Expense
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddExpense}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="title" className="form-label">Expense Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Grocery Shopping, Fuel, Internet Bill"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="amount" className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="amount"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="currency" className="form-label">Currency</label>
                  <select
                    className="form-select"
                    id="currency"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="date" className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this expense..."
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-danger">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Expense
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading expense data...</p>
        </div>
      ) : expenses.length === 0 && viewMode === 'list' ? (
        <div className="text-center py-5">
          <i className="bi bi-credit-card text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No expenses yet</h3>
          <p className="text-muted">Start tracking your expenses by adding your first entry!</p>
          <button
            className="btn btn-danger"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Your First Expense
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && viewMode !== 'budget' && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-danger text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Expenses</h6>
                        <h4 className="mb-0">₹{summary.total_expense_inr.toFixed(2)}</h4>
                      </div>
                      <i className="bi bi-credit-card" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Entries</h6>
                        <h4 className="mb-0">{summary.total_count}</h4>
                      </div>
                      <i className="bi bi-list-ul" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Categories</h6>
                        <h4 className="mb-0">{Object.keys(summary.category_summary).length}</h4>
                      </div>
                      <i className="bi bi-pie-chart" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Avg per Entry</h6>
                        <h4 className="mb-0">₹{summary.total_count > 0 ? (summary.total_expense_inr / summary.total_count).toFixed(2) : '0.00'}</h4>
                      </div>
                      <i className="bi bi-calculator" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Display */}
          {viewMode === 'budget' ? renderBudgetView() : 
           viewMode === 'summary' ? renderSummaryView() : renderListView()}
        </>
      )}
    </Layout>
  );
};

export default ExpensesPage;