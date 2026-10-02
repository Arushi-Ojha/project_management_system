import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationModal from './NotificationModal';
import MeetSchedulerModal from './MeetSchedulerModal';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!user) return null;

  const role = user.role || 'employee';
  const isAdmin = role === 'admin' || role === 'owner';
  const isPM = role === 'project_manager';
  const isEmployee = !isAdmin && !isPM;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <>
      <header className="navbar" style={{ padding: '10px 24px', minHeight: '60px' }}>
        
        {/* Left: Brand & Workspace Title & Role Badge */}
        <div className="flex-row items-center gap-12" style={{ flexShrink: 0 }}>
          <img src="/favicon.png" alt="WAYMARK" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            WAYMARK
          </span>
          <span style={{ fontSize: '14px', borderLeft: '1px solid #000', paddingLeft: '10px' }}>
            {user.organizationName || 'Workspace'}
          </span>
          <span style={{ fontSize: '11px', border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold' }}>
            [{role.toUpperCase()}]
          </span>
        </div>

        {/* Center: Main Page Navigation Links */}
        <nav className="nav-links flex-row items-center gap-12" style={{ flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard & Terminal Logs
              </NavLink>
              <NavLink to="/basic-settings" className={({ isActive }) => isActive ? 'active' : ''}>
                Basic Settings (Staff & Bulk Upload)
              </NavLink>
              <NavLink to="/advanced-settings" className={({ isActive }) => isActive ? 'active' : ''}>
                Advanced Settings (All DB Collections)
              </NavLink>
            </>
          )}

          {isPM && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard & Progress
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
                Projects & Staffing
              </NavLink>
              <NavLink to="/workflows" className={({ isActive }) => isActive ? 'active' : ''}>
                Workflows & Pipeline
              </NavLink>
              <NavLink to="/tasks-management" className={({ isActive }) => isActive ? 'active' : ''}>
                Tasks & Reviews
              </NavLink>
            </>
          )}

          {isEmployee && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard & Teammates
              </NavLink>
              <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
                My Tasks & Reports
              </NavLink>
            </>
          )}
        </nav>

        {/* Right: Quick Action Controls & User Profile (Packed & Safely Separated) */}
        <div className="flex-row items-center gap-10" style={{ flexShrink: 0, flexWrap: 'wrap' }}>
          
          <button
            type="button"
            onClick={() => setShowMeetModal(true)}
            style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
          >
            Schedule Meet
          </button>

          <button
            type="button"
            onClick={() => setShowNotifModal(true)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: unreadCount > 0 ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Notifications {unreadCount > 0 ? `(${unreadCount})` : '(0)'}
          </button>

          {/* Profile with Avatar (Bigger Icon) */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            style={{
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '2px solid #000',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid #000',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff'
                }}
              >
                {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
              </span>
            )}
            <span style={{ fontWeight: 'bold' }}>Profile & Password</span>
          </button>

          {/* Sign Out with Safe Separation and Confirmation */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              fontWeight: 'bold',
              padding: '6px 14px',
              fontSize: '13px',
              marginLeft: '12px',
              cursor: 'pointer'
            }}
            title="Sign out of your session"
          >
            Sign Out
          </button>
        </div>

      </header>

      {/* Modals */}
      <NotificationModal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} />
      <MeetSchedulerModal isOpen={showMeetModal} onClose={() => setShowMeetModal(false)} />
      <ProfileSettingsModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
