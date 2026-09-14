import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Home } from 'lucide-react';
import orangeIcon from '../assets/orange.png';

export default function Onboarding() {
  const [view, setView] = useState('signup'); // 'signup', 'otp', 'login'
  
  // Signup State
  const [signupData, setSignupData] = useState({ name: '', email: '', organizationName: '', password: '', website: '' }); // 'website' is the honeypot
  
  // OTP State
  const [otp, setOtp] = useState('');
  
  // Login State
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login, setOrg } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupData.website) {
      // Honeypot filled by bot -> silently discard
      setView('otp');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await apiCall('/iam/auth/signup', {
        method: 'POST',
        body: {
          name: signupData.name,
          email: signupData.email,
          organizationName: signupData.organizationName,
          password: signupData.password
        }
      });
      setView('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiCall('/iam/auth/verify-otp', {
        method: 'POST',
        body: {
          email: signupData.email,
          otp: otp
        }
      });
      setView('login');
      setLoginData({ ...loginData, email: signupData.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall('/iam/auth/login', {
        method: 'POST',
        body: {
          email: loginData.email,
          password: loginData.password
        }
      });
      login(res.user, res.accessToken);
      setOrg({ id: res.user.organizationId }); // Mocking org name since backend doesn't return it in login yet
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link to="/" className="glass-button">
          <Home size={18} /> Home
        </Link>
      </div>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={orangeIcon} alt="Hero Logo" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            {view === 'signup' ? 'Create Workspace' : view === 'otp' ? 'Verify OTP' : 'Login'}
          </h1>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'red', padding: '12px', marginBottom: '24px', border: '1px solid red' }}>
            {error}
          </div>
        )}

        {/* SIGNUP FORM */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label">Organization Name</label>
              <input required type="text" className="input-field" placeholder="e.g. Stark Industries" 
                value={signupData.organizationName} onChange={e => setSignupData({...signupData, organizationName: e.target.value})} />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input required type="text" className="input-field" placeholder="e.g. Ada Lovelace" 
                value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Work Email</label>
              <input required type="email" className="input-field" placeholder="name@yourorganization.com" 
                value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" minLength={8} className="input-field" placeholder="Minimum 8 characters" 
                value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} />
            </div>
            
            {/* HONEYPOT FIELD */}
            <div style={{ display: 'none' }}>
              <label>Website</label>
              <input type="text" name="website" tabIndex="-1" autoComplete="off" 
                value={signupData.website} onChange={e => setSignupData({...signupData, website: e.target.value})} />
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Processing...' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '16px', cursor: 'pointer' }} onClick={() => setView('login')}>
              Already have an account? Log in
            </p>
          </form>
        )}

        {/* OTP FORM */}
        {view === 'otp' && (
          <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label">6-Digit Code</label>
              <input required type="text" maxLength={6} className="input-field" placeholder="123456" 
                value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label">Email</label>
              <input required type="email" className="input-field" placeholder="name@yourorganization.com" 
                value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" className="input-field" placeholder="••••••••" 
                value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
            </div>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '16px', cursor: 'pointer' }} onClick={() => setView('signup')}>
              Don't have an account? Sign up
            </p>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', fontSize: '0.8rem' }}>
          <ShieldCheck size={14} /> Secure Authentication
        </div>
      </div>
    </div>
  );
}
