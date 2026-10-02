import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationModal({ isOpen, onClose }) {
  const { user, refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/notifications');
      setNotifications(data || []);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (notifId, action) => {
    try {
      setActionLoading(`${notifId}-${action}`);
      await apiCall(`/notifications/${notifId}/respond`, {
        method: 'POST',
        body: { action }
      });
      await loadNotifications();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await apiCall(`/notifications/${notifId}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, read: true } : n));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
          <div>
            <h2>Notifications & Action Alerts</h2>
            <p style={{ fontSize: '12px' }}>Alerts older than 7 days are automatically deleted.</p>
          </div>
          <button type="button" onClick={onClose} style={{ fontWeight: 'bold' }}>Close [X]</button>
        </div>

        {loading ? (
          <p>Loading alerts...</p>
        ) : notifications.length === 0 ? (
          <p>No active notifications found.</p>
        ) : (
          <div className="flex-col gap-12">
            {notifications.map((n) => {
              const isInvite = n.type === 'PROJECT_INVITE' || n.type === 'TASK_INVITE';
              const hasResponded = n.response_status && n.response_status !== 'pending';

              return (
                <div
                  key={n.notification_id}
                  style={{
                    border: '1px solid #000',
                    padding: '12px',
                    background: '#ffffff'
                  }}
                  className="flex-col gap-8"
                >
                  <div className="flex-row justify-between items-center">
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '11px' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px' }}>
                    {n.message}
                  </p>

                  {/* Accept or Reject for Invites */}
                  {isInvite && !hasResponded && (
                    <div className="flex-row gap-8" style={{ marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleRespond(n.notification_id, 'accept')}
                        disabled={actionLoading === `${n.notification_id}-accept`}
                        style={{ fontWeight: 'bold' }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(n.notification_id, 'reject')}
                        disabled={actionLoading === `${n.notification_id}-reject`}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {hasResponded && (
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      Status: [{n.response_status.toUpperCase()}]
                    </div>
                  )}

                  {n.action_url && n.type === 'MEET_INVITE' && (
                    <div>
                      <a href={n.action_url} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
                        Join Google Meet Session
                      </a>
                    </div>
                  )}

                  {!n.read && !isInvite && (
                    <div className="flex-row justify-end">
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.notification_id)}
                        style={{ fontSize: '12px' }}
                      >
                        Mark as Read
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
