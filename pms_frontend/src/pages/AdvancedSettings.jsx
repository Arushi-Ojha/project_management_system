import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdvancedSettings() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [activeTab, setActiveTab] = useState('departments'); // 'departments', 'teams', 'projects', 'roles', 'workflows'

  // Data states
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Department Modal / Form state
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);

  // Team Modal / Form state
  const [teamName, setTeamName] = useState('');
  const [teamKey, setTeamKey] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadTabData(activeTab);
    }
  }, [orgId, activeTab]);

  const loadTabData = async (tab) => {
    setLoading(true);
    setFeedback(null);
    try {
      if (tab === 'departments') {
        const data = await apiCall(`/organizations/${orgId}/departments`);
        setDepartments(data || []);
      } else if (tab === 'teams') {
        const data = await apiCall(`/iam/organizations/${orgId}/teams`);
        setTeams(data || []);
      } else if (tab === 'projects') {
        const data = await apiCall(`/execution/projects?organizationId=${orgId}`);
        setProjects(data || []);
      } else if (tab === 'roles') {
        const data = await apiCall('/rbac/roles');
        setRoles(data || []);
      } else if (tab === 'workflows') {
        const data = await apiCall('/config/workflows');
        setWorkflows(data || []);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  // DEPARTMENT CRUD
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        await apiCall(`/departments/${editingDeptId}`, {
          method: 'PUT',
          body: {
            department_name: deptName,
            department_head: deptHead,
            department_description: deptDesc
          }
        });
        setFeedback({ type: 'success', text: 'Department updated successfully.' });
      } else {
        await apiCall(`/organizations/${orgId}/departments`, {
          method: 'POST',
          body: {
            department_name: deptName,
            department_head: deptHead,
            department_description: deptDesc
          }
        });
        setFeedback({ type: 'success', text: 'Department created successfully.' });
      }
      setShowDeptModal(false);
      setDeptName('');
      setDeptHead('');
      setDeptDesc('');
      setEditingDeptId(null);
      loadTabData('departments');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Department operation failed' });
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await apiCall(`/departments/${deptId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', text: 'Department deleted.' });
      loadTabData('departments');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  // TEAM CRUD
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/iam/teams', {
        method: 'POST',
        body: {
          name: teamName,
          key: teamKey.toUpperCase(),
          organizationId: orgId
        }
      });
      setShowTeamModal(false);
      setTeamName('');
      setTeamKey('');
      setFeedback({ type: 'success', text: 'Team created successfully.' });
      loadTabData('teams');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Team creation failed' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team?')) return;
    try {
      await apiCall(`/iam/teams/${teamId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', text: 'Team deleted.' });
      loadTabData('teams');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Cannot delete team' });
    }
  };

  // PROJECT CRUD
  const handleDeleteProject = async (projId) => {
    if (!confirm('Delete this project? Associated tasks must be cleared first.')) return;
    try {
      await apiCall(`/execution/projects/${projId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', text: 'Project deleted.' });
      loadTabData('projects');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Cannot delete project' });
    }
  };

  return (
    <div className="flex-col gap-20" style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h1>Advanced Settings: Database CRUD Operations</h1>
        <p style={{ fontSize: '13px' }}>
          Perform POST, GET, UPDATE, and DELETE operations across all database elements for your organization only.
        </p>
      </div>

      {/* Database Elements Tabs */}
      <div className="flex-row gap-8 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={activeTab === 'departments' ? 'btn-active' : ''}
        >
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={activeTab === 'teams' ? 'btn-active' : ''}
        >
          Teams & Prefix Keys ({teams.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={activeTab === 'projects' ? 'btn-active' : ''}
        >
          Projects Catalog ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workflows')}
          className={activeTab === 'workflows' ? 'btn-active' : ''}
        >
          Workflows & Stages ({workflows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={activeTab === 'roles' ? 'btn-active' : ''}
        >
          RBAC Roles ({roles.length})
        </button>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
          <p><strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}</p>
        </div>
      )}

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="panel flex-col gap-12">
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <h3>Departments Table</h3>
            <button
              type="button"
              onClick={() => {
                setEditingDeptId(null);
                setDeptName('');
                setDeptHead('');
                setDeptDesc('');
                setShowDeptModal(true);
              }}
              style={{ fontWeight: 'bold' }}
            >
              + Create Department
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Department Head</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={5}>No departments configured.</td></tr>
              ) : (
                departments.map(d => (
                  <tr key={d.department_id}>
                    <td><strong>{d.department_name}</strong></td>
                    <td>{d.department_head || 'Unassigned'}</td>
                    <td>{d.department_description || 'None'}</td>
                    <td>[{d.status}]</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeptId(d.department_id);
                          setDeptName(d.department_name);
                          setDeptHead(d.department_head || '');
                          setDeptDesc(d.department_description || '');
                          setShowDeptModal(true);
                        }}
                        style={{ marginRight: '6px' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(d.department_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: TEAMS */}
      {activeTab === 'teams' && (
        <div className="panel flex-col gap-12">
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <div>
              <h3>Teams & Prefix Keys</h3>
              <p style={{ fontSize: '12px' }}>Team keys dictate issue prefixes (e.g. ENG-142).</p>
            </div>
            <button type="button" onClick={() => setShowTeamModal(true)} style={{ fontWeight: 'bold' }}>
              + Create Team
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Key Prefix</th>
                <th>Team ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr><td colSpan={4}>No teams found.</td></tr>
              ) : (
                teams.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td>[{t.key}]</td>
                    <td style={{ fontSize: '12px' }}>{t.id}</td>
                    <td>
                      <button type="button" onClick={() => handleDeleteTeam(t.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="panel flex-col gap-12">
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <h3>Projects Oversight</h3>
            <button type="button" onClick={() => loadTabData('projects')}>Refresh Projects</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Project Name</th>
                <th>Status</th>
                <th>Progress Rate</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={6}>No projects recorded.</td></tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id}>
                    <td>#{p.priority || 1}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>[{p.status}]</td>
                    <td>{p.progress || 0}%</td>
                    <td>{p.deadline || 'None'}</td>
                    <td>
                      <button type="button" onClick={() => handleDeleteProject(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: WORKFLOWS */}
      {activeTab === 'workflows' && (
        <div className="panel flex-col gap-12">
          <h3>Workflows in Organization</h3>
          <table>
            <thead>
              <tr>
                <th>Workflow Name</th>
                <th>Workflow ID</th>
                <th>Stages / Tags</th>
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr><td colSpan={3}>No custom workflows found.</td></tr>
              ) : (
                workflows.map(w => (
                  <tr key={w.id}>
                    <td><strong>{w.name}</strong></td>
                    <td style={{ fontSize: '12px' }}>{w.id}</td>
                    <td>
                      {w.states?.map(s => `[${s.name}]`).join(' -> ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: ROLES */}
      {activeTab === 'roles' && (
        <div className="panel flex-col gap-12">
          <h3>RBAC Roles</h3>
          <table>
            <thead>
              <tr>
                <th>Role Key</th>
                <th>Role Name</th>
                <th>Scope</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr><td colSpan={4}>No roles found.</td></tr>
              ) : (
                roles.map(r => (
                  <tr key={r.role_id}>
                    <td>{r.role_key}</td>
                    <td><strong>{r.role_name}</strong></td>
                    <td>{r.scope_type}</td>
                    <td>[{r.status}]</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREATE / EDIT DEPARTMENT */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2>{editingDeptId ? 'Edit Department' : 'Create Department'}</h2>
              <button type="button" onClick={() => setShowDeptModal(false)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <form onSubmit={handleSaveDepartment} className="flex-col gap-12">
              <div>
                <label>Department Name:</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <label>Department Head:</label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={e => setDeptHead(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label>Description:</label>
                <textarea
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex-row justify-end gap-8" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" style={{ fontWeight: 'bold' }}>Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEAM */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2>Create Team</h2>
              <button type="button" onClick={() => setShowTeamModal(false)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <form onSubmit={handleSaveTeam} className="flex-col gap-12">
              <div>
                <label>Team Name:</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Core Engineering"
                />
              </div>

              <div>
                <label>Key Prefix (e.g. ENG, DES, QA):</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={teamKey}
                  onChange={e => setTeamKey(e.target.value.toUpperCase())}
                  placeholder="ENG"
                />
              </div>

              <div className="flex-row justify-end gap-8" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowTeamModal(false)}>Cancel</button>
                <button type="submit" style={{ fontWeight: 'bold' }}>Save Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
