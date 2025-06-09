import { useEffect, useState } from 'react';
import { 
  fetchLiabilities, 
  createLiability, 
  deleteLiability, 
  updateLiability,
  getLiabilityTypes,
  getLiabilityStatuses,
  getLiabilitySummary,
  getUpcomingPayments,
  Liability
} from '../api/liabilities';
import { 
  fetchMoneyLent, 
  createMoneyLent, 
  deleteMoneyLent, 
  updateMoneyLent,
  getMoneyLentStatuses,
  getMoneyLentSummary,
  getOverdueMoneyLent,
  recordPayment,
  MoneyLent
} from '../api/moneyLent';
import { getCurrentRates, updateExchangeRate, formatCurrency, convertCurrency } from '../api/exchangeRates';
import Layout from '../components/Layout';

const LiabilitiesPage = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [moneyLentRecords, setMoneyLentRecords] = useState<MoneyLent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMoneyLentForm, setShowMoneyLentForm] = useState(false);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [liabilityTypes, setLiabilityTypes] = useState<Array<[string, string]>>([]);
  const [liabilityStatuses, setLiabilityStatuses] = useState<Array<[string, string]>>([]);
  const [moneyLentStatuses, setMoneyLentStatuses] = useState<Array<[string, string]>>([]);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [moneyLentSummary, setMoneyLentSummary] = useState<any>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<Liability[]>([]);
  const [overdueMoneyLent, setOverdueMoneyLent] = useState<MoneyLent[]>([]);
  const [viewMode, setViewMode] = useState<'liabilities' | 'money-lent' | 'upcoming' | 'summary'>('liabilities');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [editingLiability, setEditingLiability] = useState<number | null>(null);
  const [editingMoneyLent, setEditingMoneyLent] = useState<number | null>(null);
  const [recordingPayment, setRecordingPayment] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editFormData, setEditFormData] = useState({
    current_balance: '',
    monthly_payment: '',
    next_payment_date: '',
    notes: '',
  });
  const [editMoneyLentData, setEditMoneyLentData] = useState({
    amount_returned: '',
    expected_return_date: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    principal_amount: '',
    current_balance: '',
    currency: 'INR',
    interest_rate: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    next_payment_date: '',
    status: 'active',
    lender_name: '',
    notes: '',
  });
  const [moneyLentFormData, setMoneyLentFormData] = useState({
    borrower_name: '',
    amount_lent: '',
    amount_returned: '0',
    currency: 'INR',
    date_lent: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    status: 'active',
    borrower_contact: '',
    purpose: '',
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
        liabilitiesData, 
        moneyLentData,
        typesData, 
        statusesData,
        moneyLentStatusesData,
        ratesData, 
        summaryData,
        moneyLentSummaryData,
        upcomingData,
        overdueData
      ] = await Promise.all([
        fetchLiabilities(),
        fetchMoneyLent(),
        getLiabilityTypes(),
        getLiabilityStatuses(),
        getMoneyLentStatuses(),
        getCurrentRates(),
        getLiabilitySummary(),
        getMoneyLentSummary(),
        getUpcomingPayments(),
        getOverdueMoneyLent(),
      ]);
      
      setLiabilities(liabilitiesData);
      setMoneyLentRecords(moneyLentData);
      setLiabilityTypes(typesData);
      setLiabilityStatuses(statusesData);
      setMoneyLentStatuses(moneyLentStatusesData);
      setExchangeRates(ratesData);
      setSummary(summaryData);
      setMoneyLentSummary(moneyLentSummaryData);
      setUpcomingPayments(upcomingData);
      setOverdueMoneyLent(overdueData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        type: formData.type,
        principal_amount: parseFloat(formData.principal_amount),
        current_balance: parseFloat(formData.current_balance),
        currency: formData.currency,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : undefined,
        monthly_payment: formData.monthly_payment ? parseFloat(formData.monthly_payment) : undefined,
        start_date: formData.start_date,
        due_date: formData.due_date || undefined,
        next_payment_date: formData.next_payment_date || undefined,
        status: formData.status,
        lender_name: formData.lender_name || undefined,
        notes: formData.notes,
      };

      await createLiability(data);
      setFormData({
        name: '',
        type: '',
        principal_amount: '',
        current_balance: '',
        currency: 'INR',
        interest_rate: '',
        monthly_payment: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        next_payment_date: '',
        status: 'active',
        lender_name: '',
        notes: '',
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create liability');
    }
  };

  const handleAddMoneyLent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        borrower_name: moneyLentFormData.borrower_name,
        amount_lent: parseFloat(moneyLentFormData.amount_lent),
        amount_returned: parseFloat(moneyLentFormData.amount_returned),
        currency: moneyLentFormData.currency,
        date_lent: moneyLentFormData.date_lent,
        expected_return_date: moneyLentFormData.expected_return_date || undefined,
        status: moneyLentFormData.status,
        borrower_contact: moneyLentFormData.borrower_contact || undefined,
        purpose: moneyLentFormData.purpose || undefined,
        notes: moneyLentFormData.notes,
      };

      await createMoneyLent(data);
      setMoneyLentFormData({
        borrower_name: '',
        amount_lent: '',
        amount_returned: '0',
        currency: 'INR',
        date_lent: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        status: 'active',
        borrower_contact: '',
        purpose: '',
        notes: '',
      });
      setShowMoneyLentForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create money lent record');
    }
  };

  const handleRecordPayment = async (id: number) => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Payment amount must be a positive number');
        return;
      }

      await recordPayment(id, amount);
      setRecordingPayment(null);
      setPaymentAmount('');
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleDeleteLiability = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this liability?')) {
      try {
        await deleteLiability(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete liability');
      }
    }
  };

  const handleDeleteMoneyLent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this money lent record?')) {
      try {
        await deleteMoneyLent(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete money lent record');
      }
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

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
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
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
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
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'active': 'warning',
      'paid_off': 'success',
      'defaulted': 'danger',
      'partially_returned': 'info',
      'fully_returned': 'success'
    };
    return colors[status] || 'secondary';
  };

  const renderMoneyLentView = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-cash-stack me-2"></i>
          Money Given as Loan (Without Interest)
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Borrower</th>
                <th>Purpose</th>
                <th className="text-end">Amount Lent</th>
                <th className="text-end">Amount Returned</th>
                <th className="text-end">Outstanding</th>
                <th className="text-center">Progress</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {moneyLentRecords.map((record) => {
                const isOverdue = record.expected_return_date && 
                  new Date(record.expected_return_date) < new Date() && 
                  record.status !== 'fully_returned';

                return (
                  <tr key={record.id} className={isOverdue ? 'table-warning' : ''}>
                    <td>
                      <div>
                        <div className="fw-semibold">{record.borrower_name}</div>
                        {record.borrower_contact && (
                          <small className="text-muted">{record.borrower_contact}</small>
                        )}
                        <br />
                        <small className="text-muted">
                          Lent on {new Date(record.date_lent).toLocaleDateString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      {record.purpose ? (
                        <span className="badge bg-info">{record.purpose}</span>
                      ) : (
                        <span className="text-muted">Not specified</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div>
                        <span className="fw-semibold">{formatCurrency(record.amount_lent, record.currency)}</span>
                        <br />
                        <small className="text-muted">₹{record.amount_lent_in_inr.toFixed(2)}</small>
                      </div>
                    </td>
                    <td className="text-end">
                      {editingMoneyLent === record.id ? (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '120px' }}
                          value={editMoneyLentData.amount_returned}
                          onChange={(e) => setEditMoneyLentData({ ...editMoneyLentData, amount_returned: e.target.value })}
                          min="0"
                          max={record.amount_lent}
                          step="0.01"
                        />
                      ) : (
                        <div>
                          <span className="fw-semibold text-success">{formatCurrency(record.amount_returned, record.currency)}</span>
                          <br />
                          <small className="text-muted">₹{record.amount_returned_in_inr.toFixed(2)}</small>
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <div>
                        <span className="fw-semibold text-danger">{formatCurrency(record.outstanding_amount, record.currency)}</span>
                        <br />
                        <small className="text-muted">₹{record.outstanding_amount_in_inr.toFixed(2)}</small>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <div className="progress mb-1" style={{ width: '80px', height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${record.return_percentage}%` }}
                          ></div>
                        </div>
                        <small className="fw-bold">{record.return_percentage.toFixed(1)}%</small>
                      </div>
                    </td>
                    <td>
                      {record.expected_return_date ? (
                        <div>
                          <div>{new Date(record.expected_return_date).toLocaleDateString()}</div>
                          {isOverdue && (
                            <small className="text-warning fw-bold">OVERDUE</small>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(record.status)}`}>
                        {record.status_display}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        {record.status !== 'fully_returned' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setRecordingPayment(record.id);
                              setPaymentAmount('');
                            }}
                            title="Record payment"
                          >
                            <i className="bi bi-cash"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteMoneyLent(record.id)}
                          title="Delete record"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {moneyLentRecords.length === 0 && (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-cash-stack" style={{ fontSize: '3rem' }}></i>
            <p className="mt-2">No money lent records yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSummaryView = () => {
    if (!summary || !moneyLentSummary) return null;

    return (
      <div>
        {/* Combined Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-credit-card-2-back me-2"></i>
                  Liabilities Summary
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-4">
                    <h4 className="text-danger">₹{summary.total_balance_inr.toFixed(2)}</h4>
                    <small className="text-muted">Total Debt</small>
                  </div>
                  <div className="col-4">
                    <h4 className="text-warning">₹{summary.total_monthly_payment_inr.toFixed(2)}</h4>
                    <small className="text-muted">Monthly Payments</small>
                  </div>
                  <div className="col-4">
                    <h4 className="text-primary">{summary.total_count}</h4>
                    <small className="text-muted">Total Liabilities</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-cash-stack me-2"></i>
                  Money Lent Summary
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-4">
                    <h4 className="text-info">₹{moneyLentSummary.total_lent_inr.toFixed(2)}</h4>
                    <small className="text-muted">Total Lent</small>
                  </div>
                  <div className="col-4">
                    <h4 className="text-success">₹{moneyLentSummary.total_returned_inr.toFixed(2)}</h4>
                    <small className="text-muted">Total Returned</small>
                  </div>
                  <div className="col-4">
                    <h4 className="text-warning">₹{moneyLentSummary.total_outstanding_inr.toFixed(2)}</h4>
                    <small className="text-muted">Outstanding</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="card-title mb-0">Liabilities by Type</h6>
              </div>
              <div className="card-body">
                {Object.entries(summary.type_summary).map(([type, data]: [string, any]) => (
                  <div key={type} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <i className={`${getTypeIcon(type.toLowerCase().replace(' ', '_'))} me-2 text-${getTypeColor(type.toLowerCase().replace(' ', '_'))}`}></i>
                      <span>{type}</span>
                      <small className="text-muted ms-2">({data.count})</small>
                    </div>
                    <span className="fw-bold">₹{data.total_balance_inr.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="card-title mb-0">Money Lent by Status</h6>
              </div>
              <div className="card-body">
                {Object.entries(moneyLentSummary.status_summary).map(([status, data]: [string, any]) => (
                  <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span className={`badge bg-${getStatusColor(status.toLowerCase().replace(' ', '_'))} me-2`}>
                        {status}
                      </span>
                      <small className="text-muted">({data.count})</small>
                    </div>
                    <span className="fw-bold">₹{data.total_outstanding_inr.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Recording Modal
  const renderPaymentModal = () => {
    if (!recordingPayment) return null;
    
    const record = moneyLentRecords.find(r => r.id === recordingPayment);
    if (!record) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Record Payment</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setRecordingPayment(null);
                  setPaymentAmount('');
                }}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <strong>Borrower:</strong> {record.borrower_name}
              </div>
              <div className="mb-3">
                <strong>Outstanding Amount:</strong> {formatCurrency(record.outstanding_amount, record.currency)} 
                (₹{record.outstanding_amount_in_inr.toFixed(2)})
              </div>
              <div className="mb-3">
                <label className="form-label">Payment Amount ({record.currency})</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  min="0"
                  max={record.outstanding_amount}
                  step="0.01"
                />
                <small className="text-muted">
                  Maximum: {formatCurrency(record.outstanding_amount, record.currency)}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRecordingPayment(null);
                  setPaymentAmount('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleRecordPayment(recordingPayment)}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-credit-card-2-back me-2 text-danger"></i>
          Liabilities & Money Lent
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
                id="liabilitiesView"
                checked={viewMode === 'liabilities'}
                onChange={() => setViewMode('liabilities')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="liabilitiesView">
                <i className="bi bi-credit-card-2-back me-1"></i>
                Liabilities
              </label>

              <input
                type="radio"
                className="btn-check"
                name="viewMode"
                id="moneyLentView"
                checked={viewMode === 'money-lent'}
                onChange={() => setViewMode('money-lent')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="moneyLentView">
                <i className="bi bi-cash-stack me-1"></i>
                Money Lent
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
          
          {viewMode === 'money-lent' ? (
            <button
              className="btn btn-success"
              onClick={() => setShowMoneyLentForm(!showMoneyLentForm)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              {showMoneyLentForm ? 'Cancel' : 'Add Money Lent'}
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={() => setShowForm(!showForm)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              {showForm ? 'Cancel' : 'Add Liability'}
            </button>
          )}
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

      {/* Add Money Lent Form */}
      {showMoneyLentForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add Money Given as Loan
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddMoneyLent}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="borrower_name" className="form-label">Borrower Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="borrower_name"
                    value={moneyLentFormData.borrower_name}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, borrower_name: e.target.value })}
                    placeholder="Name of the person who borrowed money"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="borrower_contact" className="form-label">Contact (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="borrower_contact"
                    value={moneyLentFormData.borrower_contact}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, borrower_contact: e.target.value })}
                    placeholder="Phone number or email"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="amount_lent" className="form-label">Amount Lent</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="amount_lent"
                    value={moneyLentFormData.amount_lent}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, amount_lent: e.target.value })}
                    placeholder="Amount given as loan"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="currency" className="form-label">Currency</label>
                  <select
                    className="form-select"
                    id="currency"
                    value={moneyLentFormData.currency}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, currency: e.target.value })}
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="date_lent" className="form-label">Date Lent</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date_lent"
                    value={moneyLentFormData.date_lent}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, date_lent: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="purpose" className="form-label">Purpose (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="purpose"
                    value={moneyLentFormData.purpose}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, purpose: e.target.value })}
                    placeholder="e.g., Medical Emergency, Business, Education"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="expected_return_date" className="form-label">Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="expected_return_date"
                    value={moneyLentFormData.expected_return_date}
                    onChange={e => setMoneyLentFormData({ ...moneyLentFormData, expected_return_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="notes"
                  rows={3}
                  value={moneyLentFormData.notes}
                  onChange={e => setMoneyLentFormData({ ...moneyLentFormData, notes: e.target.value })}
                  placeholder="Additional notes about this loan..."
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Money Lent Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMoneyLentForm(false)}
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
          <p className="mt-2 text-muted">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {(summary || moneyLentSummary) && (
            <div className="row mb-4">
              {summary && (
                <>
                  <div className="col-md-3">
                    <div className="card bg-danger text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Total Debt</h6>
                            <h4 className="mb-0">₹{summary.total_balance_inr.toFixed(2)}</h4>
                          </div>
                          <i className="bi bi-credit-card-2-back" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Monthly Payments</h6>
                            <h4 className="mb-0">₹{summary.total_monthly_payment_inr.toFixed(2)}</h4>
                          </div>
                          <i className="bi bi-calendar-month" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {moneyLentSummary && (
                <>
                  <div className="col-md-3">
                    <div className="card bg-info text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Money Lent</h6>
                            <h4 className="mb-0">₹{moneyLentSummary.total_lent_inr.toFixed(2)}</h4>
                          </div>
                          <i className="bi bi-cash-stack" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success text-white">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="card-title">Outstanding</h6>
                            <h4 className="mb-0">₹{moneyLentSummary.total_outstanding_inr.toFixed(2)}</h4>
                          </div>
                          <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Content Display */}
          {viewMode === 'summary' ? renderSummaryView() : 
           viewMode === 'money-lent' ? renderMoneyLentView() : 
           <div>Liabilities view would go here (existing implementation)</div>}
        </>
      )}

      {/* Payment Recording Modal */}
      {renderPaymentModal()}
    </Layout>
  );
};

export default LiabilitiesPage;