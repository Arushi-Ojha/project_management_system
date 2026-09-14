import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiCall } from '../services/api';
import { CheckCircle2, Users, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import orangeIcon from '../assets/orange.png';

export default function MemberDashboard() {
  const { user, organization } = useAuth();
  const [teams, setTeams] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && organization) {
      loadDashboardData();
    }
  }, [user, organization]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [teamsRes, tasksRes] = await Promise.all([
        apiCall(`/iam/organizations/${organization.id}/teams`),
        apiCall(`/issues?assigneeId=${user.id}`)
      ]);
      const myTeams = teamsRes.filter(t => t.memberIds?.includes(user.id));
      setTeams(myTeams);
      setMyTasks(tasksRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineString = (dueDate) => {
    if (!dueDate) return "No deadline";
    const diffTime = new Date(dueDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    return `${diffDays} days left`;
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div style={{ marginTop: '32px' }}>
      <h1>My Workspace</h1>
      <p style={{ marginBottom: '32px' }}>Welcome back! Here's what's on your plate.</p>
      
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        
        {/* Left Column: My Tasks */}
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={orangeIcon} alt="Tasks icon" style={{ width: '24px', height: '24px' }} /> My Tasks
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You have no tasks assigned to you right now. Take a break!</p>
            ) : (
              myTasks.map(task => (
                <div key={task.id} style={{ 
                  background: '#ffffff', 
                  padding: '24px', 
                  border: '2px solid var(--color-gray)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>{task.identifier}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                      <span style={{ padding: '4px 8px', background: 'var(--color-mint)', fontWeight: 'bold' }}>
                        {task.stateId ? "IN PROGRESS" : "TODO"}
                      </span>
                      {task.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: getDeadlineString(task.dueDate).includes('Overdue') ? 'red' : 'inherit' }}>
                          <Calendar size={14} /> {getDeadlineString(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={`/project/${task.projectId}`} className="glass-button" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>
                    View Board
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Teams */}
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={orangeIcon} alt="Teams icon" style={{ width: '24px', height: '24px' }} /> My Teams
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {teams.length === 0 ? (
              <div style={{ padding: '24px', border: '2px solid var(--color-gray)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>You are not in any teams yet.</p>
              </div>
            ) : (
              teams.map(team => (
                <div key={team.id} style={{ padding: '24px', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>{team.name}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--color-gray)', color: 'white', fontWeight: 600 }}>
                      {team.key}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <Users size={14} /> Team Members: {team.memberIds?.length || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
