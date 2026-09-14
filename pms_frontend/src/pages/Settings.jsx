import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Workflow, FolderGit2, Plus, UserPlus, Tag, Trash2, Edit2, AlertCircle } from 'lucide-react';

// Reusable Conflict Modal
function ConflictModal({ isOpen, message, onClose }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '32px', border: '2px solid var(--color-gray)', maxWidth: '500px', width: '100%' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'red' }}>
          <AlertCircle /> Suggestion / Conflict
        </h3>
        <p style={{ marginTop: '16px', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="glass-button">Acknowledge</button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, organization } = useAuth();
  const [activeTab, setActiveTab] = useState('teams');
  
  // Data States
  const [teams, setTeams] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [labels, setLabels] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Form States
  const [newTeam, setNewTeam] = useState({ name: '', key: '', leadId: '' });
  const [newProject, setNewProject] = useState({ name: '', teamId: '', workflowId: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member' });
  
  // Visual Builder States
  const [newWorkflow, setNewWorkflow] = useState({ name: '', states: [{ name: 'Backlog', category: 'backlog', color: '#cccccc' }] });
  const [newLabel, setNewLabel] = useState({ name: '', color: '#ff0000', workflowId: '' });
  
  // Modal State
  const [conflictMsg, setConflictMsg] = useState(null);

  useEffect(() => {
    if (organization) {
      loadTeams();
      loadWorkflows();
      loadUsers();
      loadLabels();
      loadProjects();
    }
  }, [organization]);

  const loadTeams = async () => {
    try {
      const data = await apiCall(`/iam/organizations/${organization.id}/teams`);
      setTeams(data);
    } catch (e) { console.error(e); }
  };
  
  const loadProjects = async () => {
    try {
      const data = await apiCall(`/execution/projects?organizationId=${organization.id}`);
      setProjects(data);
    } catch (e) { console.error(e); }
  };

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

  const loadUsers = async () => {
    try {
      const data = await apiCall(`/iam/organizations/${organization.id}/users`);
      setOrgUsers(data);
    } catch (e) { console.error(e); }
  };

  // --- ENTITY MANAGEMENT (CRUD) ---
  
  const createTeam = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/iam/teams', {
        method: 'POST',
        body: { ...newTeam, organizationId: organization.id }
      });
      setNewTeam({ name: '', key: '', leadId: '' });
      loadTeams();
    } catch (e) { alert(e.message); }
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await apiCall(`/iam/teams/${teamId}`, { method: 'DELETE' });
      loadTeams();
    } catch (e) {
      if (e.message.includes('Conflict')) {
        setConflictMsg(e.message);
      } else {
        alert(e.message);
      }
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/execution/projects', {
        method: 'POST',
        body: {
          name: newProject.name,
          organizationId: organization.id,
          teamIds: [newProject.teamId],
          workflowId: newProject.workflowId
        }
      });
      setNewProject({ name: '', teamId: '', workflowId: '' });
      loadProjects();
    } catch (e) { alert(e.message); }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await apiCall(`/execution/projects/${projectId}`, { method: 'DELETE' });
      loadProjects();
    } catch (e) {
      if (e.message.includes('Conflict')) {
        setConflictMsg(e.message);
      } else {
        alert(e.message);
      }
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/iam/users', { method: 'POST', body: newUser });
      setNewUser({ name: '', email: '', role: 'member' });
      loadUsers();
      alert("User invited!");
    } catch (e) { alert(e.message); }
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

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>You must be an admin to view Workspace Settings.</div>;
  }
  
  return (
    <div className="container" style={{ marginTop: '32px' }}>
      <ConflictModal isOpen={!!conflictMsg} message={conflictMsg} onClose={() => setConflictMsg(null)} />
      
      <h1 style={{ marginBottom: '24px' }}>Workspace Settings</h1>
      
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setActiveTab('teams')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'teams' ? 'var(--color-peach)' : '' }}>
            <Users size={18} /> Teams
          </button>
          <button onClick={() => setActiveTab('projects')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'projects' ? 'var(--color-peach)' : '' }}>
            <FolderGit2 size={18} /> Projects
          </button>
          <button onClick={() => setActiveTab('users')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'users' ? 'var(--color-peach)' : '' }}>
            <UserPlus size={18} /> Users
          </button>
          <button onClick={() => setActiveTab('workflows')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'workflows' ? 'var(--color-peach)' : '' }}>
            <Workflow size={18} /> Visual Workflows
          </button>
          <button onClick={() => setActiveTab('labels')} className={`glass-button`} style={{ width: '100%', justifyContent: 'flex-start', backgroundColor: activeTab === 'labels' ? 'var(--color-peach)' : '' }}>
            <Tag size={18} /> Visual Labels
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff' }}>

          {activeTab === 'teams' && (
            <div>
              <h3>Manage Teams</h3>
              <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Teams are assigned to Projects and led by a Team Lead.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {teams.map(t => {
                  const lead = orgUsers.find(u => u.id === t.leadId);
                  return (
                    <div key={t.id} style={{ padding: '16px', border: '2px solid var(--color-gray)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lead: {lead ? lead.name : 'Unassigned'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button onClick={() => deleteTeam(t.id)} className="glass-button" style={{ padding: '4px', color: 'red' }}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={createTeam} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', padding: '24px', border: '2px solid var(--color-gray)' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label">Team Name</label>
                  <input required type="text" className="input-field" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} placeholder="e.g. Mobile App Team" />
                </div>
                <div style={{ width: '100px' }}>
                  <label className="label">Key</label>
                  <input required type="text" className="input-field" value={newTeam.key} onChange={e => setNewTeam({...newTeam, key: e.target.value})} placeholder="e.g. MOB" />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="label">Assign Team Lead</label>
                  <select required className="input-field" value={newTeam.leadId} onChange={e => setNewTeam({...newTeam, leadId: e.target.value})}>
                    <option value="" disabled>Select a lead...</option>
                    {orgUsers.filter(u => u.role === 'admin' || u.role === 'owner').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="primary-button"><Plus size={18}/> Create</button>
              </form>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h3>Manage Projects</h3>
              <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Initialize a new project or manage existing ones.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {projects.map(p => {
                  return (
                    <div key={p.id} style={{ padding: '16px', border: '2px solid var(--color-gray)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: {p.status}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button onClick={() => deleteProject(p.id)} className="glass-button" style={{ padding: '4px', color: 'red' }}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', border: '2px solid var(--color-gray)' }}>
                <div>
                  <label className="label">Project Name</label>
                  <input required type="text" className="input-field" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Q4 Website Redesign" />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Assign to Team</label>
                    <select required className="input-field" value={newProject.teamId} onChange={e => setNewProject({...newProject, teamId: e.target.value})}>
                      <option value="" disabled>Select a team...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Base Workflow</label>
                    <select required className="input-field" value={newProject.workflowId} onChange={e => setNewProject({...newProject, workflowId: e.target.value})}>
                      <option value="" disabled>Select a workflow...</option>
                      {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="primary-button" style={{ alignSelf: 'flex-start', marginTop: '8px' }}><Plus size={18}/> Form Project</button>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3>Create User</h3>
              <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Invite a new user to the workspace.</p>
              <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', border: '2px solid var(--color-gray)' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Full Name</label>
                    <input required type="text" className="input-field" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Email Address</label>
                    <input required type="email" className="input-field" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input-field" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="member">Member</option>
                      <option value="admin">Admin (Team Lead)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="primary-button" style={{ alignSelf: 'flex-start', marginTop: '8px' }}><Plus size={18}/> Invite User</button>
              </form>
            </div>
          )}
          
          {activeTab === 'workflows' && (
            <div>
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
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={handleAddState} className="glass-button"><Plus size={18}/> Add State</button>
                  <button type="submit" className="primary-button"><FolderGit2 size={18}/> Save Workflow</button>
                </div>
              </form>
              
              <h4 style={{ marginTop: '32px', marginBottom: '16px' }}>Existing Workflows</h4>
              <ul>
                {workflows.map(w => (
                  <li key={w.id} style={{ marginBottom: '8px' }}>
                    <strong>{w.name}</strong> 
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {w.states.map(s => (
                        <span key={s.id} style={{ fontSize: '0.75rem', padding: '2px 6px', background: s.color || '#eee', borderRadius: '4px' }}>{s.name}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'labels' && (
            <div>
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
                  <button type="submit" className="primary-button"><Plus size={18}/> Create</button>
                </div>
              </form>
              
              <h4 style={{ marginTop: '32px', marginBottom: '16px' }}>Existing Labels</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {labels.map(l => (
                  <span key={l.id} style={{ background: l.color, color: '#fff', padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #000' }}>
                    {l.name} {l.workflowId && `(Workflow ID: ${l.workflowId.substring(0,6)})`}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
