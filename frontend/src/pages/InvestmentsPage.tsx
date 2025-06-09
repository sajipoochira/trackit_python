import { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, deleteInvestment, updateInvestment, getLTP } from '../api/investments';
import { Investment } from '../types';
import Layout from '../components/Layout';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: '',
    qty: '',
    current_value: '',
    purchase_value: '',
  });

  const investmentTypes = [
    'Stock',
    'Bond',
    'Mutual Fund',
    'ETF',
    'Cryptocurrency',
    'Real Estate',
    'Gold',
    'Business',
    'Other'
  ];

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
        symbol: formData.symbol || undefined,
        type: formData.type,
        qty: parseInt(formData.qty),
        current_value: parseFloat(formData.current_value),
        purchase_value: parseFloat(formData.purchase_value),
      };

      await createInvestment(data);
      setFormData({ name: '', symbol: '', type: '', qty: '', current_value: '', purchase_value: '' });
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

  const handleRefreshPrices = async () => {
    setPriceUpdateLoading(true);
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const investment of investments) {
      if (investment.symbol && investment.type === 'Stock') {
        try {
          const priceData = await getLTP(investment.symbol);
          const newCurrentValue = priceData.ltp * investment.qty;
          
          await updateInvestment(investment.id, {
            current_value: newCurrentValue
          });
          updatedCount++;
        } catch (err: any) {
          console.error(`Failed to update price for ${investment.symbol}:`, err);
          errorCount++;
          errors.push(`${investment.symbol}: ${err.response?.data?.error || err.message}`);
        }
      }
    }

    setPriceUpdateLoading(false);
    
    if (updatedCount > 0) {
      load(); // Reload to show updated prices
    }

    if (errorCount === 0 && updatedCount > 0) {
      alert(`Successfully updated ${updatedCount} stock prices!`);
    } else if (updatedCount === 0 && errorCount === 0) {
      alert('No stocks with symbols found to update');
    } else {
      const message = `Updated ${updatedCount} prices successfully.${errorCount > 0 ? `\n\nErrors (${errorCount}):\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}` : ''}`;
      alert(message);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCsvFile(file);
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const normalize = (h: string) => h.trim().toLowerCase().replace(/[^a-z]/g, '');

      const headers = lines[0].split(',').map(h => normalize(h));
      const expectedHeaders = ['name', 'type', 'qty', 'purchasevalue', 'currentvalue'];
      
      const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));

      if (!hasAllHeaders) {
        setError('CSV must have columns: name, type, qty, purchase_value, current_value (symbol is optional)');
        return;
      }

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, i) => {
          if (header.includes('name')) row.name = values[i];
          else if (header.includes('symbol')) row.symbol = values[i];
          else if (header.includes('type')) row.type = values[i];
          else if (header.includes('qty')) row.qty = parseInt(values[i]) || 1;
          else if (header.includes('purchase')) row.purchase_value = parseFloat(values[i]) || 0;
          else if (header.includes('current')) row.current_value = parseFloat(values[i]) || 0;
        });

        row.id = `preview-${index}`;
        return row;
      }).filter(row => row.name && row.type);

      setCsvPreview(data);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (csvPreview.length === 0) {
      setError('No valid data to upload');
      return;
    }

    setUploadLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of csvPreview) {
      try {
        await createInvestment({
          name: item.name,
          symbol: item.symbol || undefined,
          type: item.type,
          qty: item.qty,
          purchase_value: item.purchase_value,
          current_value: item.current_value,
        });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error('Failed to create investment:', item.name, err);
      }
    }

    setUploadLoading(false);

    if (errorCount === 0) {
      setError(null);
      alert(`Successfully uploaded ${successCount} investments!`);
    } else {
      setError(`Uploaded ${successCount} investments, ${errorCount} failed`);
    }

    setCsvFile(null);
    setCsvPreview([]);
    setShowBulkUpload(false);
    load();
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      'name,symbol,type,qty,purchase_value,current_value',
      'Apple Stock,AAPL,Stock,10,150.00,175.50',
      'Gold Investment,,Gold,5,1800.00,1950.00',
      'Tech Startup,,Business,1,10000.00,12500.00',
      'Bitcoin,,Cryptocurrency,0.5,45000.00,42000.00'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_investments.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateGainLoss = (current: number, purchase: number) => {
    const diff = current - purchase;
    const percentage = ((diff / purchase) * 100).toFixed(2);
    return { amount: diff, percentage };
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Stock': 'bi-graph-up',
      'Bond': 'bi-bank',
      'Mutual Fund': 'bi-pie-chart',
      'ETF': 'bi-collection',
      'Cryptocurrency': 'bi-currency-bitcoin',
      'Real Estate': 'bi-house',
      'Gold': 'bi-gem',
      'Business': 'bi-building',
      'Other': 'bi-question-circle'
    };
    return icons[type] || 'bi-question-circle';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Stock': 'primary',
      'Bond': 'success',
      'Mutual Fund': 'info',
      'ETF': 'warning',
      'Cryptocurrency': 'danger',
      'Real Estate': 'dark',
      'Gold': 'warning',
      'Business': 'success',
      'Other': 'secondary'
    };
    return colors[type] || 'secondary';
  };

  const hasStocksWithSymbols = investments.some(inv => inv.symbol && inv.type === 'Stock');

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
        <div className="d-flex gap-2">
          {hasStocksWithSymbols && (
            <button
              className="btn btn-outline-success"
              onClick={handleRefreshPrices}
              disabled={priceUpdateLoading}
            >
              {priceUpdateLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh Prices
                </>
              )}
            </button>
          )}
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowBulkUpload(!showBulkUpload)}
          >
            <i className="bi bi-upload me-1"></i>
            Bulk Upload
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'Add Investment'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {showBulkUpload && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-upload me-2"></i>
              Bulk Upload Investments
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Upload CSV File</h6>
                <p className="text-muted small">
                  Upload a CSV file with columns: name, type, qty, purchase_value, current_value, symbol (optional for stocks)
                </p>
                <input
                  type="file"
                  className="form-control mb-3"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                />
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={downloadSampleCsv}
                >
                  <i className="bi bi-download me-1"></i>
                  Download Sample CSV
                </button>
              </div>
              <div className="col-md-6">
                <h6>Supported Investment Types</h6>
                <div className="d-flex flex-wrap gap-1">
                  {investmentTypes.map(type => (
                    <span key={type} className={`badge bg-${getTypeColor(type)} me-1 mb-1`}>
                      <i className={`${getTypeIcon(type)} me-1`}></i>
                      {type}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    For stocks, add a symbol column to enable automatic price updates
                  </small>
                </div>
              </div>
            </div>

            {csvPreview.length > 0 && (
              <div className="mt-4">
                <h6>Preview ({csvPreview.length} investments)</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>QTY</th>
                        <th>Purchase Value</th>
                        <th>Current Value</th>
                        <th>Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 5).map((item, index) => {
                        const gainLoss = calculateGainLoss(item.current_value, item.purchase_value);
                        const isProfit = gainLoss.amount >= 0;
                        return (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>
                              {item.symbol ? (
                                <span className="badge bg-info">{item.symbol}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge bg-${getTypeColor(item.type)}`}>
                                {item.type}
                              </span>
                            </td>
                            <td>{item.qty}</td>
                            <td>₹{item.purchase_value.toFixed(2)}</td>
                            <td>₹{item.current_value.toFixed(2)}</td>
                            <td className={isProfit ? 'text-success' : 'text-danger'}>
                              {isProfit ? '+' : ''}₹{gainLoss.amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {csvPreview.length > 5 && (
                    <p className="text-muted small">... and {csvPreview.length - 5} more</p>
                  )}
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-success"
                    onClick={handleBulkUpload}
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>
                        Upload {csvPreview.length} Investments
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvPreview([]);
                      setShowBulkUpload(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
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
                    placeholder="e.g., Apple Stock, Gold Coins, Tech Startup"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="symbol" className="form-label">
                    Symbol 
                    <small className="text-muted">(optional, for stocks only)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="symbol"
                    value={formData.symbol}
                    onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g., RELIANCE, TCS, INFY"
                  />
                  <small className="text-muted">
                    Add NSE symbol to enable automatic price updates for stocks
                  </small>
                </div>
              </div>
              <div className="row">
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
                    {investmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="qty" className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="1"
                    className="form-control"
                    id="qty"
                    value={formData.qty}
                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="purchase_value" className="form-label">Purchase Value (₹)</label>
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
                  <label htmlFor="current_value" className="form-label">Current Value (₹)</label>
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
          <p className="text-muted">Start tracking your investments by adding your first one or uploading a CSV file!</p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add Your First Investment
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowBulkUpload(true)}
            >
              <i className="bi bi-upload me-1"></i>
              Upload CSV
            </button>
          </div>
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
                        <div className="d-flex gap-2 align-items-center">
                          <span className={`badge bg-${getTypeColor(investment.type)}`}>
                            <i className={`${getTypeIcon(investment.type)} me-1`}></i>
                            {investment.type}
                          </span>
                          {investment.symbol && (
                            <span className="badge bg-info">
                              <i className="bi bi-graph-up me-1"></i>
                              {investment.symbol}
                            </span>
                          )}
                        </div>
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
                        <span className="text-muted">Quantity:</span>
                        <span className="fw-bold">{investment.qty}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Purchase Value:</span>
                        <span className="fw-bold">₹{investment.purchase_value.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Current Value:</span>
                        <span className="fw-bold">₹{investment.current_value.toFixed(2)}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Gain/Loss:</span>
                        <div className="text-end">
                          <div className={`fw-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
                            {isProfit ? '+' : ''}₹{gainLoss.amount.toFixed(2)}
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
                      {investment.last_updated && (
                        <>
                          <br />
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Updated {new Date(investment.last_updated).toLocaleDateString()}
                        </>
                      )}
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