// Centralized page navigation and section visibility

(function () {
  function hideAllSections() {
    document.querySelectorAll('.content-section').forEach((el) => {
      el.style.display = 'none';
    });
  }

  function setActive(linkId) {
    const links = [
      'navDashboardLink',
      'navInvestmentsLink',
      'navIncomeLink',
      'navExpensesLink',
      'navAssetsLink',
      'navLiabilitiesLink',
    ];
    links.forEach((id) => {
      const a = document.getElementById(id);
      if (!a) return;
      if (id === linkId) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  function showSection(sectionId, linkId) {
    // Only switch if main app is visible
    const mainContent = document.getElementById('mainContent');
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen && loginScreen.style.display !== 'none') {
      // not logged in
      return;
    }
    hideAllSections();
    const el = document.getElementById(sectionId);
    if (el) el.style.display = 'block';
    setActive(linkId);
  }

  // Expose global functions used by HTML
  window.showDashboard = function () {
    showSection('dashboardContent', 'navDashboardLink');
    if (typeof refreshDashboard === 'function') {
      try { refreshDashboard(); } catch (_) {}
    }
    window.location.hash = '#dashboard';
  };

  window.showInvestments = function () {
    showSection('investmentsContent', 'navInvestmentsLink');
    window.location.hash = '#investments';
  };

  window.showIncome = function () {
    showSection('incomeContent', 'navIncomeLink');
    window.location.hash = '#income';
  };

  window.showExpenses = function () {
    showSection('expensesContent', 'navExpensesLink');
    window.location.hash = '#expenses';
  };

  window.showAssets = function () {
    showSection('assetsContent', 'navAssetsLink');
    window.location.hash = '#assets';
  };

  window.showLiabilities = function () {
    showSection('liabilitiesContent', 'navLiabilitiesLink');
    window.location.hash = '#liabilities';
  };

  function routeFromHash() {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('invest')) return window.showInvestments();
    if (hash.includes('income')) return window.showIncome();
    if (hash.includes('expense')) return window.showExpenses();
    if (hash.includes('asset')) return window.showAssets();
    if (hash.includes('liabil')) return window.showLiabilities();
    return window.showDashboard();
  }

  window.addEventListener('hashchange', routeFromHash);

  document.addEventListener('DOMContentLoaded', function () {
    // If already authenticated, respect hash; otherwise auth.js will show login
    const token = localStorage.getItem('access_token');
    if (token) routeFromHash();
  });
})();

