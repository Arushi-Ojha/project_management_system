import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar, Tag } from 'lucide-react';

const getDeadlineString = (dueDate) => {
  if (!dueDate) return null;
  const diffTime = new Date(dueDate) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return "Due today";
  return `${diffDays}d left`;
};

function SortableItem({ id, issue, users, labels, canManageTasks, currentUserId, onAssigneeChange, onLabelToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: '12px',
    padding: '16px',
    background: '#ffffff',
    border: '1px solid var(--color-gray)'
  };

  const assignee = users.find(u => u.id === issue.assigneeId);
  const deadlineStr = getDeadlineString(issue.dueDate);
  const canEditTask = canManageTasks || issue.assigneeId === currentUserId;

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{issue.identifier}</div>
      </div>
      
      <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '12px' }}>{issue.title}</div>
      
      {/* Labels */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
        {(issue.labelIds || []).map(lId => {
          const l = labels.find(x => x.id === lId);
          if (!l) return null;
          return (
            <span key={l.id} style={{ fontSize: '0.7rem', padding: '2px 6px', background: l.color, color: '#fff', borderRadius: '4px' }}>
              {l.name}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {deadlineStr ? (
          <span style={{ fontSize: '0.75rem', color: deadlineStr.includes('Overdue') ? 'red' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {deadlineStr}
          </span>
        ) : <span />}
        
        {canManageTasks ? (
          <select 
            className="input-field"
            style={{ fontSize: '0.75rem', padding: '2px 4px', width: '100px', margin: 0, height: 'auto' }}
            value={issue.assigneeId || ''}
            onChange={(e) => onAssigneeChange(issue.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()} // Stop DnD interference
          >
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        ) : (
          assignee && (
            <div title={assignee.name} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
              {assignee.name.charAt(0).toUpperCase()}
            </div>
          )
        )}
      </div>

      {canEditTask && labels.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-gray)' }}>
          <select 
            className="input-field" 
            style={{ fontSize: '0.7rem', padding: '2px', width: '100%' }}
            value="" 
            onChange={(e) => onLabelToggle(issue.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()} // Stop DnD interference
          >
            <option value="" disabled>+ Add / Remove Label</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>
                {(issue.labelIds || []).includes(l.id) ? `Remove: ${l.name}` : `Add: ${l.name}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard() {
  const { projectId } = useParams();
  const { user, organization } = useAuth();
  
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [globalLabels, setGlobalLabels] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [canManageTasks, setCanManageTasks] = useState(false);
  
  // UI State
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigneeId: '', dueDate: '' });
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    loadBoardData();
  }, [projectId]);

  const loadBoardData = async () => {
    try {
      const [projRes, workflowsRes, issuesRes, usersRes, teamsRes, labelsRes] = await Promise.all([
        apiCall(`/execution/projects/${projectId}`),
        apiCall('/config/workflows'),
        apiCall(`/issues?projectId=${projectId}`),
        apiCall(`/iam/organizations/${organization.id}/users`),
        apiCall(`/iam/organizations/${organization.id}/teams`),
        apiCall('/config/labels')
      ]);
      
      setProject(projRes);
      setWorkflows(workflowsRes);
      setIssues(issuesRes);
      setGlobalLabels(labelsRes);
      
      const teamId = projRes.teamIds?.[0];
      const team = teamsRes.find(t => t.id === teamId);
      
      let teamMembers = [];
      let isTeamLead = false;
      if (team) {
        teamMembers = team.memberIds || [];
        isTeamLead = team.leadId === user.id;
      }
      
      const hasAdminRights = isTeamLead || user.role === 'admin' || user.role === 'owner';
      setCanManageTasks(hasAdminRights);
      
      const projectUsers = usersRes.filter(u => teamMembers.includes(u.id) || u.role === 'admin' || u.role === 'owner');
      setOrgUsers(projectUsers.length > 0 ? projectUsers : usersRes); 
      
      let targetWorkflow = workflowsRes.find(w => w.id === projRes.workflowId);
      if (!targetWorkflow && workflowsRes.length > 0) targetWorkflow = workflowsRes[0];
      setActiveWorkflow(targetWorkflow);
    } catch (e) {
      console.error(e);
    }
  };

  const createIssue = async (e) => {
    e.preventDefault();
    if (!activeWorkflow) return;
    
    const backlogState = activeWorkflow.states.find(s => s.category === 'backlog') || activeWorkflow.states[0];
    
    try {
      const newIssue = await apiCall('/issues/', {
        method: 'POST',
        body: {
          title: newTask.title,
          projectId: projectId,
          teamId: project.teamIds[0],
          stateId: backlogState.id,
          creatorId: user.id,
          assigneeId: newTask.assigneeId || null,
          dueDate: newTask.dueDate || null
        }
      });
      setIssues([newIssue, ...issues]);
      setNewTask({ title: '', assigneeId: '', dueDate: '' });
      setShowNewTaskForm(false);
    } catch (e) {
      alert("Error creating task: " + e.message);
    }
  };

  const handleAssigneeChange = async (issueId, newAssigneeId) => {
    try {
      const updatedIssue = await apiCall(`/issues/${issueId}`, {
        method: 'PATCH',
        body: { assigneeId: newAssigneeId || null }
      });
      setIssues(issues.map(i => i.id === issueId ? updatedIssue : i));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLabelToggle = async (issueId, labelId) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    let currentLabels = issue.labelIds || [];
    let newLabels;
    if (currentLabels.includes(labelId)) {
      newLabels = currentLabels.filter(id => id !== labelId);
    } else {
      newLabels = [...currentLabels, labelId];
    }

    try {
      const updatedIssue = await apiCall(`/issues/${issueId}`, {
        method: 'PATCH',
        body: { labelIds: newLabels }
      });
      setIssues(issues.map(i => i.id === issueId ? updatedIssue : i));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const issueId = active.id;
    const overId = over.id;
    
    let targetStateId = null;
    if (activeWorkflow.states.some(s => s.id === overId)) {
      targetStateId = overId;
    } else {
      const overIssue = issues.find(i => i.id === overId);
      if (overIssue) {
        targetStateId = overIssue.stateId;
      }
    }

    if (targetStateId) {
      setIssues(issues.map(i => i.id === issueId ? { ...i, stateId: targetStateId } : i));
      
      try {
        await apiCall(`/issues/${issueId}`, {
          method: 'PATCH',
          body: { stateId: targetStateId }
        });
      } catch (e) {
        loadBoardData();
        console.error("Failed to update issue state", e);
      }
    }
  };

  if (!project || !activeWorkflow) return <div style={{ padding: '40px' }}>Loading board...</div>;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{project.name}</h1>
          <p style={{ fontSize: '0.9rem' }}>Kanban Board</p>
        </div>
        {canManageTasks && (
          <button className="primary-button" onClick={() => setShowNewTaskForm(!showNewTaskForm)}>
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      {showNewTaskForm && (
        <form onSubmit={createIssue} style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', border: '2px solid var(--color-gray)', backgroundColor: '#ffffff' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Task Title</label>
            <input required className="input-field" placeholder="e.g. Design new homepage" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
          </div>
          <div>
            <label className="label">Assign To</label>
            <select className="input-field" value={newTask.assigneeId} onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}>
              <option value="">Unassigned</option>
              {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input-field" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} />
          </div>
          <button type="submit" className="primary-button">Add</button>
          <button type="button" className="glass-button" onClick={() => setShowNewTaskForm(false)}>Cancel</button>
        </form>
      )}

      <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px' }}>
          {activeWorkflow.states.map(state => {
            const stateIssues = issues.filter(i => i.stateId === state.id);
            
            return (
              <div key={state.id} style={{ minWidth: '300px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{state.name}</span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--color-gray)', color: 'white', padding: '2px 8px' }}>{stateIssues.length}</span>
                </div>
                
                <div style={{ flex: 1, padding: '12px', background: 'var(--color-mint)', border: '2px solid black', minHeight: '400px' }}>
                  <SortableContext items={stateIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {stateIssues.map(issue => (
                      <SortableItem 
                        key={issue.id} 
                        id={issue.id} 
                        issue={issue} 
                        users={orgUsers}
                        labels={globalLabels}
                        canManageTasks={canManageTasks}
                        currentUserId={user.id}
                        onAssigneeChange={handleAssigneeChange}
                        onLabelToggle={handleLabelToggle}
                      />
                    ))}
                    {stateIssues.length === 0 && (
                       <div id={state.id} style={{ height: '100%', minHeight: '100px' }} />
                    )}
                  </SortableContext>
                </div>
              </div>
            )
          })}
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div style={{ padding: '16px', background: '#ffffff', border: '2px solid black', rotate: '2deg' }}>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{issues.find(i => i.id === activeId)?.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
