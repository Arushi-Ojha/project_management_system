import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import PublicNavbar from '../components/PublicNavbar';

export default function Onboarding() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(location.state?.mode || 'login'); // 'login', 'signup', 'verify_otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    try {
      setLoading(true);
      const res = await apiCall('/iam/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      login(res);
      navigate('/dashboard');
    } catch (err) {
      if (err.message.includes('verify your OTP') || err.message.includes('not verified')) {
        setMode('verify_otp');
        setInfoMessage('Account not yet verified. Please enter the OTP sent to your email.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    try {
      setLoading(true);
      const res = await apiCall('/iam/auth/signup', {
        method: 'POST',
        body: { organizationName, name, email, password }
      });
      setInfoMessage(res.message || 'OTP verification code sent to your email.');
      setMode('verify_otp');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await apiCall('/iam/auth/verify-otp', {
        method: 'POST',
        body: { email, otp }
      });
      setInfoMessage('Account verified successfully! Please log in.');
      setMode('login');
      setOtp('');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#000000] flex-col font-space">
      {/* Home page Navbar present on Login / Signup */}
      <PublicNavbar />

      <div className="flex-col items-center justify-center flex-1 py-12 px-6">
        <div style={{ width: '100%', maxWidth: '440px', border: '2px solid #000', padding: '28px', background: '#fff', borderRadius: '28px' }} className="flex-col gap-16 shadow-[0_8px_0_0_#38bdf8]">
          
          {/* Header & Logo with Favicon */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
            <img src="/favicon.png" alt="WAYMARK" style={{ width: '44px', height: '44px', objectFit: 'contain', margin: '0 auto 8px auto', display: 'block' }} />
            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold' }}>WAYMARK</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
              {mode === 'login' && 'Sign in to access your organization workspace'}
              {mode === 'signup' && 'Create a new Organization Workspace as Admin'}
              {mode === 'verify_otp' && 'Email Verification with 6-Digit OTP'}
            </p>
          </div>

        {/* Tab Switcher */}
        {mode !== 'verify_otp' && (
          <div className="flex-row gap-12" style={{ marginTop: '4px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={mode === 'login' ? 'btn-active' : ''}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px 14px',
                fontSize: '15px',
                fontWeight: mode === 'login' ? 'bold' : 'normal'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={mode === 'signup' ? 'btn-active' : ''}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px 14px',
                fontSize: '15px',
                fontWeight: mode === 'signup' ? 'bold' : 'normal'
              }}
            >
              Workspace Creation
            </button>
          </div>
        )}

        {error && (
          <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>Error: {error}</p>
          </div>
        )}
        {infoMessage && (
          <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{infoMessage}</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex-col gap-16">
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Work Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@company.com"
                style={{ fontSize: '15px', padding: '8px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Password:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ fontSize: '15px', padding: '8px 10px' }}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  padding: '10px 16px',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
            </div>
          </form>
        )}

        {/* WORKSPACE CREATION FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="flex-col gap-14">
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Organization / Workspace Name:
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={e => setOrganizationName(e.target.value)}
                placeholder="e.g. Acme Innovations Corp"
                style={{ fontSize: '14px', padding: '8px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Admin Full Name:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                style={{ fontSize: '14px', padding: '8px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Admin Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                style={{ fontSize: '14px', padding: '8px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Admin Password (minimum 8 characters):
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter secure password"
                style={{ fontSize: '14px', padding: '8px 10px' }}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  padding: '10px 16px',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Creating Workspace...' : 'Create Workspace & Send OTP'}
              </button>
            </div>
          </form>
        )}

        {/* VERIFY OTP FORM */}
        {mode === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="flex-col gap-16">
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                Enter 6-Digit OTP Sent to {email}:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '20px', padding: '10px' }}
              />
            </div>

            <div className="flex-col gap-10">
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  fontWeight: 'bold',
                  padding: '10px 16px',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Activate Workspace'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  </div>
);
}
