import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert, BarChart2 } from 'lucide-react';
import orangeIcon from '../assets/orange.png';

export default function AdminDashboard() {
  const { organization } = useAuth();
  const [orgUsers, setOrgUsers] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      Promise.all([
        apiCall(`/iam/organizations/${organization.id}/users`),
        apiCall('/issues'),
        apiCall('/config/workflows'),
        apiCall('/extensions/audit-logs').catch(() => [])
      ]).then(([users, issues, wfs, logs]) => {
        setOrgUsers(users);
        setAllIssues(issues);
        setWorkflows(wfs);
        setAuditLogs(logs);
        setLoading(false);
      });
    }
  }, [organization]);

  if (loading) return <div style={{ padding: '40px' }}>Loading visualizations...</div>;

  const completedStateIds = new Set();
  workflows.forEach(w => {
    w.states.filter(s => s.category === 'completed').forEach(s => completedStateIds.add(s.id));
  });

  const progressData = orgUsers.map(u => {
    const tasks = allIssues.filter(i => i.assigneeId === u.id);
    const completed = tasks.filter(t => completedStateIds.has(t.stateId)).length;
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return { ...u, total: tasks.length, completed, rate };
  }).sort((a, b) => b.total - a.total);

  return (
    <div style={{ marginTop: '32px' }}>
      <h1>Organization Dashboard</h1>
      <p style={{ marginBottom: '32px' }}>Data visualizations and system logs across all Teams and Projects.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* User Progress Visualization */}
        <div style={{ padding: '24px', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <img src={orangeIcon} alt="Analytics" style={{ width: '24px', height: '24px' }} /> Completion Analytics
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {progressData.map(u => (
              <div key={u.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <span>{u.name} ({u.role})</span>
                  <span>{u.completed} / {u.total} Tasks</span>
                </div>
                <div style={{ height: '16px', background: 'var(--color-gray)', overflow: 'hidden', border: '1px solid black' }}>
                  <div style={{ height: '100%', width: `${u.rate}%`, background: u.rate === 100 ? 'var(--color-mint)' : 'var(--color-peach)', transition: 'width 1s ease-in-out' }}></div>
                </div>
              </div>
            ))}
            {progressData.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active users found.</p>}
          </div>
        </div>

        {/* Audit Logs Feed */}
        <div style={{ padding: '24px', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff', maxHeight: '600px', overflowY: 'auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <ShieldAlert color="var(--color-mint)" /> System Audit Trail
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {auditLogs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No audit logs recorded.</p>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '16px', background: 'var(--color-gray)', color: 'white' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-mint)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div>User <strong style={{ color: 'var(--color-peach)' }}>{log.actorId}</strong> performed <strong style={{ textTransform: 'uppercase' }}>{log.action}</strong> on {log.entityType} ({log.entityId})</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
