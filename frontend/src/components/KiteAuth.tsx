import { useState, useEffect } from 'react';
import { getKiteLoginUrl, handleKiteCallback } from '../api/kite';

interface KiteAuthProps {
  onAuthSuccess: (accessToken: string) => void;
  onClose: () => void;
}

const KiteAuth: React.FC<KiteAuthProps> = ({ onAuthSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [requestToken, setRequestToken] = useState('');
  const [step, setStep] = useState<'login' | 'callback'>('login');

  useEffect(() => {
    fetchLoginUrl();
  }, []);

  const fetchLoginUrl = async () => {
    try {
      setLoading(true);
      const response = await getKiteLoginUrl();
      setLoginUrl(response.login_url);
    } catch (err: any) {
      setError('Failed to get Kite login URL');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToken.trim()) {
      setError('Please enter the request token');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await handleKiteCallback(requestToken);
      
      // Store the access token in localStorage
      localStorage.setItem('kite_access_token', response.access_token);
      localStorage.setItem('kite_user_id', response.user_id);
      localStorage.setItem('kite_user_name', response.user_name);
      
      onAuthSuccess(response.access_token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate with Kite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-shield-check me-2"></i>
              Kite Connect Authentication
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {step === 'login' && (
              <div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  To fetch real-time stock prices, you need to authenticate with Kite Connect.
                </div>
                
                <div className="mb-3">
                  <h6>Step 1: Login to Kite</h6>
                  <p className="text-muted">Click the button below to open Kite login in a new tab.</p>
                  {loginUrl ? (
                    <a
                      href={loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-box-arrow-up-right me-2"></i>
                      Open Kite Login
                    </a>
                  ) : (
                    <button className="btn btn-primary" disabled>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Loading...
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <h6>Step 2: Get Request Token</h6>
                  <p className="text-muted">
                    After logging in, you'll be redirected to a page with a request token in the URL. 
                    Copy the <code>request_token</code> parameter value.
                  </p>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setStep('callback')}
                  >
                    I have the request token
                  </button>
                </div>
              </div>
            )}

            {step === 'callback' && (
              <div>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Enter the request token from the Kite redirect URL
                </div>

                <form onSubmit={handleTokenSubmit}>
                  <div className="mb-3">
                    <label htmlFor="requestToken" className="form-label">Request Token</label>
                    <input
                      type="text"
                      className="form-control"
                      id="requestToken"
                      value={requestToken}
                      onChange={(e) => setRequestToken(e.target.value)}
                      placeholder="Enter request token from URL"
                      required
                    />
                    <div className="form-text">
                      Look for <code>request_token=...</code> in the URL after Kite login
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Complete Authentication
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setStep('login')}
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KiteAuth;