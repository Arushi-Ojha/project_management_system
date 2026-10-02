import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TasksHub() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [workflows, setWorkflows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Create Task Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskWorkflowId, setTaskWorkflowId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState(3);

  // PM Review Modal state
  const [activeTaskForReview, setActiveTaskForReview] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadInitialData();
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      loadTasks();
    }
  }, [orgId, selectedProjectId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [projData, wfData, usersData] = await Promise.all([
        apiCall(`/execution/projects?organizationId=${orgId}`).catch(() => []),
        apiCall('/config/workflows').catch(() => []),
        apiCall(`/iam/organizations/${orgId}/users`).catch(() => [])
      ]);

      setProjects(projData || []);
      setWorkflows(wfData || []);
      setEmployees(usersData || []);

      if (projData && projData.length > 0) {
        setTaskProjectId(projData[0].id);
      }
      if (wfData && wfData.length > 0) {
        setTaskWorkflowId(wfData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      let endpoint = '/issues/';
      if (selectedProjectId && selectedProjectId !== 'ALL') {
        endpoint += `?projectId=${selectedProjectId}`;
      }
      const data = await apiCall(endpoint);
      
      // Sort tasks closer deadline first (as required by specifications)
      const sorted = (data || []).sort((a, b) => {
        const d1 = a.deadline || a.dueDate;
        const d2 = b.deadline || b.dueDate;
        if (!d1) return 1;
        if (!d2) return -1;
        return new Date(d1) - new Date(d2);
      });

      setTasks(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskProjectId) {
      alert('Please select a project for this task.');
      return;
    }

    try {
      const selectedWf = workflows.find(w => w.id === taskWorkflowId);
      const defaultStateId = selectedWf?.states?.[0]?.id || selectedWf?.states?.[0]?.name || 'assigned';

      const payload = {
        title: taskTitle,
        description: taskDesc,
        projectId: taskProjectId,
        workflowId: taskWorkflowId || null,
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

      setShowCreateModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDeadline('');
      setTaskAssigneeId('');
      setFeedback({
        type: 'success',
        text: `Created task '${res.identifier}'. Status auto-set to 'Assigned'. Notification sent to assignee.`
      });
      loadTasks();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Task creation failed' });
    }
  };

  const handleReviewTask = async (status) => {
    if (!activeTaskForReview) return;
    try {
      setReviewing(true);
      await apiCall(`/issues/${activeTaskForReview.id}/review`, {
        method: 'POST',
        body: {
          status,
          comment: reviewComment
        }
      });
      setFeedback({
        type: 'success',
        text: `Task ${activeTaskForReview.identifier} marked as '${status}'.`
      });
      setActiveTaskForReview(null);
      setReviewComment('');
      loadTasks();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  // Helper to find employee by ID
  const getEmployee = (empId) => {
    return employees.find(e => e.id === empId);
  };

  // Helper to find project by ID
  const getProject = (projId) => {
    return projects.find(p => p.id === projId);
  };

  // Helper to find workflow by ID
  const getWorkflow = (wfId) => {
    return workflows.find(w => w.id === wfId);
  };

  const selectedAssignee = employees.find(e => e.id === taskAssigneeId);

  return (
    <div className="flex-col gap-24" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* Top Header */}
      <div className="flex-row justify-between items-center flex-wrap gap-16" style={{ borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>Task Management & Workstation</h1>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Create tasks with closer-deadline priority sorting, assign to employees with avatar & ID, and review submitted reports.
          </p>
        </div>

        <div className="flex-row gap-12 items-center flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ fontWeight: 'bold', padding: '10px 18px', fontSize: '15px' }}
          >
            + Create New Task
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '12px', background: '#fff' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="panel flex-row justify-between items-center flex-wrap gap-16" style={{ padding: '14px' }}>
        <div className="flex-row items-center gap-12 flex-wrap">
          <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Filter by Project:</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ fontSize: '14px', padding: '6px 12px', minWidth: '220px' }}
          >
            <option value="ALL">All Projects ({tasks.length} tasks)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                Priority #{p.priority || 1} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: '13px' }}>
          Total Listed Tasks: <strong>{tasks.length}</strong> (Sorted closer deadline first)
        </span>
      </div>

      {/* TASKS LIST */}
      <div className="flex-col gap-12">
        {tasks.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No Tasks Found</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Create a task using the button above to assign deliverables to employees.
            </p>
          </div>
        ) : (
          tasks.map(task => {
            const assignee = getEmployee(task.assigneeId);
            const project = getProject(task.projectId);
            const wf = getWorkflow(task.workflowId);

            return (
              <div
                key={task.id}
                className="panel flex-row justify-between items-center flex-wrap gap-16"
                style={{
                  padding: '16px',
                  border: task.deadlineConflict ? '2px solid #000' : '1px solid #000'
                }}
              >
                {/* Left: Task Info */}
                <div className="flex-col gap-6" style={{ flex: '1 1 360px' }}>
                  <div className="flex-row items-center gap-8 flex-wrap">
                    <span style={{ fontSize: '14px', fontWeight: 'bold', border: '1px solid #000', padding: '2px 8px' }}>
                      {task.identifier}
                    </span>
                    <span style={{ fontSize: '12px' }}>
                      Priority: {task.priority === 1 ? '1 - Urgent' : task.priority === 2 ? '2 - High' : task.priority === 3 ? '3 - Medium' : '4 - Low'}
                    </span>
                    <span style={{ fontSize: '12px', border: '1px solid #000', padding: '1px 6px' }}>
                      Status: [{task.status || 'assigned'}]
                    </span>
                    {task.deadlineConflict && (
                      <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '1px 6px' }}>
                        [Shared Deadline Flagged]
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: 0, fontSize: '18px' }}>{task.title}</h3>

                  {task.description && (
                    <p style={{ margin: 0, fontSize: '13px' }}>{task.description}</p>
                  )}

                  <div className="flex-row gap-16 flex-wrap" style={{ fontSize: '12px', marginTop: '2px' }}>
                    <span>Project: <strong>{project?.name || 'Unlinked'}</strong></span>
                    {wf && <span>Workflow: <strong>{wf.name}</strong></span>}
                    <span>Deadline: <strong>{task.deadline || task.dueDate || 'None set'}</strong></span>
                  </div>
                </div>

                {/* Center: Assignee Card (Employee ID, Name, Circular Avatar) */}
                <div
                  style={{
                    border: '1px solid #000',
                    padding: '10px 14px',
                    minWidth: '240px',
                    background: '#fff'
                  }}
                  className="flex-row items-center gap-12"
                >
                  {/* Circular Avatar (Bigger 56px) */}
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
                    {assignee?.avatarUrl ? (
                      <img
                        src={assignee.avatarUrl}
                        alt={assignee.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                        {assignee?.name ? assignee.name.slice(0, 2).toUpperCase() : 'NA'}
                      </span>
                    )}
                  </div>

                  {/* Employee Details */}
                  <div className="flex-col gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      {assignee?.name || 'Unassigned Staff'}
                    </span>
                    <span style={{ fontSize: '12px' }}>
                      ID: <strong>{assignee?.employeeId || 'No Emp ID'}</strong>
                    </span>
                    {assignee?.position && (
                      <span style={{ fontSize: '11px' }}>{assignee.position}</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions & Review */}
                <div className="flex-col gap-8 items-end" style={{ minWidth: '180px' }}>
                  {task.reportText ? (
                    <div className="flex-col gap-4 items-end">
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        [Report Attached]
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskForReview(task);
                          setReviewComment(task.approvalComment || '');
                        }}
                        style={{ fontWeight: 'bold', padding: '6px 14px', fontSize: '13px' }}
                      >
                        Review Deliverables
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px' }}>No report submitted</span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE TASK */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Create Task</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  Select project, workflow, and assign directly to an employee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ fontWeight: 'bold', padding: '6px 12px' }}
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex-col gap-14">
              
              {/* Task Title */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Task Title:
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth JWT Authentication"
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>

              {/* Task Description */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Instructions / Description:
                </label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Detailed task description and acceptance criteria..."
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>

              {/* Project & Workflow Selection */}
              <div className="flex-row gap-16 flex-wrap">
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    Project:
                  </label>
                  <select
                    required
                    value={taskProjectId}
                    onChange={e => setTaskProjectId(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 10px' }}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        Priority #{p.priority || 1} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    Select Workflow:
                  </label>
                  <select
                    value={taskWorkflowId}
                    onChange={e => setTaskWorkflowId(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 10px' }}
                  >
                    <option value="">Default Development Flow</option>
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.states?.length || 0} stages)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee Selection (Employee ID, Name, Avatar) */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Assign to Employee (Select by Employee ID & Name):
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={e => setTaskAssigneeId(e.target.value)}
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                >
                  <option value="">-- Leave Unassigned --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId || 'EMP-?'} - {emp.name || emp.email} ({emp.position || emp.role})
                    </option>
                  ))}
                </select>

                {/* Show Preview of Selected Employee */}
                {selectedAssignee && (
                  <div
                    style={{
                      border: '1px solid #000',
                      padding: '8px 12px',
                      marginTop: '8px',
                      background: '#fff'
                    }}
                    className="flex-row items-center gap-12"
                  >
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
                      {selectedAssignee.avatarUrl ? (
                        <img
                          src={selectedAssignee.avatarUrl}
                          alt={selectedAssignee.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                          {selectedAssignee.name ? selectedAssignee.name.slice(0, 2).toUpperCase() : 'NA'}
                        </span>
                      )}
                    </div>
                    <div className="flex-col gap-2">
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        Selected: {selectedAssignee.name}
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        Employee ID: <strong>{selectedAssignee.employeeId || 'None'}</strong> | Position: {selectedAssignee.position || 'Staff'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Deadline & Priority */}
              <div className="flex-row gap-16 flex-wrap">
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    Task Deadline:
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 10px' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    Priority:
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 10px' }}
                  >
                    <option value={1}>1 - Urgent (Closer Deadline Priority)</option>
                    <option value={2}>2 - High</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Low</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-row justify-end gap-14" style={{ borderTop: '1px solid #000', paddingTop: '14px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 18px', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ fontWeight: 'bold', padding: '8px 22px', fontSize: '14px' }}
                >
                  Create Task & Dispatch Invite
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PM REVIEW DELIVERABLES */}
      {activeTaskForReview && (
        <div className="modal-overlay" onClick={() => setActiveTaskForReview(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>
                  Review Deliverables: {activeTaskForReview.identifier}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  {activeTaskForReview.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskForReview(null)}
                style={{ fontWeight: 'bold', padding: '6px 12px' }}
              >
                Close [X]
              </button>
            </div>

            <div className="flex-col gap-14">
              
              {/* Submission Details */}
              <div style={{ border: '2px solid #000', padding: '14px', background: '#fff' }} className="flex-col gap-8">
                <h4 style={{ margin: 0, fontSize: '15px' }}>Employee Submitted Deliverables:</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Report Summary:</strong> {activeTaskForReview.reportText}
                </p>

                {activeTaskForReview.githubUrl && (
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    <strong>GitHub Repo / PR:</strong>{' '}
                    <a href={activeTaskForReview.githubUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                      {activeTaskForReview.githubUrl}
                    </a>
                  </p>
                )}

                {activeTaskForReview.dockerfileUrl && (
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    <strong>Dockerfile / Deployment URL:</strong>{' '}
                    <a href={activeTaskForReview.dockerfileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                      {activeTaskForReview.dockerfileUrl}
                    </a>
                  </p>
                )}
              </div>

              {/* Manager Feedback Comment */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Manager Review Feedback / Notes:
                </label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Provide feedback or revision instructions for employee..."
                  rows={3}
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex-row justify-end gap-14" style={{ borderTop: '1px solid #000', paddingTop: '14px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleReviewTask('changes_requested')}
                  disabled={reviewing}
                  style={{ padding: '8px 18px', fontSize: '14px' }}
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewTask('approved')}
                  disabled={reviewing}
                  style={{ fontWeight: 'bold', padding: '8px 22px', fontSize: '14px' }}
                >
                  Approve & Mark Completed
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
