import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Settings2, FolderGit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import orangeIcon from '../assets/orange.png';

export default function LeadDashboard({ ledTeams }) {
  const { organization } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState(ledTeams[0] || null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [teamProjects, setTeamProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [labels, setLabels] = useState([]);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'roster', 'workflows', 'labels'
  
  // Visual Builder States
  const [newWorkflow, setNewWorkflow] = useState({ name: '', states: [{ name: 'Backlog', category: 'backlog', color: '#cccccc' }] });
  const [newLabel, setNewLabel] = useState({ name: '', color: '#ff0000', workflowId: '' });

  useEffect(() => {
    if (organization) {
      apiCall(`/iam/organizations/${organization.id}/users`).then(setOrgUsers);
      loadWorkflows();
      loadLabels();
    }
  }, [organization]);

  const loadWorkflows = async () => {
    try {
      const data = await apiCall('/config/workflows');
      setWorkflows(data);
    } catch (e) { console.error(e); }
  };
  
  const loadLabels = async () => {
    try {
      const data = await apiCall('/config/labels');
      setLabels(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedTeam) {
      apiCall(`/execution/projects?organizationId=${organization.id}`)
        .then(projects => {
          setTeamProjects(projects.filter(p => p.teamIds?.includes(selectedTeam.id)));
        });
    }
  }, [selectedTeam, organization]);

  const addMemberToTeam = async (userId) => {
    if (!selectedTeam) return;
    try {
      const currentMembers = selectedTeam.memberIds || [];
      if (currentMembers.includes(userId)) return alert("User already in team");
      
      const newMembers = [...currentMembers, userId];
      
      await apiCall(`/iam/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        body: { memberIds: newMembers }
      });
      
      setSelectedTeam({ ...selectedTeam, memberIds: newMembers });
      alert("Member added to Team!");
    } catch(e) {
      alert(e.message);
    }
  };
  
  const updateProjectWorkflow = async (projectId, newWorkflowId) => {
    try {
      await apiCall(`/execution/projects/${projectId}`, {
        method: 'PATCH',
        body: { workflowId: newWorkflowId }
      });
      setTeamProjects(teamProjects.map(p => p.id === projectId ? { ...p, workflowId: newWorkflowId } : p));
      alert("Project Workflow Updated!");
    } catch(e) {
      alert(e.message);
    }
  };

  // --- VISUAL BUILDERS ---

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/config/workflows', {
        method: 'POST',
        body: newWorkflow
      });
      loadWorkflows();
      setNewWorkflow({ name: '', states: [{ name: 'Backlog', category: 'backlog', color: '#cccccc' }] });
      alert("Workflow created!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleAddState = () => {
    setNewWorkflow(prev => ({
      ...prev,
      states: [...prev.states, { name: 'New State', category: 'started', color: '#3366cc' }]
    }));
  };

  const handleStateChange = (index, field, value) => {
    const updatedStates = [...newWorkflow.states];
    updatedStates[index][field] = value;
    setNewWorkflow({ ...newWorkflow, states: updatedStates });
  };
  
  const handleRemoveState = (index) => {
    const updatedStates = [...newWorkflow.states];
    updatedStates.splice(index, 1);
    setNewWorkflow({ ...newWorkflow, states: updatedStates });
  };

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/config/labels', {
        method: 'POST',
        body: {
          name: newLabel.name,
          color: newLabel.color,
          workflowId: newLabel.workflowId || null
        }
      });
      loadLabels();
      setNewLabel({ name: '', color: '#ff0000', workflowId: '' });
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!selectedTeam) return <div>No teams found where you are the lead.</div>;

  return (
    <div style={{ marginTop: '32px' }}>
      <h1>Team Lead Dashboard</h1>
      <p style={{ marginBottom: '32px' }}>Manage the Teams you lead, select your roster, and configure Project workflows.</p>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ marginBottom: '16px' }}>Your Teams</h3>
          {ledTeams.map(t => (
            <button 
              key={t.id} 
              onClick={() => setSelectedTeam(t)}
              className="glass-button" 
              style={{ justifyContent: 'flex-start', backgroundColor: selectedTeam.id === t.id ? 'var(--color-mint)' : '' }}
            >
              {t.name}
            </button>
          ))}
          
          <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Configuration</h3>
          <button onClick={() => setActiveTab('projects')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'projects' ? 'var(--color-peach)' : '' }}>
            Projects
          </button>
          <button onClick={() => setActiveTab('roster')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'roster' ? 'var(--color-peach)' : '' }}>
            Team Roster
          </button>
          <button onClick={() => setActiveTab('workflows')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'workflows' ? 'var(--color-peach)' : '' }}>
            Visual Workflows
          </button>
          <button onClick={() => setActiveTab('labels')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'labels' ? 'var(--color-peach)' : '' }}>
            Visual Labels
          </button>
        </div>

        {/* Management Area */}
        <div style={{ flex: 1, padding: '32px', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff' }}>
          <h2>Managing Team: {selectedTeam.name}</h2>
          
          {activeTab === 'projects' && (
            <>
              <h3 style={{ marginTop: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={orangeIcon} alt="Projects" style={{ width: '20px', height: '20px' }}/> Team Projects
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                {teamProjects.length === 0 ? <p>No projects assigned to this team.</p> : teamProjects.map(p => (
                  <div key={p.id} style={{ padding: '16px', border: '1px solid var(--color-gray)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '12px' }}>{p.name}</div>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Workflow Template</label>
                      <select 
                        className="input-field" 
                        value={p.workflowId || ''} 
                        onChange={e => updateProjectWorkflow(p.id, e.target.value)}
                        style={{ padding: '4px', fontSize: '0.8rem' }}
                      >
                        <option value="" disabled>Select workflow...</option>
                        {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <Link to={`/project/${p.id}`} className="primary-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '6px' }}>
                      Open Kanban Board
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'roster' && (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                <img src={orangeIcon} alt="Roster" style={{ width: '20px', height: '20px' }}/> Manage Team Roster
              </h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Add workspace users to your Team. Only Team members can be assigned tasks in your Team's projects.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {orgUsers.map(u => {
                  const isMember = selectedTeam.memberIds?.includes(u.id);
                  return (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-gray)' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem' }}>{u.email}</div>
                      </div>
                      <button 
                        onClick={() => addMemberToTeam(u.id)}
                        disabled={isMember}
                        className="glass-button"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: isMember ? 'var(--color-gray)' : 'var(--color-mint)', color: isMember ? '#fff' : '#000' }}
                      >
                        {isMember ? 'On Team' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {activeTab === 'workflows' && (
            <div style={{ marginTop: '32px' }}>
              <h3>Visual Workflow Builder</h3>
              <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Define states, categories, and colors visually.</p>
              
              <form onSubmit={handleCreateWorkflow} style={{ padding: '24px', border: '2px solid var(--color-gray)' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label className="label">Workflow Name</label>
                  <input required type="text" className="input-field" value={newWorkflow.name} onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})} placeholder="e.g. Design Workflow" />
                </div>
                
                <h4 style={{ marginBottom: '16px' }}>States</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {newWorkflow.states.map((state, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input 
                        required 
                        className="input-field" 
                        value={state.name} 
                        onChange={(e) => handleStateChange(index, 'name', e.target.value)} 
                        placeholder="State Name" 
                        style={{ flex: 2, margin: 0 }}
                      />
                      <select 
                        className="input-field" 
                        value={state.category} 
                        onChange={(e) => handleStateChange(index, 'category', e.target.value)}
                        style={{ flex: 1, margin: 0 }}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="unstarted">Unstarted</option>
                        <option value="started">Started</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <input 
                        type="color" 
                        value={state.color} 
                        onChange={(e) => handleStateChange(index, 'color', e.target.value)}
                        style={{ height: '38px', width: '48px', padding: '2px', border: '1px solid var(--color-gray)' }}
                      />
                      <button type="button" onClick={() => handleRemoveState(index)} className="glass-button" style={{ padding: '8px', color: 'red' }}>
                        x
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={handleAddState} className="glass-button">Add State</button>
                  <button type="submit" className="primary-button">Save Workflow</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'labels' && (
            <div style={{ marginTop: '32px' }}>
              <h3>Visual Label Builder</h3>
              <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Create custom labels and optionally bunch them to specific workflows.</p>
              
              <form onSubmit={handleCreateLabel} style={{ padding: '24px', border: '2px solid var(--color-gray)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2 }}>
                    <label className="label">Label Name</label>
                    <input required type="text" className="input-field" value={newLabel.name} onChange={e => setNewLabel({...newLabel, name: e.target.value})} placeholder="e.g. Critical Bug" style={{ margin: 0 }}/>
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input type="color" value={newLabel.color} onChange={e => setNewLabel({...newLabel, color: e.target.value})} style={{ height: '38px', width: '48px', padding: '2px', border: '1px solid var(--color-gray)', display: 'block' }}/>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label className="label">Bunch to Workflow (Optional)</label>
                    <select className="input-field" value={newLabel.workflowId} onChange={e => setNewLabel({...newLabel, workflowId: e.target.value})} style={{ margin: 0 }}>
                      <option value="">Global (All Workflows)</option>
                      {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="primary-button">Create Label</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
