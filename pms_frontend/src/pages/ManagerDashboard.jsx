import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id, user?.organizationId]);

  const loadDashboardData = async () => {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const [projData, wfData, notifData] = await Promise.all([
        apiCall(`/execution/projects?organizationId=${user.organizationId}&userId=${user.id}`).catch(() => []),
        apiCall('/config/workflows').catch(() => []),
        apiCall('/notifications').catch(() => [])
      ]);
      setProjects(projData || []);
      setWorkflows(wfData || []);
      setNotifications(notifData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Status distributions (Calculated based on workflow + deadline in IST)
  const statusCounts = {
    on_track: projects.filter(p => p.status === 'on_track' || p.calculatedStatus === 'on_track' || (!p.status && (p.progress || 0) > 0)).length,
    at_risk: projects.filter(p => p.status === 'at_risk' || p.calculatedStatus === 'at_risk').length,
    overdue: projects.filter(p => p.status === 'overdue' || p.calculatedStatus === 'overdue').length,
    completed: projects.filter(p => p.status === 'completed' || p.calculatedStatus === 'completed' || (p.progress || 0) >= 100).length,
  };

  // Workflow stage distribution
  const stageMap = {};
  projects.forEach(p => {
    const stage = p.workflowStage || 'Backlog';
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  });
  const stageEntries = Object.entries(stageMap);

  return (
    <div className="flex-col gap-24" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* Top Header */}
      <div className="flex-row justify-between items-center flex-wrap gap-16" style={{ borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>Project Manager Dashboard</h1>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Monitor real-time project progress rates dynamically calculated from workflow stages, task deliverables, and deadlines evaluated in IST.
          </p>
        </div>

        <div className="flex-row gap-12 flex-wrap">
          <button type="button" onClick={() => navigate('/projects')} style={{ padding: '8px 16px', fontSize: '14px' }}>
            + Create & Staff Projects
          </button>
          <button type="button" onClick={() => navigate('/workflows')} style={{ padding: '8px 16px', fontSize: '14px' }}>
            Workflows & Pipeline
          </button>
          <button type="button" onClick={() => navigate('/tasks-management')} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}>
            Task Management & Reviews
          </button>
        </div>
      </div>

      {/* THREE COMPONENT VISUALIZATION GRAPHS */}
      <div className="panel flex-col gap-16">
        <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Project Health & Progress Visualizations (IST Calculated)</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
              Progress rates and status updated automatically based on current date & time (Indian Standard Time) and deadlines.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>[IST Engine Active]</span>
        </div>

        <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
          
          {/* GRAPH 1: Project Progress Rate (%) Comparison Bar Chart */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>1. Project Completion Rate (%)</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Comparing completion percentages across active projects</p>

            {projects.length === 0 ? (
              <p style={{ fontSize: '12px', padding: '20px 0' }}>No projects to visualize.</p>
            ) : (
              <div className="flex-col gap-8" style={{ marginTop: '8px' }}>
                {projects.slice(0, 5).map(p => {
                  const pct = p.progress || 0;
                  return (
                    <div key={p.id} className="flex-col gap-2">
                      <div className="flex-row justify-between" style={{ fontSize: '12px' }}>
                        <span><strong>{p.name.length > 22 ? p.name.slice(0, 20) + '...' : p.name}</strong></span>
                        <strong>{pct}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '14px', border: '1px solid #000', background: '#fff' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#000' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <span style={{ fontSize: '11px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
              Progress combines workflow stage progress and task approvals.
            </span>
          </div>

          {/* GRAPH 2: Workflow Pipeline Stage Distribution */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>2. Workflow Pipeline Distribution</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Count of projects currently situated in each workflow stage</p>

            <svg width="100%" height="150" viewBox="0 0 340 150" style={{ background: '#fff' }}>
              <line x1="30" y1="120" x2="320" y2="120" stroke="#000" strokeWidth="1.5" />
              <line x1="30" y1="15" x2="30" y2="120" stroke="#000" strokeWidth="1.5" />

              {stageEntries.length === 0 ? (
                <text x="170" y="70" textAnchor="middle" fontSize="12" fontFamily="'Times New Roman', serif">
                  No workflow projects assigned
                </text>
              ) : (
                stageEntries.slice(0, 4).map(([stName, count], idx) => {
                  const maxCount = Math.max(...stageEntries.map(([, c]) => c), 1);
                  const barH = Math.max(8, Math.round((count / maxCount) * 85));
                  const x = 50 + idx * 70;
                  const y = 120 - barH;

                  return (
                    <g key={stName}>
                      <rect x={x} y={y} width="40" height={barH} fill="#000" />
                      <text x={x + 20} y={y - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="'Times New Roman', serif">
                        {count}
                      </text>
                      <text x={x + 20} y="136" textAnchor="middle" fontSize="11" fontFamily="'Times New Roman', serif">
                        {stName.length > 9 ? stName.slice(0, 8) + '..' : stName}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
            <span style={{ fontSize: '11px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
              Projects can be dragged between stages in Workflows & Pipeline.
            </span>
          </div>

          {/* GRAPH 3: Project Health & Deadline Status Breakdown (IST) */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>3. Project Health Breakdown (IST)</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Calculated by deadline vs current IST date & time</p>

            <div className="flex-col gap-8" style={{ marginTop: '4px' }}>
              {[
                { label: 'On Track', count: statusCounts.on_track },
                { label: 'At Risk (<=3 Days)', count: statusCounts.at_risk },
                { label: 'Overdue (Past Deadline)', count: statusCounts.overdue },
                { label: 'Completed (100%)', count: statusCounts.completed },
              ].map(item => (
                <div key={item.label} className="flex-row justify-between items-center" style={{ fontSize: '13px', borderBottom: '1px dotted #000', paddingBottom: '3px' }}>
                  <span>{item.label}:</span>
                  <span style={{ fontWeight: 'bold' }}>{item.count} Projects</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontSize: '11px' }}>
              <span>Time reference: <strong>Indian Standard Time (IST, UTC+5:30)</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Flex Layout: Projects on Left, Notifications on Right */}
      <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: PROJECTS WITH DYNAMIC STATUS & RATE */}
        <div className="panel flex-col gap-12" style={{ flex: '2 1 540px' }}>
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <h2 style={{ margin: 0, fontSize: '20px' }}>Projects Progress & Status</h2>
            <button type="button" onClick={() => navigate('/projects')} style={{ fontSize: '13px' }}>
              View Projects Hub & Staffing
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '13px' }}>
            When workflow stage or task status changes, the progress and health status are recalculated automatically against the deadline in IST.
          </p>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <p>No projects created yet.</p>
              <button type="button" onClick={() => navigate('/projects')} style={{ marginTop: '8px', fontWeight: 'bold' }}>
                Create First Project
              </button>
            </div>
          ) : (
            <div className="flex-col gap-14">
              {projects.map(proj => {
                const acceptedCount = proj.assignments?.filter(a => a.status === 'accepted').length || 0;
                const pendingCount = proj.assignments?.filter(a => a.status === 'pending').length || 0;
                const progressPct = proj.progress || 0;
                const displayStatus = proj.status || proj.calculatedStatus || 'planned';

                return (
                  <div
                    key={proj.id}
                    style={{
                      border: displayStatus === 'overdue' ? '2px solid #000' : '1px solid #000',
                      padding: '14px',
                      background: '#fff'
                    }}
                    className="flex-col gap-8"
                  >
                    <div className="flex-row justify-between items-center flex-wrap gap-8">
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', border: '1px solid #000', padding: '1px 6px' }}>
                          Priority #{proj.priority || 1}
                        </span>
                        <h3 style={{ margin: '0 0 0 8px', display: 'inline', fontSize: '18px' }}>
                          {proj.name}
                        </h3>
                      </div>
                      
                      <div className="flex-row items-center gap-10">
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: '1px solid #000',
                          padding: '2px 8px',
                          background: displayStatus === 'overdue' ? '#000' : '#fff',
                          color: displayStatus === 'overdue' ? '#fff' : '#000'
                        }}>
                          [{displayStatus.toUpperCase().replace('_', ' ')}]
                        </span>
                        <strong style={{ fontSize: '16px' }}>{progressPct}% Completed</strong>
                      </div>
                    </div>

                    {/* Progress representation bar */}
                    <div style={{ border: '1px solid #000', height: '14px', background: '#fff' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: '#000' }} />
                    </div>

                    <div className="flex-row justify-between items-center flex-wrap gap-8" style={{ fontSize: '12px', borderTop: '1px dotted #000', paddingTop: '6px' }}>
                      <span>Stage: <strong>{proj.workflowStage || 'Backlog'}</strong></span>
                      <span>Staff: <strong>{acceptedCount} accepted</strong> {pendingCount > 0 && `(${pendingCount} pending)`}</span>
                      <span>Deadline: <strong>{proj.deadline || 'None'}</strong></span>
                      <button type="button" onClick={() => navigate('/projects')} style={{ fontSize: '12px', padding: '4px 10px' }}>
                        Staffing & Details
                      </button>
                    </div>

                    {proj.istCalculatedAt && (
                      <span style={{ fontSize: '11px' }}>
                        Last evaluated: {proj.istCalculatedAt}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS FEED */}
        <div className="panel flex-col gap-12" style={{ flex: '1 1 340px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Notifications Feed</h2>
          <p style={{ margin: 0, fontSize: '12px' }}>
            Alerts when employees accept or reject project invites and task assignments. Auto-purged after 7 days.
          </p>

          {notifications.length === 0 ? (
            <p style={{ fontSize: '13px' }}>No recent notifications.</p>
          ) : (
            <div className="flex-col gap-8" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.notification_id} style={{ border: '1px solid #000', padding: '10px' }} className="flex-col gap-4">
                  <div className="flex-row justify-between items-center">
                    <strong style={{ fontSize: '13px' }}>{n.title}</strong>
                    <span style={{ fontSize: '11px' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px' }}>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
