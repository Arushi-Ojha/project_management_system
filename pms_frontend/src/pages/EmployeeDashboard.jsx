import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myTasks, setMyTasks] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && user?.organizationId) {
      loadDashboardData();
    }
  }, [user?.id, user?.organizationId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasks, team] = await Promise.all([
        apiCall(`/issues/?assigneeId=${user.id}`).catch(() => []),
        apiCall(`/iam/organizations/${user.organizationId}/users`).catch(() => [])
      ]);
      setMyTasks(tasks || []);
      // STRICT RULE: Admin is invisible to employee! Also exclude self.
      const safeTeammates = (team || []).filter(u => 
        u.id !== user.id && 
        u.role !== 'admin' && 
        u.role !== 'owner'
      );
      setTeammates(safeTeammates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const urgentTasks = myTasks.filter(t => {
    const dVal = t.deadline || t.dueDate;
    if (!dVal || t.status === 'completed' || t.status === 'approved') return false;
    const dObj = new Date(dVal);
    return dObj >= now && dObj <= next24h;
  });

  // Graph 1: Task Status Breakdown metrics
  const statusCounts = {
    assigned: myTasks.filter(t => !t.status || t.status === 'assigned').length,
    in_progress: myTasks.filter(t => t.status === 'in_progress').length,
    review_pending: myTasks.filter(t => t.status === 'review_pending').length,
    completed: myTasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
  };

  // Graph 2: Priority breakdown metrics
  const priorityCounts = {
    P1_Urgent: myTasks.filter(t => t.priority === 1).length,
    P2_High: myTasks.filter(t => t.priority === 2).length,
    P3_Medium: myTasks.filter(t => t.priority === 3).length,
    P4_Low: myTasks.filter(t => t.priority === 4 || !t.priority).length,
  };

  // Graph 3: Deadline Proximity
  const deadlineMetrics = {
    due24h: urgentTasks.length,
    due3Days: myTasks.filter(t => {
      const d = t.deadline || t.dueDate;
      if (!d) return false;
      const diff = (new Date(d) - now) / (1000 * 3600 * 24);
      return diff > 1 && diff <= 3;
    }).length,
    dueLater: myTasks.filter(t => {
      const d = t.deadline || t.dueDate;
      if (!d) return false;
      const diff = (new Date(d) - now) / (1000 * 3600 * 24);
      return diff > 3;
    }).length,
  };

  return (
    <div className="flex-col gap-24" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* Title & Profile Overview with Big Avatar */}
      <div className="flex-row justify-between items-center flex-wrap gap-16" style={{ borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <div className="flex-row items-center gap-16">
          {/* Big Profile Avatar */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #000',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              flexShrink: 0
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="My Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
              </span>
            )}
          </div>

          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
              Employee Dashboard: {user.name}
            </h1>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Employee ID: <strong>{user.employeeId || 'N/A'}</strong> | Position: <strong>{user.position || 'Staff'}</strong> | Role: [Employee]
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tasks')}
          style={{ fontWeight: 'bold', padding: '10px 18px', fontSize: '15px' }}
        >
          Open Task Workstation & Submit Reports
        </button>
      </div>

      {/* 24-HOUR DEADLINE ALERT BANNER */}
      {urgentTasks.length > 0 && (
        <div style={{ border: '2px solid #000', padding: '14px', background: '#fff' }} className="flex-col gap-6">
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            URGENT DEADLINE ALERT: {urgentTasks.length} Task(s) Due Within 24 Hours!
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {urgentTasks.map(t => `${t.identifier}: ${t.title} (Due: ${t.deadline || t.dueDate})`).join(' | ')}
          </p>
          <div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              style={{ fontWeight: 'bold', padding: '6px 14px', fontSize: '13px' }}
            >
              Go To Deliverables Form
            </button>
          </div>
        </div>
      )}

      {/* THREE COMPONENT VISUALIZATION GRAPHS */}
      <div className="panel flex-col gap-16">
        <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Workload & Progress Visualizations</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
              Visual breakdown of your assigned tasks, priorities, and upcoming deadlines.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>[{myTasks.length} Total Tasks]</span>
        </div>

        <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
          
          {/* GRAPH 1: Task Status Distribution (Bar Chart) */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>1. Task Status Distribution</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Current state of assigned deliverables</p>

            <svg width="100%" height="150" viewBox="0 0 340 150" style={{ background: '#fff' }}>
              <line x1="30" y1="120" x2="320" y2="120" stroke="#000" strokeWidth="1.5" />
              <line x1="30" y1="15" x2="30" y2="120" stroke="#000" strokeWidth="1.5" />

              {[
                { label: 'Assigned', count: statusCounts.assigned },
                { label: 'In Progress', count: statusCounts.in_progress },
                { label: 'Review', count: statusCounts.review_pending },
                { label: 'Completed', count: statusCounts.completed },
              ].map((st, idx) => {
                const maxVal = Math.max(1, ...Object.values(statusCounts));
                const barH = Math.max(6, Math.round((st.count / maxVal) * 85));
                const x = 45 + idx * 70;
                const y = 120 - barH;

                return (
                  <g key={st.label}>
                    <rect x={x} y={y} width="40" height={barH} fill="#000" />
                    <text x={x + 20} y={y - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="'Times New Roman', serif">
                      {st.count}
                    </text>
                    <text x={x + 20} y="136" textAnchor="middle" fontSize="11" fontFamily="'Times New Roman', serif">
                      {st.label.length > 8 ? st.label.slice(0, 7) + '.' : st.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <span style={{ fontSize: '11px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
              Assigned: {statusCounts.assigned} | In Progress: {statusCounts.in_progress} | Review: {statusCounts.review_pending}
            </span>
          </div>

          {/* GRAPH 2: Task Priority Breakdown */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>2. Task Priority Breakdown</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Urgency levels across your assigned workload</p>

            <div className="flex-col gap-8" style={{ marginTop: '4px' }}>
              {[
                { name: 'Priority 1 (Urgent)', count: priorityCounts.P1_Urgent },
                { name: 'Priority 2 (High)', count: priorityCounts.P2_High },
                { name: 'Priority 3 (Medium)', count: priorityCounts.P3_Medium },
                { name: 'Priority 4 (Low)', count: priorityCounts.P4_Low },
              ].map(p => {
                const pct = myTasks.length > 0 ? Math.round((p.count / myTasks.length) * 100) : 0;
                return (
                  <div key={p.name} className="flex-col gap-2">
                    <div className="flex-row justify-between" style={{ fontSize: '12px' }}>
                      <span><strong>{p.name}</strong></span>
                      <span>{p.count} tasks ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', border: '1px solid #000', background: '#fff' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#000' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: '11px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
              Priority sorting automatically emphasizes closer deadlines.
            </span>
          </div>

          {/* GRAPH 3: Deadline Proximity Timeline */}
          <div style={{ flex: '1 1 360px', border: '1px solid #000', padding: '16px', background: '#fff' }} className="flex-col gap-10">
            <h4 style={{ margin: 0, fontSize: '15px' }}>3. Deadline Proximity Horizon</h4>
            <p style={{ margin: 0, fontSize: '12px' }}>Time remaining until deliverables due date</p>

            <div className="flex-col gap-8" style={{ marginTop: '4px' }}>
              <div className="flex-row justify-between items-center" style={{ fontSize: '13px', borderBottom: '1px dotted #000', paddingBottom: '4px' }}>
                <span>Due Within 24 Hours:</span>
                <span style={{ fontWeight: 'bold' }}>{deadlineMetrics.due24h} Task(s)</span>
              </div>
              <div className="flex-row justify-between items-center" style={{ fontSize: '13px', borderBottom: '1px dotted #000', paddingBottom: '4px' }}>
                <span>Due Within 3 Days:</span>
                <span style={{ fontWeight: 'bold' }}>{deadlineMetrics.due3Days} Task(s)</span>
              </div>
              <div className="flex-row justify-between items-center" style={{ fontSize: '13px', borderBottom: '1px dotted #000', paddingBottom: '4px' }}>
                <span>Due Later (4+ Days):</span>
                <span style={{ fontWeight: 'bold' }}>{deadlineMetrics.dueLater} Task(s)</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', fontSize: '12px' }}>
              <p style={{ margin: 0 }}>
                <strong>Workstation:</strong> Submit your report summary, GitHub URL, and Dockerfile link before the deadline.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Flex Layout: My Tasks on Left, Teammates on Right */}
      <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
        
        {/* Left Column: My Tasks */}
        <div className="panel flex-col gap-12" style={{ flex: '2 1 540px' }}>
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <h2 style={{ margin: 0, fontSize: '20px' }}>My Tasks Queue ({myTasks.length})</h2>
            <button type="button" onClick={() => navigate('/tasks')} style={{ fontSize: '13px' }}>
              Manage in Workstation
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Priority given to closer deadlines. If tasks share identical deadlines, you may choose to Accept or Reject.
          </p>

          {loading ? (
            <p>Loading assigned tasks...</p>
          ) : myTasks.length === 0 ? (
            <p style={{ padding: '20px 0', textAlign: 'center' }}>No active tasks currently assigned to you.</p>
          ) : (
            <div className="flex-col gap-12">
              {myTasks.map(task => {
                const isCompleted = task.status === 'completed' || task.status === 'approved';
                const isReview = task.status === 'review_pending';

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    style={{
                      border: task.deadlineConflict ? '2px solid #000' : '1px solid #000',
                      padding: '14px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                    className="flex-col gap-6"
                  >
                    <div className="flex-row justify-between items-center flex-wrap gap-6">
                      <div className="flex-row items-center gap-8">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', border: '1px solid #000', padding: '1px 6px' }}>
                          {task.identifier}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>{task.title}</h4>
                      </div>
                      
                      <div className="flex-row items-center gap-6">
                        <span style={{ fontSize: '12px', border: '1px solid #000', padding: '1px 6px' }}>
                          [{task.status || 'assigned'}]
                        </span>
                        {task.deadlineConflict && (
                          <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '1px 6px' }}>
                            Shared Deadline Flagged
                          </span>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <p style={{ margin: 0, fontSize: '13px' }}>{task.description}</p>
                    )}

                    <div className="flex-row justify-between items-center flex-wrap gap-8" style={{ fontSize: '12px', borderTop: '1px dotted #000', paddingTop: '6px' }}>
                      <span>Deadline: <strong>{task.deadline || task.dueDate || 'None set'}</strong></span>
                      <span>Priority: <strong>{task.priority || 3}</strong></span>
                      <span style={{ fontWeight: 'bold' }}>
                        {task.reportText ? '[Deliverables Submitted]' : '[Click to Update in Workstation]'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Teammates Progress (Bigger Avatars, Strictly No Admin) */}
        <div className="panel flex-col gap-12" style={{ flex: '1 1 360px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Teammates' Pulse</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
              Fellow workspace colleagues (Admins are strictly isolated).
            </p>
          </div>

          {teammates.length === 0 ? (
            <p style={{ fontSize: '13px' }}>No other registered colleagues found.</p>
          ) : (
            <div className="flex-col gap-10" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              {teammates.map(mate => (
                <div
                  key={mate.id}
                  style={{
                    border: '1px solid #000',
                    padding: '10px',
                    background: '#fff'
                  }}
                  className="flex-row items-center gap-12"
                >
                  {/* Bigger Teammate Avatar (56px) */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: '2px solid #000',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#fff',
                      flexShrink: 0
                    }}
                  >
                    {mate.avatarUrl ? (
                      <img
                        src={mate.avatarUrl}
                        alt={mate.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                        {mate.name ? mate.name.slice(0, 2).toUpperCase() : 'ST'}
                      </span>
                    )}
                  </div>

                  {/* Teammate Details */}
                  <div className="flex-col gap-2">
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {mate.name}
                    </span>
                    <span style={{ fontSize: '12px' }}>
                      ID: <strong>{mate.employeeId || 'EMP-?'}</strong>
                    </span>
                    <span style={{ fontSize: '12px' }}>
                      {mate.position || 'Staff'} {mate.role === 'project_manager' ? '(Project Head)' : '[Staff]'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
