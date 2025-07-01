// Authentication handling

function checkAuth() {
    const token = localStorage.getItem('access_token');
    
    if (token) {
        showMainApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainNav').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainNav').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
    
    // Load dashboard by default
    showDashboard();
}

// Login form handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    // Show loading state
    loginBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Signing in...
    `;
    loginBtn.disabled = true;
    loginError.classList.add('d-none');
    
    try {
        await api.login(username, password);
        showMainApp();
    } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('loginErrorText').textContent = 'Invalid credentials. Please try again.';
        loginError.classList.remove('d-none');
    } finally {
        // Reset button state
        loginBtn.innerHTML = `
            <i class="bi bi-box-arrow-in-right me-2"></i>
            Sign In
        `;
        loginBtn.disabled = false;
    }
});

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
        showLoginScreen();
    }
}

// Initialize auth check when page loads
document.addEventListener('DOMContentLoaded', checkAuth);