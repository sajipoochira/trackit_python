// Assets functionality

let assets = [];

async function showAssets() {
    hideAllSections();
    document.getElementById('assetsContent').style.display = 'block';
    updateActiveNav('assets');
    await loadAssets();
}

async function loadAssets() {
    showLoading();
    
    try {
        assets = await api.getAssets() || [];
        renderAssets();
    } catch (error) {
        console.error('Failed to load assets:', error);
        showError('Failed to load assets');
    } finally {
        hideLoading();
    }
}

function renderAssets() {
    renderAssetSummary();
    renderAssetsList();
}

function renderAssetSummary() {
    const summaryContainer = document.getElementById('assetSummary');
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.value_in_inr, 0);
    const bankAccounts = assets.filter(asset => asset.type === 'bank_account');
    const types = [...new Set(assets.map(asset => asset.type))];
    
    summaryContainer.innerHTML = `
        <div class="col-md-3">
            <div class="summary-card info">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Assets</h6>
                        <h4 class="mb-0">${assets.length}</h4>
                    </div>
                    <i class="bi bi-house" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card success">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Total Value</h6>
                        <h4 class="mb-0">${formatCurrency(totalValue)}</h4>
                    </div>
                    <i class="bi bi-currency-rupee" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card warning">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Asset Types</h6>
                        <h4 class="mb-0">${types.length}</h4>
                    </div>
                    <i class="bi bi-collection" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="summary-card">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">Bank Accounts</h6>
                        <h4 class="mb-0">${bankAccounts.length}</h4>
                    </div>
                    <i class="bi bi-bank" style="font-size: 2rem; opacity: 0.7;"></i>
                </div>
            </div>
        </div>
    `;
}

function renderAssetsList() {
    const listContainer = document.getElementById('assetsList');
    
    if (assets.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-house text-muted" style="font-size: 4rem;"></i>
                <h3 class="text-muted mt-3">No assets yet</h3>
                <p class="text-muted">Start tracking your assets and bank accounts by adding your first one!</p>
                <button class="btn btn-info" data-bs-toggle="modal" data-bs-target="#addAssetModal">
                    <i class="bi bi-plus-circle me-1"></i>
                    Add Your First Asset
                </button>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = `
        <div class="row">
            ${assets.map(asset => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="card-title mb-1">${asset.name}</h5>
                                    <span class="badge bg-${getAssetTypeColor(asset.type)}">
                                        <i class="${getAssetTypeIcon(asset.type)} me-1"></i>
                                        ${asset.type_display}
                                    </span>
                                </div>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" onclick="editAsset(${asset.id})">Edit</a></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteAsset(${asset.id})">Delete</a></li>
                                    </ul>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Current Value:</span>
                                    <span class="fw-bold">${formatCurrency(asset.value, asset.currency)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Value (INR):</span>
                                    <span class="fw-bold text-success">${formatCurrency(asset.value_in_inr)}</span>
                                </div>
                                ${asset.purchase_date ? `
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="text-muted">Purchase Date:</span>
                                        <span>${formatDate(asset.purchase_date)}</span>
                                    </div>
                                ` : ''}
                                
                                ${asset.type === 'bank_account' ? `
                                    ${asset.bank_name ? `
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Bank:</span>
                                            <span>${asset.bank_name}</span>
                                        </div>
                                    ` : ''}
                                    ${asset.account_number ? `
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Account:</span>
                                            <span>****${asset.account_number.slice(-4)}</span>
                                        </div>
                                    ` : ''}
                                    ${asset.account_type ? `
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Type:</span>
                                            <span>${asset.account_type}</span>
                                        </div>
                                    ` : ''}
                                ` : ''}
                                
                                ${asset.notes ? `
                                    <div class="mt-2">
                                        <small class="text-muted">${asset.notes}</small>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-footer text-muted">
                            <small>
                                <i class="bi bi-calendar me-1"></i>
                                Added ${formatDate(asset.created_at)}
                            </small>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getAssetTypeIcon(type) {
    const icons = {
        'property': 'bi-house-door',
        'vehicle': 'bi-car-front',
        'jewelry': 'bi-gem',
        'electronics': 'bi-laptop',
        'furniture': 'bi-chair',
        'art': 'bi-palette',
        'equipment': 'bi-tools',
        'bank_account': 'bi-bank',
        'other': 'bi-box'
    };
    return icons[type] || 'bi-box';
}

function getAssetTypeColor(type) {
    const colors = {
        'property': 'primary',
        'vehicle': 'success',
        'jewelry': 'warning',
        'electronics': 'info',
        'furniture': 'secondary',
        'art': 'danger',
        'equipment': 'dark',
        'bank_account': 'success',
        'other': 'light'
    };
    return colors[type] || 'light';
}

async function saveAsset() {
    const form = document.getElementById('addAssetForm');
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        type: formData.get('type'),
        value: parseFloat(formData.get('value')),
        currency: formData.get('currency'),
        purchase_date: formData.get('purchase_date') || null,
        notes: formData.get('notes') || ''
    };
    
    try {
        await api.createAsset(data);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAssetModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload assets
        await loadAssets();
        
        showSuccess('Asset added successfully');
    } catch (error) {
        console.error('Failed to save asset:', error);
        showError('Failed to save asset');
    }
}

async function deleteAsset(id) {
    if (confirm('Are you sure you want to delete this asset?')) {
        try {
            await api.deleteAsset(id);
            await loadAssets();
            showSuccess('Asset deleted successfully');
        } catch (error) {
            console.error('Failed to delete asset:', error);
            showError('Failed to delete asset');
        }
    }
}

function editAsset(id) {
    // TODO: Implement edit functionality
    showError('Edit functionality coming soon');
}