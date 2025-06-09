import { useEffect, useState } from 'react';
import { 
  fetchIncomes, 
  createIncome, 
  deleteIncome, 
  updateIncome,
  getIncomeCategories,
  getRecurringPeriods,
  getIncomeSummary
} from '../api/income';
import { getCurrentRates, updateExchangeRate, formatCurrency, convertCurrency } from '../api/exchangeRates';
import { Income } from '../types';
import Layout from '../components/Layout';

const IncomePage = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [categories, setCategories] = useState<Array<[string, string]>>([]);
  const [recurringPeriods, setRecurringPeriods] = useState<Array<[string, string]>>([]);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const [editingIncome, setEditingIncome] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    source: '',
    category: '',
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_period: '',
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
      const [incomesData, categoriesData, periodsData, ratesData, summaryData] = await Promise.all([
        fetchIncomes(),
        getIncomeCategories(),
        getRecurringPeriods(),
        getCurrentRates(),
        getIncomeSummary(),
      ]);
      
      setIncomes(incomesData);
      setCategories(categoriesData);
      setRecurringPeriods(periodsData);
      setExchangeRates(ratesData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        source: formData.source,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: formData.date,
        is_recurring: formData.is_recurring,
        recurring_period: formData.is_recurring ? formData.recurring_period : undefined,
        notes: formData.notes,
      };

      await createIncome(data);
      setFormData({
        source: '',
        category: '',
        amount: '',
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        recurring_period: '',
        notes: '',
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create income');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        await deleteIncome(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete income');
      }
    }
  };

  const handleEditStart = (income: Income) => {
    setEditingIncome(income.id);
    setEditFormData({
      amount: income.amount.toString(),
      notes: income.notes || '',
    });
  };

  const handleEditCancel = () => {
    setEditingIncome(null);
    setEditFormData({ amount: '', notes: '' });
  };

  const handleEditSave = async (incomeId: number) => {
    try {
      const amount = parseFloat(editFormData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        return;
      }

      await updateIncome(incomeId, {
        amount: amount,
        notes: editFormData.notes,
      });
      
      setEditingIncome(null);
      setEditFormData({ amount: '', notes: '' });
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update income');
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
      load(); // Reload to get updated rates
    } catch (err: any) {
      console.error(err);
      setError('Failed to update exchange rate');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'salary': 'bi-briefcase',
      'freelance': 'bi-laptop',
      'business': 'bi-building',
      'investment': 'bi-graph-up',
      'rental': 'bi-house',
      'dividend': 'bi-pie-chart',
      'interest': 'bi-bank',
      'bonus': 'bi-gift',
      'commission': 'bi-percent',
      'pension': 'bi-shield-check',
      'gift': 'bi-heart',
      'other': 'bi-question-circle'
    };
    return icons[category] || 'bi-question-circle';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'salary': 'primary',
      'freelance': 'info',
      'business': 'success',
      'investment': 'warning',
      'rental': 'dark',
      'dividend': 'secondary',
      'interest': 'success',
      'bonus': 'danger',
      'commission': 'info',
      'pension': 'primary',
      'gift': 'danger',
      'other': 'secondary'
    };
    return colors[category] || 'secondary';
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
              Income by Category
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
                        <div className="text-end">
                          {Object.entries(data.currencies).map(([currency, amount]: [string, any]) => (
                            <div key={currency} className="small text-muted">
                              {formatCurrency(amount, currency)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Currency Summary */}
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-currency-exchange me-2"></i>
              Income by Currency
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(summary.currency_summary).map(([currency, data]: [string, any]) => (
                <div key={currency} className="col-md-6 mb-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title">
                        {currencyOptions.find(c => c.value === currency)?.label || currency}
                      </h6>
                      <p className="card-text mb-0">
                        <strong>{formatCurrency(data.total_amount, currency)}</strong>
                        <br />
                        <small className="text-muted">{data.count} entries</small>
                        {currency !== 'INR' && (
                          <>
                            <br />
                            <small className="text-success">
                              ≈ ₹{convertCurrency(data.total_amount, currency, 'INR', exchangeRates).toFixed(2)}
                            </small>
                          </>
                        )}
                      </p>
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
                <th>Source</th>
                <th>Category</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Amount (INR)</th>
                <th>Date</th>
                <th>Recurring</th>
                <th>Notes</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id}>
                  <td>
                    <div className="fw-semibold">{income.source}</div>
                    <small className="text-muted">
                      Added {new Date(income.created_at).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <span className={`badge bg-${getCategoryColor(income.category)}`}>
                      <i className={`${getCategoryIcon(income.category)} me-1`}></i>
                      {income.category_display}
                    </span>
                  </td>
                  <td className="text-end">
                    {editingIncome === income.id ? (
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
                        <span className="fw-semibold">{formatCurrency(income.amount, income.currency)}</span>
                        <br />
                        <small className="text-muted">{income.currency_display}</small>
                      </div>
                    )}
                  </td>
                  <td className="text-end fw-semibold text-success">
                    ₹{income.amount_in_inr.toFixed(2)}
                  </td>
                  <td>
                    <div>{new Date(income.date).toLocaleDateString()}</div>
                    {income.next_occurrence && (
                      <small className="text-muted">
                        Next: {new Date(income.next_occurrence).toLocaleDateString()}
                      </small>
                    )}
                  </td>
                  <td>
                    {income.is_recurring ? (
                      <span className="badge bg-info">
                        <i className="bi bi-arrow-repeat me-1"></i>
                        {income.recurring_period_display}
                      </span>
                    ) : (
                      <span className="badge bg-secondary">One-time</span>
                    )}
                  </td>
                  <td>
                    {editingIncome === income.id ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="Notes..."
                      />
                    ) : (
                      <div style={{ maxWidth: '200px' }}>
                        {income.notes ? (
                          <small className="text-muted">{income.notes}</small>
                        ) : (
                          <small className="text-muted fst-italic">No notes</small>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {editingIncome === income.id ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEditSave(income.id)}
                          title="Save changes"
                        >
                          <i className="bi bi-check"></i>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={handleEditCancel}
                          title="Cancel edit"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditStart(income)}
                          title="Edit income"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(income.id)}
                          title="Delete income"
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
          <i className="bi bi-cash-coin me-2 text-success"></i>
          Income
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
            className="btn btn-success"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'Add Income'}
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

      {/* Add Income Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Income
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="source" className="form-label">Income Source</label>
                  <input
                    type="text"
                    className="form-control"
                    id="source"
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Salary, Freelance Project, Rental Income"
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
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="is_recurring">
                      Recurring Income
                    </label>
                  </div>
                  {formData.is_recurring && (
                    <select
                      className="form-select mt-2"
                      value={formData.recurring_period}
                      onChange={e => setFormData({ ...formData, recurring_period: e.target.value })}
                      required={formData.is_recurring}
                    >
                      <option value="">Select frequency...</option>
                      {recurringPeriods.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this income..."
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Income
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
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading income data...</p>
        </div>
      ) : incomes.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-cash-coin text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No income records yet</h3>
          <p className="text-muted">Start tracking your income by adding your first entry!</p>
          <button
            className="btn btn-success"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Your First Income
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Income</h6>
                        <h4 className="mb-0">₹{summary.total_income_inr.toFixed(2)}</h4>
                      </div>
                      <i className="bi bi-cash-coin" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
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
                        <h6 className="card-title">Currencies</h6>
                        <h4 className="mb-0">{Object.keys(summary.currency_summary).length}</h4>
                      </div>
                      <i className="bi bi-currency-exchange" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Income Display */}
          {viewMode === 'summary' ? renderSummaryView() : renderListView()}
        </>
      )}
    </Layout>
  );
};

export default IncomePage;