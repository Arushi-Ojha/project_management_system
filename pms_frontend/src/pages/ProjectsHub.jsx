import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProjectsHub() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sorting
  const [sortBy, setSortBy] = useState('availability'); // 'availability' or 'position'
  const [positionFilter, setPositionFilter] = useState('');

  // Create Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadProjects();
    }
  }, [orgId]);

  useEffect(() => {
    if (selectedProject && orgId) {
      loadAvailableStaff();
    }
  }, [selectedProject?.id, sortBy, positionFilter]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await apiCall(`/execution/projects?organizationId=${orgId}&userId=${user.id}`);
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
      if (data && data.length > 0) {
        const highest = Math.max(...data.map(p => p.priority || 1));
        setPriority(highest + 1);
      } else {
        setPriority(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      let endpoint = `/iam/organizations/${orgId}/employees/availability?sort_by=${sortBy}`;
      if (positionFilter) {
        endpoint += `&position=${encodeURIComponent(positionFilter)}`;
      }
      const data = await apiCall(endpoint);
      setAvailableStaff(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      const payload = {
        name,
        description,
        deadline: deadline || null,
        priority: parseInt(priority, 10) || 1,
        organizationId: orgId,
        userId: user.id
      };
      const res = await apiCall('/execution/projects', {
        method: 'POST',
        body: payload
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setDeadline('');
      setFeedback({ type: 'success', text: `Project '${res.name}' created with Priority #${res.priority}.` });
      await loadProjects();
      setSelectedProject(res);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Creation failed' });
    } finally {
      setCreating(false);
    }
  };

  const handleAssignMember = async (employeeId) => {
    if (!selectedProject) return;
    try {
      const res = await apiCall(`/execution/projects/${selectedProject.id}/assign-member`, {
        method: 'POST',
        body: { userId: employeeId }
      });
      setFeedback({ type: 'success', text: res.message || 'Invitation email dispatched to employee.' });
      const updatedProj = await apiCall(`/execution/projects/${selectedProject.id}`);
      setSelectedProject(updatedProj);
      loadProjects();
      loadAvailableStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Assignment failed' });
    }
  };

  const handleRemoveMember = async (employeeId) => {
    if (!selectedProject) return;
    if (!confirm('Remove this employee from project? They will receive an email.')) return;
    try {
      const res = await apiCall(`/execution/projects/${selectedProject.id}/remove-member`, {
        method: 'POST',
        body: { userId: employeeId }
      });
      setFeedback({ type: 'success', text: res.message || 'Member removed.' });
      const updatedProj = await apiCall(`/execution/projects/${selectedProject.id}`);
      setSelectedProject(updatedProj);
      loadProjects();
      loadAvailableStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Removal failed' });
    }
  };

  return (
    <div className="flex-col gap-20" style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px' }}>
      
      {/* Title */}
      <div className="flex-row justify-between items-center flex-wrap gap-12" style={{ borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <div>
          <h1>Project Creation & Workload Staffing Engine</h1>
          <p style={{ fontSize: '13px' }}>
            Create projects with auto priority of 1 or custom rank, then assign employees sorted by position or availability (auto-calculated: overloaded if 3+ tasks in next 7 days or 2+ projects assigned).
          </p>
        </div>

        <button type="button" onClick={() => setShowCreateModal(true)} style={{ fontWeight: 'bold' }}>
          + Create New Project
        </button>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
          <p><strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}</p>
        </div>
      )}

      {/* Main Split Layout in Flexbox */}
      <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
        
        {/* Left Column: Projects List */}
        <div className="panel flex-col gap-12" style={{ flex: '1 1 320px' }}>
          <div className="flex-row justify-between items-center">
            <h3>Projects ({projects.length})</h3>
            <button type="button" onClick={loadProjects}>Refresh</button>
          </div>

          {projects.length === 0 ? (
            <p>No projects created yet.</p>
          ) : (
            <div className="flex-col gap-8" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              {projects.map(p => {
                const isSelected = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    style={{
                      border: isSelected ? '2px solid #000' : '1px solid #000',
                      padding: '10px',
                      background: isSelected ? '#ffffff' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    className="flex-col gap-4"
                  >
                    <div className="flex-row justify-between items-center">
                      <strong>Priority #{p.priority || 1}</strong>
                      <span>[{p.status}]</span>
                    </div>

                    <h4>{p.name}</h4>
                    <p style={{ fontSize: '12px' }}>Progress Rate: {p.progress || 0}%</p>
                    <p style={{ fontSize: '11px' }}>Deadline: {p.deadline || 'None'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Project Staffing */}
        {selectedProject ? (
          <div className="flex-col gap-16" style={{ flex: '2 1 550px' }}>
            
            {/* Project Details & Project Head */}
            <div className="panel flex-col gap-14">
              <div className="flex-row justify-between items-center flex-wrap gap-8">
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px' }}>{selectedProject.name} (Priority #{selectedProject.priority || 1})</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{selectedProject.description || 'No description provided.'}</p>
                </div>
                
                <div className="flex-row items-center gap-8">
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: '1px solid #000',
                    padding: '3px 8px',
                    background: (selectedProject.status === 'overdue' || selectedProject.calculatedStatus === 'overdue') ? '#000' : '#fff',
                    color: (selectedProject.status === 'overdue' || selectedProject.calculatedStatus === 'overdue') ? '#fff' : '#000'
                  }}>
                    [{(selectedProject.status || selectedProject.calculatedStatus || 'planned').toUpperCase().replace('_', ' ')}]
                  </span>
                  <strong style={{ fontSize: '15px' }}>Progress: {selectedProject.progress || 0}%</strong>
                </div>
              </div>

              {/* PROJECT HEAD BANNER (Manager is Project Head by default, not staff) */}
              <div style={{ border: '1px solid #000', padding: '12px', background: '#fff' }} className="flex-row items-center gap-14">
                <div
                  style={{
                    width: '54px',
                    height: '54px',
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
                      alt="Project Head"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'PM'}
                    </span>
                  )}
                </div>

                <div className="flex-col gap-2">
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>PROJECT HEAD (LEAD):</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{user.name}</span>
                  <span style={{ fontSize: '12px' }}>Role: Project Manager (Lead & Coordinator - Not a staff member)</span>
                </div>
              </div>

              <div className="flex-row justify-between items-center" style={{ fontSize: '13px' }}>
                <span><strong>Deadline:</strong> {selectedProject.deadline || 'None'}</span>
                <span><strong>Workflow Stage:</strong> {selectedProject.workflowStage || 'Backlog'}</span>
              </div>

              {/* Current Staff Roster */}
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }} className="flex-col gap-8">
                <h4 style={{ margin: 0, fontSize: '15px' }}>Assigned Staff Members ({selectedProject.assignments?.length || 0}):</h4>
                <p style={{ margin: 0, fontSize: '12px' }}>Only employees are staff. Admin is invisible and excluded from staff.</p>
                {(!selectedProject.assignments || selectedProject.assignments.length === 0) ? (
                  <p style={{ fontSize: '13px' }}>No staff members assigned yet.</p>
                ) : (
                  <div className="flex-col gap-8">
                    {selectedProject.assignments.map(asgn => {
                      const info = availableStaff.find(s => s.id === asgn.userId);
                      return (
                        <div
                          key={asgn.userId}
                          style={{ border: '1px solid #000', padding: '10px 14px', background: '#fff' }}
                          className="flex-row justify-between items-center flex-wrap gap-8"
                        >
                          <div className="flex-row items-center gap-12">
                            {/* Staff Bigger Avatar (44px) */}
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
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
                              {info?.avatarUrl ? (
                                <img
                                  src={info.avatarUrl}
                                  alt="Staff"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                  {info?.name ? info.name.slice(0, 2).toUpperCase() : 'EM'}
                                </span>
                              )}
                            </div>

                            <div className="flex-col gap-2">
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{info?.name || asgn.userId.slice(0, 8)}</span>
                              <span style={{ fontSize: '12px' }}>
                                ID: <strong>{info?.employeeId || 'EMP-?'}</strong> | {info?.position || 'Staff'}
                              </span>
                            </div>
                          </div>

                          <div className="flex-row items-center gap-10">
                            <span style={{ fontSize: '12px' }}>Invite: [{asgn.status}]</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(asgn.userId)}
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              Remove Staff
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Staffing Engine */}
            <div className="panel flex-col gap-12">
              <div className="flex-row justify-between items-center flex-wrap gap-8">
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Staff from Available Employees</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
                    Auto-calculated workload: Overloaded if $\ge$ 2 projects or $\ge$ 3 tasks in next 7 days.
                  </p>
                </div>

                <div className="flex-row gap-8 items-center flex-wrap">
                  <input
                    type="text"
                    value={positionFilter}
                    onChange={e => setPositionFilter(e.target.value)}
                    placeholder="Filter by position..."
                    style={{ width: '160px', padding: '6px' }}
                  />

                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ width: '170px', padding: '6px' }}
                  >
                    <option value="availability">Sort: Availability First</option>
                    <option value="position">Sort: By Position</option>
                  </select>
                </div>
              </div>

              {loadingStaff ? (
                <p>Calculating workloads...</p>
              ) : availableStaff.length === 0 ? (
                <p>No available employee profiles found.</p>
              ) : (
                <div className="flex-col gap-10">
                  {availableStaff
                    .filter(emp => emp.role === 'employee' || emp.role === 'member')
                    .map(emp => {
                      const isAssigned = selectedProject.assignments?.some(a => a.userId === emp.id);
                      const isOverloaded = emp.is_overloaded;

                      return (
                        <div
                          key={emp.id}
                          style={{
                            border: '1px solid #000',
                            padding: '10px 14px',
                            background: '#fff'
                          }}
                          className="flex-row justify-between items-center flex-wrap gap-12"
                        >
                          <div className="flex-row items-center gap-12">
                            {/* 44px Avatar */}
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
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
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl}
                                  alt="Employee"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                  {emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EM'}
                                </span>
                              )}
                            </div>

                            <div className="flex-col gap-2">
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{emp.name}</span>
                              <span style={{ fontSize: '12px' }}>
                                ID: <strong>{emp.employeeId || 'EMP-?'}</strong> | Position: {emp.position || 'Staff'}
                              </span>
                              <span style={{ fontSize: '11px' }}>
                                Projects: {emp.active_projects_count || 0} | Tasks (7d): {emp.tasks_next_7_days_count || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex-row items-center gap-12">
                            {isOverloaded ? (
                              <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '2px 6px' }}>
                                OVERLOADED
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', border: '1px solid #000', padding: '2px 6px' }}>
                                AVAILABLE
                              </span>
                            )}

                            {isAssigned ? (
                              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Assigned</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAssignMember(emp.id)}
                                style={{ fontWeight: 'bold', padding: '6px 12px', fontSize: '13px' }}
                              >
                                Assign & Send Email
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="panel" style={{ flex: '2 1 500px' }}>
            <p>Select a project from the left to manage staffing.</p>
          </div>
        )}

      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2>Create New Project</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <form onSubmit={handleCreateProject} className="flex-col gap-12">
              <div>
                <label>Project Title:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Migration Project, CRM Revamp"
                />
              </div>

              <div>
                <label>Description:</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex-row gap-12">
                <div style={{ flex: 1 }}>
                  <label>Deadline:</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label>Priority Rank (Auto priority 1 if no other project):</label>
                  <input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-row justify-end gap-8" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" disabled={creating} style={{ fontWeight: 'bold' }}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
