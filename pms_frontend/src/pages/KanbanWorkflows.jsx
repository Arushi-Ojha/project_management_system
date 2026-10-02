import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function KanbanWorkflows() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Workflow Builder
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfTags, setWfTags] = useState([
    { name: 'Backlog', category: 'backlog', color: '#000000' },
    { name: 'In Progress', category: 'started', color: '#000000' },
    { name: 'Review Pending', category: 'started', color: '#000000' },
    { name: 'Completed', category: 'completed', color: '#000000' }
  ]);

  // Create Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskTeamId, setTaskTeamId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState(3);

  // Task Details / PM Review Modal
  const [activeTask, setActiveTask] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadInitialData();
    }
  }, [orgId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectIssues(selectedProjectId);
      const proj = projects.find(p => p.id === selectedProjectId);
      setSelectedProject(proj);
    }
  }, [selectedProjectId, projects]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [projData, wfData, teamData] = await Promise.all([
        apiCall(`/execution/projects?organizationId=${orgId}`).catch(() => []),
        apiCall('/config/workflows').catch(() => []),
        apiCall(`/iam/organizations/${orgId}/teams`).catch(() => [])
      ]);
      setProjects(projData || []);
      setWorkflows(wfData || []);
      setTeams(teamData || []);

      if (projData && projData.length > 0) {
        setSelectedProjectId(projData[0].id);
      }
      if (teamData && teamData.length > 0) {
        setTaskTeamId(teamData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectIssues = async (projId) => {
    try {
      const data = await apiCall(`/issues/?projectId=${projId}`);
      setIssues(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // WORKFLOW CREATION
  const handleAddTag = () => {
    setWfTags([...wfTags, { name: 'New Tag Stage', category: 'started', color: '#000000' }]);
  };

  const handleUpdateTag = (index, field, value) => {
    const updated = [...wfTags];
    updated[index][field] = value;
    setWfTags(updated);
  };

  const handleRemoveTag = (index) => {
    setWfTags(wfTags.filter((_, i) => i !== index));
  };

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: wfName,
        states: wfTags.map((t, idx) => ({
          name: t.name,
          category: t.category,
          color: t.color || '#000000',
          position: idx
        }))
      };
      const res = await apiCall('/config/workflows', {
        method: 'POST',
        body: payload
      });
      setWorkflows([...workflows, res]);
      setShowWorkflowModal(false);
      setWfName('');
      setFeedback({ type: 'success', text: `Workflow '${res.name}' created with ${res.states.length} tag stages.` });

      if (selectedProjectId) {
        await handleAssignWorkflowToProject(res.id);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Creation failed' });
    }
  };

  const handleAssignWorkflowToProject = async (wfId) => {
    if (!selectedProjectId) return;
    try {
      await apiCall(`/execution/projects/${selectedProjectId}`, {
        method: 'PATCH',
        body: { workflowId: wfId }
      });
      setFeedback({ type: 'success', text: 'Workflow successfully assigned to project.' });
      const updatedProj = await apiCall(`/execution/projects/${selectedProjectId}`);
      setSelectedProject(updatedProj);
      setProjects(projects.map(p => p.id === selectedProjectId ? updatedProj : p));
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to assign workflow' });
    }
  };

  // TASK CREATION
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTeamId) {
      alert('Please select a team.');
      return;
    }
    try {
      const currentWf = workflows.find(w => w.id === selectedProject?.workflowId);
      const defaultStateId = currentWf?.states?.[0]?.id || 'backlog';

      const payload = {
        title: taskTitle,
        description: taskDesc,
        teamId: taskTeamId,
        projectId: selectedProjectId,
        stateId: defaultStateId,
        assigneeId: taskAssigneeId || null,
        deadline: taskDeadline || null,
        dueDate: taskDeadline || null,
        priority: parseInt(taskPriority, 10)
      };

      const res = await apiCall('/issues/', {
        method: 'POST',
        body: payload
      });

      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDeadline('');
      setFeedback({ type: 'success', text: `Created task ${res.identifier}. Status auto-set to Assigned.` });
      loadProjectIssues(selectedProjectId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Task creation failed' });
    }
  };

  // UPDATE STATE
  const handleUpdateTaskState = async (issueId, newStateId) => {
    try {
      await apiCall(`/issues/${issueId}`, {
        method: 'PATCH',
        body: { stateId: newStateId }
      });
      loadProjectIssues(selectedProjectId);
    } catch (err) {
      console.error(err);
    }
  };

  // PM REVIEW
  const handleReviewTask = async (status) => {
    if (!activeTask) return;
    try {
      setReviewing(true);
      await apiCall(`/issues/${activeTask.id}/review`, {
        method: 'POST',
        body: {
          status,
          comment: reviewComment
        }
      });
      setFeedback({
        type: 'success',
        text: `Task ${activeTask.identifier} was marked as '${status}'.`
      });
      setActiveTask(null);
      setReviewComment('');
      loadProjectIssues(selectedProjectId);
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const activeWf = workflows.find(w => w.id === selectedProject?.workflowId);
  const columns = activeWf?.states && activeWf.states.length > 0
    ? activeWf.states
    : [
        { id: 'assigned', name: 'Assigned / Backlog' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'review_pending', name: 'Review Pending' },
        { id: 'completed', name: 'Completed & Approved' }
      ];

  return (
    <div className="flex-col gap-20" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      
      {/* Top Header */}
      <div className="flex-row justify-between items-center flex-wrap gap-12" style={{ borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <div>
          <h1>Workflows & Kanban Taskboard</h1>
          <p style={{ fontSize: '13px' }}>
            Create workflows by putting workflow name, tags, and colors for each tag, then assign to projects. Create tasks with deadlines (closer deadline given priority; shared deadlines flagged for accept/reject).
          </p>
        </div>

        <div className="flex-row gap-8 items-center flex-wrap">
          <label style={{ margin: 0, fontWeight: 'bold' }}>Active Project:</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ width: '220px' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                Priority #{p.priority} - {p.name}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setShowWorkflowModal(true)} style={{ fontWeight: 'bold' }}>
            + Create Workflow
          </button>

          <button type="button" onClick={() => setShowTaskModal(true)} disabled={!selectedProjectId} style={{ fontWeight: 'bold' }}>
            + Create Task
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
          <p><strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}</p>
        </div>
      )}

      {/* Workflow Assignment Bar */}
      <div className="panel flex-row justify-between items-center flex-wrap gap-12">
        <div className="flex-row gap-12 items-center flex-wrap">
          <strong>Workflow Assigned:</strong>
          <span>{activeWf?.name || 'Default Flow'}</span>
          <div className="flex-row gap-4 flex-wrap">
            {columns.map(c => (
              <span key={c.id} className="tag">[{c.name}]</span>
            ))}
          </div>
        </div>

        {workflows.length > 0 && (
          <div className="flex-row gap-8 items-center">
            <span>Assign Different Workflow:</span>
            <select
              value={selectedProject?.workflowId || ''}
              onChange={e => handleAssignWorkflowToProject(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">Default Flow</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board Columns in Flexbox */}
      <div className="flex-row gap-16 flex-wrap" style={{ alignItems: 'flex-start' }}>
        {columns.map(col => {
          const colIssues = issues.filter(issue => 
            issue.stateId === col.id || 
            issue.status === col.id ||
            (col.name.toLowerCase().includes('review') && issue.status === 'review_pending') ||
            (col.name.toLowerCase().includes('completed') && (issue.status === 'completed' || issue.status === 'approved')) ||
            (col.name.toLowerCase().includes('progress') && issue.status === 'in_progress') ||
            (col.name.toLowerCase().includes('backlog') && (!issue.status || issue.status === 'assigned'))
          );

          return (
            <div
              key={col.id}
              className="panel flex-col gap-12"
              style={{ flex: '1 1 280px', minHeight: '450px' }}
            >
              <div className="flex-row justify-between items-center" style={{ borderBottom: '1px solid #000', paddingBottom: '6px' }}>
                <h4>{col.name}</h4>
                <strong>({colIssues.length})</strong>
              </div>

              <div className="flex-col gap-8">
                {colIssues.length === 0 ? (
                  <p style={{ fontSize: '12px' }}>Empty stage</p>
                ) : (
                  colIssues.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setActiveTask(task)}
                      style={{
                        border: '1px solid #000',
                        padding: '10px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                      className="flex-col gap-4"
                    >
                      <div className="flex-row justify-between items-center">
                        <strong>{task.identifier}</strong>
                        <span>Priority: {task.priority}</span>
                      </div>

                      <h4>{task.title}</h4>

                      {(task.deadline || task.dueDate) && (
                        <p style={{ fontSize: '11px' }}>
                          Deadline: {task.deadline || task.dueDate}
                          {task.deadlineConflict && <strong> (Shared Deadline)</strong>}
                        </p>
                      )}

                      {task.reportText && (
                        <p style={{ fontSize: '11px', fontWeight: 'bold' }}>
                          [Report Attached - Review Pending]
                        </p>
                      )}

                      <div className="flex-row justify-between items-center" style={{ borderTop: '1px dotted #000', paddingTop: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px' }}>Move Stage:</span>
                        <select
                          value={task.stateId || col.id}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateTaskState(task.id, e.target.value);
                          }}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 'auto', fontSize: '11px', padding: '2px' }}
                        >
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: WORKFLOW BUILDER (Name, tags, colors) */}
      {showWorkflowModal && (
        <div className="modal-overlay" onClick={() => setShowWorkflowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2>Workflow Builder (Name, Tags & Colors)</h2>
              <button type="button" onClick={() => setShowWorkflowModal(false)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="flex-col gap-12">
              <div>
                <label>Workflow Name:</label>
                <input
                  type="text"
                  required
                  value={wfName}
                  onChange={e => setWfName(e.target.value)}
                  placeholder="e.g. Standard Development Flow"
                />
              </div>

              <div>
                <div className="flex-row justify-between items-center" style={{ marginBottom: '6px' }}>
                  <label>Tags / Stages & Color Hex:</label>
                  <button type="button" onClick={handleAddTag}>+ Add Tag Stage</button>
                </div>

                <div className="flex-col gap-8" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {wfTags.map((tag, idx) => (
                    <div key={idx} className="flex-row gap-8 items-center">
                      <input
                        type="color"
                        value={tag.color}
                        onChange={e => handleUpdateTag(idx, 'color', e.target.value)}
                        style={{ width: '36px', height: '32px', padding: 0 }}
                      />
                      <input
                        type="text"
                        required
                        value={tag.name}
                        onChange={e => handleUpdateTag(idx, 'name', e.target.value)}
                        placeholder="Stage Tag Name"
                        style={{ flex: 1 }}
                      />
                      {wfTags.length > 1 && (
                        <button type="button" onClick={() => handleRemoveTag(idx)}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-row justify-end gap-8" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowWorkflowModal(false)}>Cancel</button>
                <button type="submit" style={{ fontWeight: 'bold' }}>Save Workflow & Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE TASK */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2>Create Task under Project</h2>
              <button type="button" onClick={() => setShowTaskModal(false)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <form onSubmit={handleCreateTask} className="flex-col gap-12">
              <div>
                <label>Task Title:</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Task Title"
                />
              </div>

              <div>
                <label>Instructions / Description:</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex-row gap-12">
                <div style={{ flex: 1 }}>
                  <label>Team (Prefix Key):</label>
                  <select
                    required
                    value={taskTeamId}
                    onChange={e => setTaskTeamId(e.target.value)}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.key})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label>Assignee:</label>
                  <select
                    value={taskAssigneeId}
                    onChange={e => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {selectedProject?.assignments?.map(asgn => (
                      <option key={asgn.userId} value={asgn.userId}>
                        Staff {asgn.userId.slice(0, 6)} [{asgn.status}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-row gap-12">
                <div style={{ flex: 1 }}>
                  <label>Deadline:</label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label>Priority (1: Urgent, 4: Low):</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                  >
                    <option value={1}>1 - Urgent</option>
                    <option value={2}>2 - High</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Low</option>
                  </select>
                </div>
              </div>

              <div className="flex-row justify-end gap-8" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" style={{ fontWeight: 'bold' }}>Create Task & Auto-Set Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PM TASK REVIEW MODAL */}
      {activeTask && (
        <div className="modal-overlay" onClick={() => setActiveTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <div>
                <h2>{activeTask.identifier}: {activeTask.title}</h2>
                <p style={{ fontSize: '12px' }}>Status: [{activeTask.status || 'assigned'}]</p>
              </div>
              <button type="button" onClick={() => setActiveTask(null)} style={{ fontWeight: 'bold' }}>Close [X]</button>
            </div>

            <div className="flex-col gap-12">
              <div style={{ border: '1px solid #000', padding: '10px' }}>
                <p><strong>Description:</strong> {activeTask.description || 'None'}</p>
                <p><strong>Deadline:</strong> {activeTask.deadline || activeTask.dueDate || 'None'}</p>
              </div>

              {/* Employee Submitted Report */}
              {activeTask.reportText ? (
                <div style={{ border: '2px solid #000', padding: '12px' }} className="flex-col gap-8">
                  <h4>Employee Submitted Work Deliverables:</h4>
                  <p><strong>Report:</strong> {activeTask.reportText}</p>
                  
                  {activeTask.githubUrl && (
                    <p><strong>GitHub Link:</strong> <a href={activeTask.githubUrl} target="_blank" rel="noreferrer">{activeTask.githubUrl}</a></p>
                  )}
                  {activeTask.dockerfileUrl && (
                    <p><strong>Dockerfile Link:</strong> <a href={activeTask.dockerfileUrl} target="_blank" rel="noreferrer">{activeTask.dockerfileUrl}</a></p>
                  )}

                  <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }} className="flex-col gap-8">
                    <label>Manager Feedback / Review Comment:</label>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Comment for employee..."
                      rows={2}
                    />

                    <div className="flex-row justify-end gap-8">
                      <button
                        type="button"
                        onClick={() => handleReviewTask('changes_requested')}
                        disabled={reviewing}
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewTask('approved')}
                        disabled={reviewing}
                        style={{ fontWeight: 'bold' }}
                      >
                        Approve & Mark Completed
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px' }}>No report submitted by employee yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
