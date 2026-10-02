import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WorkflowsHub() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Drag and Drop state for projects
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Create Workflow Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfStages, setWfStages] = useState([
    { name: 'Backlog / Planning', category: 'backlog', color: '#000000' },
    { name: 'In Development', category: 'started', color: '#000000' },
    { name: 'QA & Review', category: 'started', color: '#000000' },
    { name: 'Completed & Deployed', category: 'completed', color: '#000000' }
  ]);

  // Assign Workflow to Project Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetWorkflowId, setTargetWorkflowId] = useState('');

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wfData, projData] = await Promise.all([
        apiCall('/config/workflows').catch(() => []),
        apiCall(`/execution/projects?organizationId=${orgId}`).catch(() => [])
      ]);

      const wfs = wfData || [];
      const projs = projData || [];
      setWorkflows(wfs);
      setProjects(projs);

      if (wfs.length > 0 && !selectedWorkflowId) {
        setSelectedWorkflowId(wfs[0].id);
      }
      if (projs.length > 0 && !targetProjectId) {
        setTargetProjectId(projs[0].id);
      }
      if (wfs.length > 0 && !targetWorkflowId) {
        setTargetWorkflowId(wfs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Workflow builder stages
  const handleAddStage = () => {
    setWfStages([...wfStages, { name: 'New Stage', category: 'started', color: '#000000' }]);
  };

  const handleUpdateStage = (index, field, value) => {
    const updated = [...wfStages];
    updated[index][field] = value;
    setWfStages(updated);
  };

  const handleRemoveStage = (index) => {
    setWfStages(wfStages.filter((_, i) => i !== index));
  };

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    if (!wfName.trim()) {
      alert('Please enter a workflow name.');
      return;
    }
    try {
      const payload = {
        name: wfName,
        states: wfStages.map((s, idx) => ({
          name: s.name,
          category: s.category,
          color: s.color || '#000000',
          position: idx
        }))
      };
      const res = await apiCall('/config/workflows', {
        method: 'POST',
        body: payload
      });

      setWorkflows([...workflows, res]);
      setSelectedWorkflowId(res.id);
      setShowCreateModal(false);
      setWfName('');
      setFeedback({
        type: 'success',
        text: `Workflow '${res.name}' created with ${res.states.length} stages.`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Creation failed' });
    }
  };

  const handleAssignWorkflow = async (e) => {
    e.preventDefault();
    if (!targetProjectId || !targetWorkflowId) return;
    try {
      const targetWf = workflows.find(w => w.id === targetWorkflowId);
      const initialStage = targetWf?.states?.[0]?.name || 'Backlog';

      await apiCall(`/execution/projects/${targetProjectId}`, {
        method: 'PATCH',
        body: {
          workflowId: targetWorkflowId,
          workflowStage: initialStage
        }
      });

      setFeedback({
        type: 'success',
        text: `Workflow '${targetWf?.name}' assigned to project. Stage set to '${initialStage}'.`
      });
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to assign workflow' });
    }
  };

  // DRAG AND DROP: Moving Project across Workflow Stages
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageName) {
      setDragOverStage(stageName);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDropOnStage = async (targetStageName) => {
    setDragOverStage(null);
    if (!draggedProject) return;

    if (draggedProject.workflowStage === targetStageName) {
      setDraggedProject(null);
      return;
    }

    const projectId = draggedProject.id;
    const projectName = draggedProject.name;

    // Optimistic UI update
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, workflowStage: targetStageName, workflowId: selectedWorkflowId }
          : p
      )
    );

    try {
      await apiCall(`/execution/projects/${projectId}`, {
        method: 'PATCH',
        body: {
          workflowStage: targetStageName,
          workflowId: selectedWorkflowId
        }
      });

      setFeedback({
        type: 'success',
        text: `Project '${projectName}' dragged and moved to stage: '${targetStageName}'.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Failed to move project: ${err.message}`
      });
      loadData(); // Revert on failure
    } finally {
      setDraggedProject(null);
    }
  };

  const activeWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
  const stages = activeWorkflow?.states && activeWorkflow.states.length > 0
    ? activeWorkflow.states
    : [
        { id: '1', name: 'Backlog / Planning' },
        { id: '2', name: 'In Development' },
        { id: '3', name: 'QA & Review' },
        { id: '4', name: 'Completed & Deployed' }
      ];

  return (
    <div className="flex-col gap-24" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      
      {/* Top Header */}
      <div className="flex-row justify-between items-center flex-wrap gap-16" style={{ borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>Workflows & Project Pipeline</h1>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Build workflows with tags and tag colors. Drag and drop any project card to whichever stage of the workflow it is currently in.
          </p>
        </div>

        {/* Action Controls with Clear Separation */}
        <div className="flex-row gap-12 items-center flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ fontWeight: 'bold', padding: '8px 16px', fontSize: '14px' }}
          >
            + Create New Workflow
          </button>

          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Assign Workflow to Project
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

      {/* Active Workflow Selector Bar */}
      <div className="panel flex-row justify-between items-center flex-wrap gap-16" style={{ padding: '16px' }}>
        <div className="flex-row items-center gap-12 flex-wrap">
          <label style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Select Active Workflow:</label>
          <select
            value={selectedWorkflowId}
            onChange={e => setSelectedWorkflowId(e.target.value)}
            style={{ fontSize: '14px', padding: '6px 12px', minWidth: '240px' }}
          >
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>
                {wf.name} ({wf.states?.length || 0} stages)
              </option>
            ))}
          </select>
        </div>

        <div className="flex-row items-center gap-8 flex-wrap">
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Workflow Stages:</span>
          {stages.map((st, i) => (
            <span key={i} style={{ border: '1px solid #000', padding: '3px 8px', fontSize: '12px' }}>
              {st.name}
            </span>
          ))}
        </div>
      </div>

      {/* STAGE COLUMNS WITH PROJECT DRAG-AND-DROP */}
      <div className="flex-row gap-16 flex-wrap" style={{ alignItems: 'flex-start' }}>
        {stages.map((stage, colIdx) => {
          // Match projects in this stage
          const stageProjects = projects.filter(p => {
            if (p.workflowStage) {
              return p.workflowStage.toLowerCase() === stage.name.toLowerCase();
            }
            // If project has no stage set, default it to the very first stage column
            return colIdx === 0;
          });

          const isOver = dragOverStage === stage.name;

          return (
            <div
              key={stage.id || colIdx}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDropOnStage(stage.name)}
              className="panel flex-col gap-12"
              style={{
                flex: '1 1 290px',
                minHeight: '520px',
                background: isOver ? '#f7f7f7' : '#ffffff',
                border: isOver ? '2px dashed #000' : '2px solid #000',
                padding: '14px'
              }}
            >
              {/* Column Header */}
              <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{stage.name}</h3>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  ({stageProjects.length} Projects)
                </span>
              </div>

              {/* Instructions if stage is empty */}
              {stageProjects.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', border: '1px dashed #666', marginTop: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px' }}>No projects in this stage.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>Drag a project card here to move it.</p>
                </div>
              ) : (
                /* Project Cards */
                <div className="flex-col gap-12">
                  {stageProjects.map(proj => (
                    <div
                      key={proj.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, proj)}
                      style={{
                        border: '1px solid #000',
                        padding: '12px',
                        background: '#ffffff',
                        cursor: 'grab',
                        userSelect: 'none'
                      }}
                      className="flex-col gap-8"
                    >
                      <div className="flex-row justify-between items-center flex-wrap gap-4">
                        <span style={{ fontSize: '12px', fontWeight: 'bold', border: '1px solid #000', padding: '1px 6px' }}>
                          Priority #{proj.priority || 1}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid #000',
                          padding: '1px 6px',
                          background: (proj.status === 'overdue' || proj.calculatedStatus === 'overdue') ? '#000' : '#fff',
                          color: (proj.status === 'overdue' || proj.calculatedStatus === 'overdue') ? '#fff' : '#000'
                        }}>
                          [{(proj.status || proj.calculatedStatus || 'planned').toUpperCase().replace('_', ' ')}]
                        </span>
                        <span style={{ fontSize: '11px' }}>
                          [Drag to move stage]
                        </span>
                      </div>

                      <h4 style={{ margin: 0, fontSize: '16px' }}>{proj.name}</h4>

                      {proj.description && (
                        <p style={{ margin: 0, fontSize: '13px' }}>{proj.description}</p>
                      )}

                      <div className="flex-row justify-between items-center" style={{ fontSize: '12px' }}>
                        <span>Due: <strong>{proj.deadline || 'No deadline'}</strong></span>
                        <strong>Progress: {proj.progress || 0}%</strong>
                      </div>

                      {/* Progress bar line */}
                      <div style={{ width: '100%', height: '10px', border: '1px solid #000', background: '#fff' }}>
                        <div
                          style={{
                            width: `${proj.progress || 0}%`,
                            height: '100%',
                            background: '#000'
                          }}
                        />
                      </div>

                      <div className="flex-row justify-between items-center" style={{ borderTop: '1px dotted #000', paddingTop: '6px', fontSize: '11px' }}>
                        <span>Staff: {proj.assignments?.length || 0} members</span>
                        <span>Stage: <strong>{proj.workflowStage || stage.name}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL 1: CREATE WORKFLOW */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Workflow Builder</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  Define workflow name, tags/stages, and colors.
                </p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ fontWeight: 'bold', padding: '6px 12px' }}>
                Close [X]
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="flex-col gap-16">
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Workflow Name:
                </label>
                <input
                  type="text"
                  required
                  value={wfName}
                  onChange={e => setWfName(e.target.value)}
                  placeholder="e.g. Standard Product Engineering Flow"
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>

              <div>
                <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                    Workflow Stages & Tag Colors:
                  </label>
                  <button type="button" onClick={handleAddStage} style={{ padding: '4px 10px', fontSize: '12px' }}>
                    + Add Stage Tag
                  </button>
                </div>

                <div className="flex-col gap-8" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {wfStages.map((st, idx) => (
                    <div key={idx} className="flex-row gap-8 items-center">
                      <input
                        type="color"
                        value={st.color || '#000000'}
                        onChange={e => handleUpdateStage(idx, 'color', e.target.value)}
                        style={{ width: '38px', height: '34px', padding: 0, cursor: 'pointer' }}
                        title="Tag Hex Color"
                      />
                      <input
                        type="text"
                        required
                        value={st.name}
                        onChange={e => handleUpdateStage(idx, 'name', e.target.value)}
                        placeholder="Stage Tag Name"
                        style={{ flex: 1, fontSize: '14px', padding: '6px 8px' }}
                      />
                      {wfStages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-row justify-end gap-12" style={{ borderTop: '1px solid #000', paddingTop: '14px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" style={{ fontWeight: 'bold', padding: '8px 20px', fontSize: '14px' }}>
                  Save Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN WORKFLOW TO PROJECT */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Assign Workflow to Project</h2>
              <button type="button" onClick={() => setShowAssignModal(false)} style={{ fontWeight: 'bold', padding: '6px 12px' }}>
                Close [X]
              </button>
            </div>

            <form onSubmit={handleAssignWorkflow} className="flex-col gap-16">
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Select Project:
                </label>
                <select
                  value={targetProjectId}
                  onChange={e => setTargetProjectId(e.target.value)}
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      Priority #{p.priority || 1} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Select Workflow to Assign:
                </label>
                <select
                  value={targetWorkflowId}
                  onChange={e => setTargetWorkflowId(e.target.value)}
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                >
                  {workflows.map(wf => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name} ({wf.states?.length || 0} stages)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-row justify-end gap-12" style={{ borderTop: '1px solid #000', paddingTop: '14px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" style={{ fontWeight: 'bold', padding: '8px 20px', fontSize: '14px' }}>
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
