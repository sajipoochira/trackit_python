import { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, deleteInvestment } from '../api/investments';
import { Investment } from '../types';
import Layout from '../components/Layout';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    current_value: '',
    purchase_value: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvestments();
      setInvestments(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load investments');
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
        current_value: parseFloat(formData.current_value),
        purchase_value: parseFloat(formData.purchase_value),
      };

      await createInvestment(data);
      setFormData({ name: '', type: '', current_value: '', purchase_value: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create investment');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteInvestment(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete investment');
      }
    }
  };

  const calculateGainLoss = (current: number, purchase: number) => {
    const diff = current - purchase;
    const percentage = ((diff / purchase) * 100).toFixed(2);
    return { amount: diff, percentage };
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-graph-up me-2 text-primary"></i>
          Investments
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {showForm ? 'Cancel' : 'Add Investment'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Investment
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Investment Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Apple Stock"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="type" className="form-label">Investment Type</label>
                  <select
                    className="form-select"
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="Stock">Stock</option>
                    <option value="Bond">Bond</option>
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="ETF">ETF</option>
                    <option value="Cryptocurrency">Cryptocurrency</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="purchase_value" className="form-label">Purchase Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="purchase_value"
                    value={formData.purchase_value}
                    onChange={e => setFormData({ ...formData, purchase_value: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="current_value" className="form-label">Current Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="current_value"
                    value={formData.current_value}
                    onChange={e => setFormData({ ...formData, current_value: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Investment
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading investments...</p>
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-graph-up text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No investments yet</h3>
          <p className="text-muted">Start tracking your investments by adding your first one!</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Your First Investment
          </button>
        </div>
      ) : (
        <div className="row">
          {investments.map((investment) => {
            const gainLoss = calculateGainLoss(investment.current_value, investment.purchase_value);
            const isProfit = gainLoss.amount >= 0;
            
            return (
              <div key={investment.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{investment.name}</h5>
                        <span className="badge bg-secondary">{investment.type}</span>
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(investment.id)}
                        title="Delete investment"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Purchase Value:</span>
                        <span className="fw-bold">${investment.purchase_value.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Current Value:</span>
                        <span className="fw-bold">${investment.current_value.toFixed(2)}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Gain/Loss:</span>
                        <div className="text-end">
                          <div className={`fw-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {isProfit ? '+' : ''}${gainLoss.amount.toFixed(2)}
                          </div>
                          <small className={isProfit ? 'text-success' : 'text-danger'}>
                            ({isProfit ? '+' : ''}{gainLoss.percentage}%)
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${isProfit ? 'bg-success' : 'bg-danger'}`}
                        style={{ width: `${Math.min(Math.abs(parseFloat(gainLoss.percentage)), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="card-footer text-muted">
                    <small>
                      <i className="bi bi-calendar me-1"></i>
                      Added {new Date(investment.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default InvestmentsPage;