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
    // Load current user display
    loadCurrentUser();
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
        await loadCurrentUser();
    } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('loginErrorText').textContent = error && error.message ? error.message : 'Invalid credentials. Please try again.';
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

// Load current user and show in navbar
async function loadCurrentUser() {
    try {
        const me = await api.getCurrentUser();
        if (me && me.username) {
            const el = document.getElementById('currentUserDisplay');
            if (el) {
                el.textContent = `Signed in as ${me.username}`;
            }
        }
    } catch (e) {
        // ignore; likely unauthenticated or 401 handled elsewhere
        console.debug('Cannot load current user', e);
    }
}

// Registration handling
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerSubmitBtn');
    if (!registerBtn) return;
    registerBtn.addEventListener('click', async () => {
        const err = document.getElementById('registerError');
        const ok = document.getElementById('registerSuccess');
        err.classList.add('d-none');
        ok.classList.add('d-none');

        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const pw = document.getElementById('registerPassword').value;
        const pw2 = document.getElementById('registerPassword2').value;

        if (pw !== pw2) {
            err.textContent = 'Passwords do not match.';
            err.classList.remove('d-none');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        try {
            await api.register(username, pw, email);
            ok.textContent = 'Account created. Signing you in...';
            ok.classList.remove('d-none');
            // Auto-login
            await api.login(username, pw);
            // Hide modal
            try {
                const modalEl = document.getElementById('registerModal');
                if (window.bootstrap && modalEl) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.hide();
                }
            } catch (_) {}
            showMainApp();
            await loadCurrentUser();
        } catch (e) {
            err.textContent = (e && e.message) ? e.message : 'Registration failed';
            err.classList.remove('d-none');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Create Account';
        }
    });
});
