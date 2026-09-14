import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import orangeIcon from '../assets/orange.png';

export default function Navbar() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav-bar animate-fade-in">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={orangeIcon} alt="PMS Logo" style={{ width: '28px', height: '28px' }} />
        <span>PMS {organization && <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>/ {organization.name}</span>}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/dashboard" className="glass-button" style={{ textDecoration: 'none' }}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/settings" className="glass-button" style={{ textDecoration: 'none' }}>
          <Settings size={18} /> Settings
        </Link>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)', margin: '0 8px' }}></div>
        
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {user?.name}
        </span>
        <button onClick={handleLogout} className="glass-button" style={{ color: 'var(--danger-color)', padding: '8px' }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
