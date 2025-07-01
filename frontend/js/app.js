// Main application initialization and navigation

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates for forms
    setDefaultDates();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Check authentication status
    checkAuth();
});

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set default dates for all date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value && input.name !== 'expected_return_date' && input.name !== 'due_date') {
            input.value = today;
        }
    });
}

function initializeTooltips() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Navigation functions
function showDashboard() {
    if (typeof window.showDashboard === 'function') {
        window.showDashboard();
    }
}

function showInvestments() {
    if (typeof window.showInvestments === 'function') {
        window.showInvestments();
    }
}

function showIncome() {
    if (typeof window.showIncome === 'function') {
        window.showIncome();
    }
}

function showExpenses() {
    if (typeof window.showExpenses === 'function') {
        window.showExpenses();
    }
}

function showAssets() {
    if (typeof window.showAssets === 'function') {
        window.showAssets();
    }
}

function showLiabilities() {
    if (typeof window.showLiabilities === 'function') {
        window.showLiabilities();
    }
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Number formatting
function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

// Date formatting
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showError('An unexpected error occurred. Please refresh the page and try again.');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showError('A network error occurred. Please check your connection and try again.');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + D for Dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        showDashboard();
    }
    
    // Ctrl/Cmd + I for Investments
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        showInvestments();
    }
    
    // Ctrl/Cmd + E for Expenses
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        showExpenses();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
});

// Auto-save form data to localStorage (for better UX)
function autoSaveForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
}

function restoreFormData(formId) {
    const savedData = localStorage.getItem(`form_${formId}`);
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        const form = document.getElementById(formId);
        if (!form) return;
        
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && data[key]) {
                field.value = data[key];
            }
        });
    } catch (e) {
        console.error('Failed to restore form data:', e);
    }
}

function clearSavedFormData(formId) {
    localStorage.removeItem(`form_${formId}`);
}

// Add auto-save functionality to all forms
document.addEventListener('input', function(e) {
    if (e.target.form && e.target.form.id) {
        autoSaveForm(e.target.form.id);
    }
});

// Clear saved data when forms are successfully submitted
document.addEventListener('submit', function(e) {
    if (e.target.id) {
        setTimeout(() => {
            clearSavedFormData(e.target.id);
        }, 1000); // Clear after successful submission
    }
});

// Restore form data when modals are opened
document.addEventListener('shown.bs.modal', function(e) {
    const modal = e.target;
    const form = modal.querySelector('form');
    if (form && form.id) {
        restoreFormData(form.id);
    }
});

// Performance monitoring
let pageLoadTime = performance.now();
window.addEventListener('load', function() {
    pageLoadTime = performance.now() - pageLoadTime;
    console.log(`Page loaded in ${pageLoadTime.toFixed(2)}ms`);
});

// Service worker registration for offline support (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(function(registration) {
        //         console.log('ServiceWorker registration successful');
        //     })
        //     .catch(function(err) {
        //         console.log('ServiceWorker registration failed');
        //     });
    });
}

console.log('TrackIt Finance Tracker initialized successfully');