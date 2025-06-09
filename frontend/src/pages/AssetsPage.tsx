import { useEffect, useState } from 'react';
import { 
  fetchAssets, 
  createAsset, 
  deleteAsset, 
  updateAsset,
  getAssetTypes,
  getAssetSummary
} from '../api/assets';
import { getCurrentRates, updateExchangeRate, formatCurrency, convertCurrency } from '../api/exchangeRates';
import { Asset } from '../types';
import Layout from '../components/Layout';

const AssetsPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [assetTypes, setAssetTypes] = useState<Array<[string, string]>>([]);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tiles' | 'list' | 'summary'>('tiles');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    value: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    value: '',
    currency: 'INR',
    purchase_date: '',
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
      const [assetsData, typesData, ratesData, summaryData] = await Promise.all([
        fetchAssets(),
        getAssetTypes(),
        getCurrentRates(),
        getAssetSummary(),
      ]);
      
      setAssets(assetsData);
      setAssetTypes(typesData);
      setExchangeRates(ratesData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load asset data');
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
        value: parseFloat(formData.value),
        currency: formData.currency,
        purchase_date: formData.purchase_date || undefined,
        notes: formData.notes,
      };

      await createAsset(data);
      setFormData({
        name: '',
        type: '',
        value: '',
        currency: 'INR',
        purchase_date: '',
        notes: '',
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to create asset');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id);
        load();
      } catch (err: any) {
        console.error(err);
        setError('Failed to delete asset');
      }
    }
  };

  const handleEditStart = (asset: Asset) => {
    setEditingAsset(asset.id);
    setEditFormData({
      value: asset.value.toString(),
      notes: asset.notes || '',
    });
  };

  const handleEditCancel = () => {
    setEditingAsset(null);
    setEditFormData({ value: '', notes: '' });
  };

  const handleEditSave = async (assetId: number) => {
    try {
      const value = parseFloat(editFormData.value);
      
      if (isNaN(value) || value <= 0) {
        setError('Value must be a positive number');
        return;
      }

      await updateAsset(assetId, {
        value: value,
        notes: editFormData.notes,
      });
      
      setEditingAsset(null);
      setEditFormData({ value: '', notes: '' });
      setError(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update asset');
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
      'property': 'bi-house-door',
      'vehicle': 'bi-car-front',
      'jewelry': 'bi-gem',
      'electronics': 'bi-laptop',
      'furniture': 'bi-chair',
      'art': 'bi-palette',
      'equipment': 'bi-tools',
      'other': 'bi-box'
    };
    return icons[type] || 'bi-box';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'property': 'primary',
      'vehicle': 'success',
      'jewelry': 'warning',
      'electronics': 'info',
      'furniture': 'secondary',
      'art': 'danger',
      'equipment': 'dark',
      'other': 'light'
    };
    return colors[type] || 'light';
  };

  const getFilteredAssets = () => {
    if (selectedType) {
      return assets.filter(asset => asset.type === selectedType);
    }
    return assets;
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
  };

  const renderSummaryView = () => {
    if (!summary) return null;

    return (
      <div>
        {/* Type Summary */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-pie-chart me-2"></i>
              Assets by Type
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
                            <i className={`${getTypeIcon(type.toLowerCase())} me-2 text-${getTypeColor(type.toLowerCase())}`}></i>
                            {type}
                          </h6>
                          <p className="card-text mb-0">
                            <strong>₹{data.total_value_inr.toFixed(2)}</strong>
                            <br />
                            <small className="text-muted">{data.count} assets</small>
                          </p>
                        </div>
                        <div className="text-end">
                          {Object.entries(data.currencies).map(([currency, value]: [string, any]) => (
                            <div key={currency} className="small text-muted">
                              {formatCurrency(value, currency)}
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
              Assets by Currency
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
                        <strong>{formatCurrency(data.total_value, currency)}</strong>
                        <br />
                        <small className="text-muted">{data.count} assets</small>
                        {currency !== 'INR' && (
                          <>
                            <br />
                            <small className="text-success">
                              ≈ ₹{convertCurrency(data.total_value, currency, 'INR', exchangeRates).toFixed(2)}
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

  const renderTileView = () => (
    <div className="row">
      {getFilteredAssets().map((asset) => (
        <div key={asset.id} className="col-md-6 col-lg-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1">{asset.name}</h5>
                  <span className={`badge bg-${getTypeColor(asset.type)}`}>
                    <i className={`${getTypeIcon(asset.type)} me-1`}></i>
                    {asset.type_display}
                  </span>
                </div>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleEditStart(asset)}
                    title="Edit asset"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(asset.id)}
                    title="Delete asset"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              {editingAsset === asset.id ? (
                <div className="mb-3">
                  <div className="mb-2">
                    <label className="form-label small">Current Value</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={editFormData.value}
                      onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Notes..."
                    />
                  </div>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleEditSave(asset.id)}
                    >
                      <i className="bi bi-check"></i>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleEditCancel}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Current Value:</span>
                    <span className="fw-bold">{formatCurrency(asset.value, asset.currency)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Value (INR):</span>
                    <span className="fw-bold text-success">₹{asset.value_in_inr.toFixed(2)}</span>
                  </div>
                  {asset.purchase_date && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Purchase Date:</span>
                      <span>{new Date(asset.purchase_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {asset.notes && (
                    <div className="mt-2">
                      <small className="text-muted">{asset.notes}</small>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="card-footer text-muted">
              <small>
                <i className="bi bi-calendar me-1"></i>
                Added {new Date(asset.created_at).toLocaleDateString()}
              </small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th className="text-end">Current Value</th>
                <th className="text-end">Value (INR)</th>
                <th>Purchase Date</th>
                <th>Notes</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredAssets().map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div>
                      <div className="fw-semibold">{asset.name}</div>
                      <small className="text-muted">
                        Added {new Date(asset.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${getTypeColor(asset.type)}`}>
                      <i className={`${getTypeIcon(asset.type)} me-1`}></i>
                      {asset.type_display}
                    </span>
                  </td>
                  <td className="text-end">
                    {editingAsset === asset.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '120px' }}
                        value={editFormData.value}
                        onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <div>
                        <span className="fw-semibold">{formatCurrency(asset.value, asset.currency)}</span>
                        <br />
                        <small className="text-muted">{asset.currency_display}</small>
                      </div>
                    )}
                  </td>
                  <td className="text-end fw-semibold text-success">
                    ₹{asset.value_in_inr.toFixed(2)}
                  </td>
                  <td>
                    {asset.purchase_date ? (
                      new Date(asset.purchase_date).toLocaleDateString()
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {editingAsset === asset.id ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="Notes..."
                      />
                    ) : (
                      <div style={{ maxWidth: '200px' }}>
                        {asset.notes ? (
                          <small className="text-muted">{asset.notes}</small>
                        ) : (
                          <small className="text-muted fst-italic">No notes</small>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {editingAsset === asset.id ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEditSave(asset.id)}
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
                          onClick={() => handleEditStart(asset)}
                          title="Edit asset"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(asset.id)}
                          title="Delete asset"
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
          <i className="bi bi-house me-2 text-info"></i>
          Assets
          {selectedType && <span className="text-muted"> - {selectedType}</span>}
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
                id="tilesView"
                checked={viewMode === 'tiles'}
                onChange={() => setViewMode('tiles')}
              />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="tilesView">
                <i className="bi bi-grid-3x3-gap me-1"></i>
                Tiles
              </label>

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
            className="btn btn-info"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            {showForm ? 'Cancel' : 'Add Asset'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Type Filter */}
      {viewMode !== 'summary' && assets.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="text-muted me-2">Filter by type:</span>
              <button
                className={`btn btn-sm ${selectedType === null ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleTypeFilter(null)}
              >
                All Assets ({assets.length})
              </button>
              {assetTypes.map(([value, label]) => {
                const count = assets.filter(asset => asset.type === value).length;
                if (count === 0) return null;
                return (
                  <button
                    key={value}
                    className={`btn btn-sm ${selectedType === value ? 'btn-info' : 'btn-outline-info'}`}
                    onClick={() => handleTypeFilter(value)}
                  >
                    <i className={`${getTypeIcon(value)} me-1`}></i>
                    {label} ({count})
                  </button>
                );
              })}
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

      {/* Add Asset Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Asset
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Asset Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Honda City, Gold Necklace, MacBook Pro"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="type" className="form-label">Asset Type</label>
                  <select
                    className="form-select"
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select type...</option>
                    {assetTypes.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="value" className="form-label">Current Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="value"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
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
                  <label htmlFor="purchase_date" className="form-label">Purchase Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="purchase_date"
                    value={formData.purchase_date}
                    onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
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
                  placeholder="Additional details about this asset..."
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-info">
                  <i className="bi bi-check-circle me-1"></i>
                  Save Asset
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
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading asset data...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-house text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No assets yet</h3>
          <p className="text-muted">Start tracking your assets by adding your first one!</p>
          <button
            className="btn btn-info"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Your First Asset
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Assets</h6>
                        <h4 className="mb-0">{selectedType ? getFilteredAssets().length : assets.length}</h4>
                      </div>
                      <i className="bi bi-house" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Value</h6>
                        <h4 className="mb-0">₹{getFilteredAssets().reduce((sum, asset) => sum + asset.value_in_inr, 0).toFixed(2)}</h4>
                      </div>
                      <i className="bi bi-currency-rupee" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Asset Types</h6>
                        <h4 className="mb-0">{selectedType ? 1 : new Set(assets.map(a => a.type)).size}</h4>
                      </div>
                      <i className="bi bi-collection" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Avg Value</h6>
                        <h4 className="mb-0">₹{getFilteredAssets().length > 0 ? (getFilteredAssets().reduce((sum, asset) => sum + asset.value_in_inr, 0) / getFilteredAssets().length).toFixed(2) : '0.00'}</h4>
                      </div>
                      <i className="bi bi-calculator" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Display */}
          {viewMode === 'summary' ? renderSummaryView() : 
           viewMode === 'tiles' ? renderTileView() : renderListView()}
        </>
      )}
    </Layout>
  );
};

export default AssetsPage;