import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MeetSchedulerModal from '../components/MeetSchedulerModal';

export default function EmployeeTasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form states
  const [reportText, setReportText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [dockerfileUrl, setDockerfileUrl] = useState('');
  const [taskStatus, setTaskStatus] = useState('in_progress');

  // Google Meet Modal
  const [showMeetModal, setShowMeetModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const t = tasks.find(x => x.id === selectedTaskId);
      if (t) {
        setActiveTask(t);
        setReportText(t.reportText || '');
        setGithubUrl(t.githubUrl || '');
        setDockerfileUrl(t.dockerfileUrl || '');
        setTaskStatus(t.status || 'in_progress');
      }
    }
  }, [selectedTaskId, tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/issues/?assigneeId=${user.id}`);
      setTasks(data || []);
      if (data && data.length > 0 && !selectedTaskId) {
        setSelectedTaskId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusOnly = async (newStatus) => {
    if (!activeTask) return;
    try {
      await apiCall(`/issues/${activeTask.id}`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      setTaskStatus(newStatus);
      setFeedback({ type: 'success', text: `Status updated to '${newStatus}'.` });
      loadTasks();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Status update failed' });
    }
  };

  const handleTaskResponse = async (action) => {
    if (!activeTask) return;
    try {
      await apiCall(`/issues/${activeTask.id}`, {
        method: 'PATCH',
        body: { assignmentStatus: action }
      });
      setFeedback({ type: 'success', text: `Task assignment ${action}ed.` });
      loadTasks();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    try {
      setSubmitting(true);
      setFeedback(null);
      const payload = {
        reportText,
        githubUrl: githubUrl || null,
        dockerfileUrl: dockerfileUrl || null
      };
      const res = await apiCall(`/issues/${activeTask.id}/submit-report`, {
        method: 'POST',
        body: payload
      });
      setFeedback({
        type: 'success',
        text: `Task report submitted for ${res.identifier}. An approval request has been sent to your Project Manager.`
      });
      loadTasks();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-col gap-20" style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px' }}>
      
      {/* Title & Quick Meet Link */}
      <div className="flex-row justify-between items-center flex-wrap gap-12" style={{ borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <div>
          <h1>Task Deliverables & Approval Workstation</h1>
          <p style={{ fontSize: '13px' }}>
            Update task status, submit work report, attach GitHub or Dockerfile links for viewing, and send approval requests to the Project Manager.
          </p>
        </div>

        <button type="button" onClick={() => setShowMeetModal(true)} style={{ fontWeight: 'bold' }}>
          Request Google Meet (Auto Email All)
        </button>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
          <p><strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}</p>
        </div>
      )}

      {/* Main Flex Layout */}
      <div className="flex-row gap-20 flex-wrap" style={{ alignItems: 'flex-start' }}>
        
        {/* Left Column: Tasks Queue Selector */}
        <div className="panel flex-col gap-12" style={{ flex: '1 1 300px' }}>
          <h3>My Assigned Tasks ({tasks.length})</h3>

          {tasks.length === 0 ? (
            <p>No tasks assigned.</p>
          ) : (
            <div className="flex-col gap-8" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              {tasks.map(t => {
                const isSelected = selectedTaskId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    style={{
                      border: isSelected ? '2px solid #000' : '1px solid #000',
                      padding: '10px',
                      cursor: 'pointer',
                      background: '#fff'
                    }}
                    className="flex-col gap-4"
                  >
                    <div className="flex-row justify-between items-center">
                      <strong>{t.identifier}</strong>
                      <span className="tag">[{t.status || 'assigned'}]</span>
                    </div>

                    <h4>{t.title}</h4>
                    <p style={{ fontSize: '11px' }}>Deadline: {t.deadline || t.dueDate || 'None'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Workstation & Deliverables Form */}
        {activeTask ? (
          <div className="flex-col gap-16" style={{ flex: '2 1 500px' }}>
            
            {/* Task Overview */}
            <div className="panel flex-col gap-12">
              <div className="flex-row justify-between items-center">
                <h2>{activeTask.identifier}: {activeTask.title}</h2>
                <span className="tag">[{activeTask.status || 'assigned'}]</span>
              </div>
              <p>{activeTask.description || 'No description provided.'}</p>
              <p><strong>Deadline:</strong> {activeTask.deadline || activeTask.dueDate || 'None'}</p>

              {/* Status Update Dropdown */}
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }} className="flex-row items-center gap-12 flex-wrap">
                <label style={{ margin: 0 }}>Update Task Status:</label>
                <select
                  value={taskStatus}
                  onChange={e => handleUpdateStatusOnly(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review_pending">Review Pending</option>
                  <option value="completed">Completed</option>
                </select>

                {activeTask.deadlineConflict && (
                  <div className="flex-row gap-8 items-center">
                    <span>(Same Deadline detected):</span>
                    <button type="button" onClick={() => handleTaskResponse('accepted')}>Accept</button>
                    <button type="button" onClick={() => handleTaskResponse('rejected')}>Reject</button>
                  </div>
                )}
              </div>
            </div>

            {/* PM Feedback Section if changes requested or approved */}
            {activeTask.approvalComment && (
              <div style={{ border: '2px solid #000', padding: '12px' }} className="flex-col gap-4">
                <h4>Manager Review Feedback ([{activeTask.approvalStatus}]):</h4>
                <p>{activeTask.approvalComment}</p>
              </div>
            )}

            {/* Work Deliverables Form */}
            <div className="panel flex-col gap-12">
              <h3>Submit Task Report & Request PM Approval</h3>
              <p style={{ fontSize: '13px' }}>
                Submit your task report, GitHub repository or pull request link, and Dockerfile link for viewing.
              </p>

              <form onSubmit={handleSubmitReport} className="flex-col gap-12">
                <div>
                  <label>Task Report / Implementation Summary:</label>
                  <textarea
                    required
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                    placeholder="Enter summary of work completed, testing performed, etc."
                    rows={4}
                  />
                </div>

                <div className="flex-row gap-12">
                  <div style={{ flex: 1 }}>
                    <label>GitHub Link (Repo / PR / Commit):</label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label>Dockerfile Link / URL:</label>
                    <input
                      type="url"
                      value={dockerfileUrl}
                      onChange={e => setDockerfileUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex-row justify-end" style={{ marginTop: '8px' }}>
                  <button type="submit" disabled={submitting} style={{ fontWeight: 'bold' }}>
                    {submitting ? 'Submitting...' : 'Submit Task Report & Request Approval'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        ) : (
          <div className="panel" style={{ flex: '2 1 500px' }}>
            <p>Select a task from the left to view details and submit report.</p>
          </div>
        )}

      </div>

      <MeetSchedulerModal isOpen={showMeetModal} onClose={() => setShowMeetModal(false)} />
    </div>
  );
}
