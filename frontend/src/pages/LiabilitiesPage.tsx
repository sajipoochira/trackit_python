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
import { getCurrentRates, updateExchangeRate, formatCurrency, convertCurrency } from '../api/exchangeRates';
import Layout from '../components/Layout';

const LiabilitiesPage = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [liabilityTypes, setLiabilityTypes] = useState<Array<[string, string]>>([]);
  const [liabilityStatuses, setLiabilityStatuses] = useState<Array<[string, string]>>([]);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<Liability[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'summary' | 'upcoming'>('list');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [editingLiability, setEditingLiability] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    current_balance: '',
    monthly_payment: '',
    next_payment_date: '',
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
        typesData, 
        statusesData,
        ratesData, 
        summaryData,
        upcomingData
      ] = await Promise.all([
        fetchLiabilities(),
        getLiabilityTypes(),
        getLiabilityStatuses(),
        getCurrentRates(),
        getLiabilitySummary(),
        getUpcomingPayments(),
      ]);
      
      setLiabilities(liabilitiesData);
      setLiabilityTypes(typesData);
      setLiabilityStatuses(statusesData);
      setExchangeRates(ratesData);
      setSummary(summaryData);
      setUpcomingPayments(upcomingData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load liability data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
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

  const handleDelete = async (id: number) => {
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

  const handleEditStart = (liability: Liability) => {
    setEditingLiability(liability.id);
    setEditFormData({
      current_balance: liability.current_balance.toString(),
      monthly_payment: liability.monthly_payment?.toString() || '',
      next_payment_date: liability.next_payment_date || '',
      notes: liability.notes || '',
    });
  };

  const handleEditCancel = () => {
    setEditingLiability(null);
    setEditFormData({ current_balance: '', monthly_payment: '', next_payment_date: '', notes: '' });
  };

  const handleEditSave = async (liabilityId: number) => {
    try {
      const currentBalance = parseFloat(editFormData.current_balance);
      const monthlyPayment = editFormData.monthly_payment ? parseFloat(editFormData.monthly_payment) : undefined;
      
      if (isNaN(currentBalance) || currentBalance < 0) {
        setError('Current balance must be a non-negative number');
        return;
      }

      await updateLiability(liabilityId, {
        current_balance: currentBalance,
        monthly_payment: monthlyPayment,
        next_payment_date: editFormData.next_payment_date || undefined,
        notes: editFormData.notes,
      });
      
      setEditingLiability(null);
      setEditFormData({ current_balance: '', monthly_payment: '', next_payment_date: '', notes: '' });
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update liability');
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
      'defaulted': 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getFilteredLiabilities = () => {
    let filtered = liabilities;
    
    if (selectedType) {
      filtered = filtered.filter(liability => liability.type === selectedType);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(liability => liability.status === selectedStatus);
    }
    
    return filtered;
  };

  const renderUpcomingView = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-calendar-event me-2"></i>
          Upcoming Payments (Next 30 Days)
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Liability</th>
                <th>Type</th>
                <th className="text-end">Payment Amount</th>
                <th>Due Date</th>
                <th>Days Until Due</th>
                <th className="text-end">Current Balance</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingPayments.map((liability) => {
                const dueDate = new Date(liability.next_payment_date!);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntilDue < 0;
                const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;

                return (
                  <tr key={liability.id} className={isOverdue ? 'table-danger' : isUrgent ? 'table-warning' : ''}>
                    <td>
                      <div>
                        <div className="fw-semibold">{liability.name}</div>
                        {liability.lender_name && (
                          <small className="text-muted">{liability.lender_name}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge bg-${getTypeColor(liability.type)}`}>
                        <i className={`${getTypeIcon(liability.type)} me-1`}></i>
                        {liability.type_display}
                      </span>
                    </td>
                    <td className="text-end fw-semibold">
                      {liability.monthly_payment ? (
                        <>
                          {formatCurrency(liability.monthly_payment, liability.currency)}
                          <br />
                          <small className="text-muted">₹{liability.monthly_payment_in_inr.toFixed(2)}</small>
                        </>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                    <td>
                      <div>{dueDate.toLocaleDateString()}</div>
                      {isOverdue && (
                        <small className="text-danger fw-bold">OVERDUE</small>
                      )}
                      {isUrgent && !isOverdue && (
                        <small className="text-warning fw-bold">DUE SOON</small>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        isOverdue ? 'bg-danger' : isUrgent ? 'bg-warning' : 'bg-info'
                      }`}>
                        {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="fw-semibold">₹{liability.current_balance_in_inr.toFixed(2)}</div>
                      <div className="progress mt-1" style={{ height: '4px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${liability.completion_percentage}%` }}
                        ></div>
                      </div>
                      <small className="text-muted">{liability.completion_percentage.toFixed(1)}% paid</small>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEditStart(liability)}
                        title="Update payment"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {upcomingPayments.length === 0 && (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-calendar-check" style={{ fontSize: '3rem' }}></i>
            <p className="mt-2">No upcoming payments in the next 30 days</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSummaryView = () => {
    if (!summary) return null;

    return (
      <div>
        {/* Type Summary */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-pie-chart me-2"></i>
              Liabilities by Type
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(summary.type_summary).map(([type, data]: [string, any]) => (
                <div key={type} className="col-md-6 col-lg-4 mb-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title mb-1">
                            <i className={`${getTypeIcon(type.toLowerCase().replace(' ', '_'))} me-2 text-${getTypeColor(type.toLowerCase().replace(' ', '_'))}`}></i>
                            {type}
                          </h6>
                          <p className="card-text mb-0">
                            <strong>₹{data.total_balance_inr.toFixed(2)}</strong>
                            <br />
                            <small className="text-muted">{data.count} liabilities</small>
                          </p>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">
                            Principal: ₹{data.total_principal_inr.toFixed(2)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-bar-chart me-2"></i>
              Liabilities by Status
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(summary.status_summary).map(([status, data]: [string, any]) => (
                <div key={status} className="col-md-4 mb-3">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title">
                        <span className={`badge bg-${getStatusColor(status.toLowerCase().replace(' ', '_'))}`}>
                          {status}
                        </span>
                      </h6>
                      <p className="card-text mb-0">
                        <strong>₹{data.total_balance_inr.toFixed(2)}</strong>
                        <br />
                        <small className="text-muted">{data.count} liabilities</small>
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
                <th>Liability</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-end">Principal Amount</th>
                <th className="text-end">Current Balance</th>
                <th className="text-end">Monthly Payment</th>
                <th className="text-center">Progress</th>
                <th>Next Payment</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredLiabilities().map((liability) => (
                <tr key={liability.id}>
                  <td>
                    <div>
                      <div className="fw-semibold">{liability.name}</div>
                      {liability.lender_name && (
                        <small className="text-muted">{liability.lender_name}</small>
                      )}
                      <br />
                      <small className="text-muted">
                        Started {new Date(liability.start_date).toLocaleDateString()}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${getTypeColor(liability.type)}`}>
                      <i className={`${getTypeIcon(liability.type)} me-1`}></i>
                      {liability.type_display}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${getStatusColor(liability.status)}`}>
                      {liability.status_display}
                    </span>
                  </td>
                  <td className="text-end">
                    <div>
                      <span className="fw-semibold">{formatCurrency(liability.principal_amount, liability.currency)}</span>
                      <br />
                      <small className="text-muted">₹{liability.principal_amount_in_inr.toFixed(2)}</small>
                    </div>
                  </td>
                  <td className="text-end">
                    {editingLiability === liability.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '120px' }}
                        value={editFormData.current_balance}
                        onChange={(e) => setEditFormData({ ...editFormData, current_balance: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div>
                        <span className="fw-semibold text-danger">{formatCurrency(liability.current_balance, liability.currency)}</span>
                        <br />
                        <small className="text-muted">₹{liability.current_balance_in_inr.toFixed(2)}</small>
                      </div>
                    )}
                  </td>
                  <td className="text-end">
                    {editingLiability === liability.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '120px' }}
                        value={editFormData.monthly_payment}
                        onChange={(e) => setEditFormData({ ...editFormData, monthly_payment: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="Optional"
                      />
                    ) : (
                      <div>
                        {liability.monthly_payment ? (
                          <>
                            <span className="fw-semibold">{formatCurrency(liability.monthly_payment, liability.currency)}</span>
                            <br />
                            <small className="text-muted">₹{liability.monthly_payment_in_inr.toFixed(2)}</small>
                          </>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="d-flex flex-column align-items-center">
                      <div className="progress mb-1" style={{ width: '80px', height: '8px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${liability.completion_percentage}%` }}
                        ></div>
                      </div>
                      <small className="fw-bold">{liability.completion_percentage.toFixed(1)}%</small>
                      <small className="text-muted">
                        ₹{liability.paid_amount_in_inr.toFixed(2)} paid
                      </small>
                    </div>
                  </td>
                  <td>
                    {editingLiability === liability.id ? (
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editFormData.next_payment_date}
                        onChange={(e) => setEditFormData({ ...editFormData, next_payment_date: e.target.value })}
                      />
                    ) : (
                      <div>
                        {liability.next_payment_date ? (
                          <>
                            <div>{new Date(liability.next_payment_date).toLocaleDateString()}</div>
                            {(() => {
                              const dueDate = new Date(liability.next_payment_date);
                              const today = new Date();
                              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (daysUntilDue < 0) {
                                return <small className="text-danger fw-bold">OVERDUE</small>;
                              } else if (daysUntilDue <= 7) {
                                return <small className="text-warning fw-bold">DUE SOON</small>;
                              }
                              return <small className="text-muted">{daysUntilDue} days</small>;
                            })()}
                          </>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {editingLiability === liability.id ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEditSave(liability.id)}
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
                          onClick={() => handleEditStart(liability)}
                          title="Edit liability"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(liability.id)}
                          title="Delete liability"
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
          <i className="bi bi-credit-card-2-back me-2 text-danger"></i>
          Liabilities & Debts
          {(selectedType || selectedStatus) && (
            <span className="text-muted">
              {selectedType && ` - ${selectedType}`}
              {selectedStatus && ` - ${selectedStatus}`}
            </span>
          )}
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
                id="upcomingView"
                checked={viewMode === 'upcoming'}
                onChange={() => setViewMode('upcoming')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="upcomingView">
                <i className="bi bi-calendar-event me-1"></i>
                Upcoming
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
            className="btn btn-danger"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'Add Liability'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Filters */}
      {viewMode === 'list' && liabilities.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="text-muted me-2">Filter by:</span>
              
              {/* Type Filter */}
              <div className="d-flex gap-1">
                <button
                  className={`btn btn-sm ${selectedType === null ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedType(null)}
                >
                  All Types ({liabilities.length})
                </button>
                {liabilityTypes.map(([value, label]) => {
                  const count = liabilities.filter(liability => liability.type === value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={value}
                      className={`btn btn-sm ${selectedType === value ? 'btn-info' : 'btn-outline-info'}`}
                      onClick={() => setSelectedType(value)}
                    >
                      <i className={`${getTypeIcon(value)} me-1`}></i>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              <span className="text-muted mx-2">|</span>

              {/* Status Filter */}
              <div className="d-flex gap-1">
                <button
                  className={`btn btn-sm ${selectedStatus === null ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedStatus(null)}
                >
                  All Status
                </button>
                {liabilityStatuses.map(([value, label]) => {
                  const count = liabilities.filter(liability => liability.status === value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={value}
                      className={`btn btn-sm ${selectedStatus === value ? `btn-${getStatusColor(value)}` : `btn-outline-${getStatusColor(value)}`}`}
                      onClick={() => setSelectedStatus(value)}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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

      {/* Add Liability Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Liability
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Liability Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Home Loan, Car Loan, Credit Card Debt"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="type" className="form-label">Liability Type</label>
                  <select
                    className="form-select"
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select type...</option>
                    {liabilityTypes.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="principal_amount" className="form-label">Principal Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="principal_amount"
                    value={formData.principal_amount}
                    onChange={e => setFormData({ ...formData, principal_amount: e.target.value })}
                    placeholder="Original loan amount"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="current_balance" className="form-label">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="current_balance"
                    value={formData.current_balance}
                    onChange={e => setFormData({ ...formData, current_balance: e.target.value })}
                    placeholder="Outstanding amount"
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
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="interest_rate" className="form-label">Interest Rate (% per year)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="interest_rate"
                    value={formData.interest_rate}
                    onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                    placeholder="e.g., 8.5"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="monthly_payment" className="form-label">Monthly Payment (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={e => setFormData({ ...formData, monthly_payment: e.target.value })}
                    placeholder="Monthly payment amount"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    {liabilityStatuses.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="start_date" className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="start_date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="due_date" className="form-label">Final Due Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="due_date"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="next_payment_date" className="form-label">Next Payment Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="next_payment_date"
                    value={formData.next_payment_date}
                    onChange={e => setFormData({ ...formData, next_payment_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="lender_name" className="form-label">Lender/Bank Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lender_name"
                    value={formData.lender_name}
                    onChange={e => setFormData({ ...formData, lender_name: e.target.value })}
                    placeholder="e.g., HDFC Bank, SBI, ICICI Bank"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this liability..."
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-danger">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Liability
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
          <p className="mt-2 text-muted">Loading liability data...</p>
        </div>
      ) : liabilities.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-credit-card-2-back text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No liabilities yet</h3>
          <p className="text-muted">Start tracking your loans and debts by adding your first liability!</p>
          <button
            className="btn btn-danger"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Your First Liability
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="row mb-4">
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
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Principal</h6>
                        <h4 className="mb-0">₹{summary.total_principal_inr.toFixed(2)}</h4>
                      </div>
                      <i className="bi bi-bank" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
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
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Liabilities</h6>
                        <h4 className="mb-0">{getFilteredLiabilities().length}</h4>
                      </div>
                      <i className="bi bi-list-ul" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Display */}
          {viewMode === 'upcoming' ? renderUpcomingView() : 
           viewMode === 'summary' ? renderSummaryView() : renderListView()}
        </>
      )}
    </Layout>
  );
};

export default LiabilitiesPage;