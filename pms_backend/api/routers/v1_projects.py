import uuid
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Body
from core.database import get_db
from core.events import dispatch_audit_log
from core.security import get_current_user
from services.notification_service import send_email_notification
from models.execution import ProjectCreate, ProjectResponse, ProjectUpdate
from models.extension import AuditLogEntryCreate, ActionEnum
from models.notification import NotificationType

router = APIRouter(prefix="/api/v1/execution", tags=["Planning & Execution"])

IST = timezone(timedelta(hours=5, minutes=30))

async def calculate_project_status_and_progress(db, project: dict) -> dict:
    """
    Calculates project completion rate and dynamic status based on:
    1. Workflow stage position (if workflow assigned)
    2. Completed tasks vs total tasks
    3. Project deadline vs current date & time in Indian Standard Time (IST)
    """
    project_id = project.get("id")
    now_ist = datetime.now(IST)
    today_ist = now_ist.date()

    # 1. Task progress
    total_issues = await db["issues"].count_documents({"projectId": project_id})
    completed_issues = await db["issues"].count_documents({
        "projectId": project_id,
        "status": {"$in": ["completed", "approved"]}
    }) if total_issues > 0 else 0
    task_rate = (completed_issues / total_issues * 100.0) if total_issues > 0 else 0.0

    # 2. Workflow stage progress
    stage_rate = 0.0
    workflow_id = project.get("workflowId")
    current_stage = project.get("workflowStage", "Backlog")
    is_completed_stage = False

    if workflow_id:
        workflow = await db["workflows"].find_one({"id": workflow_id})
        if workflow and workflow.get("states"):
            states = workflow["states"]
            num_states = len(states)
            stage_idx = 0
            for idx, s in enumerate(states):
                if s.get("name", "").strip().lower() == current_stage.strip().lower():
                    stage_idx = idx
                    if s.get("category") == "completed" or "complete" in s.get("name", "").lower():
                        is_completed_stage = True
                    break
            if is_completed_stage:
                stage_rate = 100.0
            elif num_states > 1:
                stage_rate = round((stage_idx / (num_states - 1)) * 100.0, 1)
            else:
                stage_rate = 50.0

    # Combined progress rate calculation
    if is_completed_stage:
        final_progress = 100.0
    elif total_issues > 0 and workflow_id:
        final_progress = round((stage_rate * 0.5) + (task_rate * 0.5), 1)
    elif workflow_id:
        final_progress = stage_rate
    elif total_issues > 0:
        final_progress = round(task_rate, 1)
    else:
        final_progress = float(project.get("progress", 0.0))

    # 3. Deadline & Current IST Date/Time Evaluation
    deadline_val = project.get("deadline")
    deadline_date = None
    if deadline_val:
        if isinstance(deadline_val, str):
            try:
                deadline_date = datetime.strptime(deadline_val[:10], "%Y-%m-%d").date()
            except Exception:
                pass
        elif isinstance(deadline_val, datetime):
            deadline_date = deadline_val.date()
        elif isinstance(deadline_val, date):
            deadline_date = deadline_val

    # Status calculation
    calculated_status = project.get("status", "planned")
    if final_progress >= 100.0 or is_completed_stage or calculated_status == "completed":
        calculated_status = "completed"
        final_progress = 100.0
    elif deadline_date:
        if today_ist > deadline_date:
            calculated_status = "overdue"
        elif today_ist == deadline_date:
            calculated_status = "at_risk"
        else:
            days_left = (deadline_date - today_ist).days
            if days_left <= 3 and final_progress < 60.0:
                calculated_status = "at_risk"
            elif final_progress > 0:
                calculated_status = "on_track"
            else:
                calculated_status = "planned"
    else:
        if final_progress > 0:
            calculated_status = "on_track"
        else:
            calculated_status = "planned"

    return {
        "progress": final_progress,
        "status": calculated_status,
        "calculatedStatus": calculated_status,
        "istCalculatedAt": now_ist.strftime("%Y-%m-%d %H:%M:%S IST")
    }


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(payload: ProjectCreate, bg_tasks: BackgroundTasks, db = Depends(get_db)):
    # 1. Determine priority: auto priority 1 if no other project is under this manager, or next available
    user_projects = await db["projects"].find({
        "userId": payload.userId,
        "organizationId": payload.organizationId
    }).to_list(100)
    
    assigned_priority = payload.priority
    existing_priorities = [p.get("priority", 1) for p in user_projects if "priority" in p]

    if not user_projects:
        assigned_priority = 1
    elif assigned_priority in existing_priorities:
        assigned_priority = max(existing_priorities) + 1
    
    project_doc = payload.model_dump(mode="json")
    project_doc["id"] = str(uuid.uuid4())
    project_doc["priority"] = assigned_priority
    project_doc["teamIds"] = []
    project_doc["workflowId"] = None
    project_doc["workflowStage"] = payload.workflowStage or "Backlog"
    project_doc["assignments"] = []

    # Calculate initial progress and status
    metrics = await calculate_project_status_and_progress(db, project_doc)
    project_doc.update(metrics)
    
    await db["projects"].insert_one(project_doc)
    
    # Audit log
    audit_entry = AuditLogEntryCreate(
        actorId=payload.userId,
        entityType="Project",
        entityId=project_doc["id"],
        action=ActionEnum.create
    )
    bg_tasks.add_task(dispatch_audit_log, audit_entry)
    
    return project_doc


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    organizationId: str, 
    userId: Optional[str] = None,
    status: Optional[str] = None, 
    db = Depends(get_db)
):
    """
    Fetch all projects for an organization, sorted by priority.
    Dynamically recalculates progress and status based on workflow stage,
    completed deliverables, and deadline against current IST date & time.
    """
    query = {"organizationId": organizationId}
    if userId:
        query["$or"] = [
            {"userId": userId},
            {"assignments.userId": userId}
        ]
    if status:
        query["status"] = status
        
    cursor = db["projects"].find(query).sort("priority", 1)
    projects = []
    async for doc in cursor:
        doc.pop("_id", None)
        metrics = await calculate_project_status_and_progress(db, doc)
        doc.update(metrics)
        projects.append(doc)
    return projects


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_details(project_id: str, db = Depends(get_db)):
    """Fetch single project details with dynamic progress and status in IST."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    project.pop("_id", None)
    metrics = await calculate_project_status_and_progress(db, project)
    project.update(metrics)
    return project


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectUpdate, db = Depends(get_db)):
    """Update project details (e.g. title, deadline, status, workflowId, workflowStage)."""
    update_data = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db["projects"].find_one_and_update(
        {"id": project_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Project not found.")
        
    result.pop("_id", None)
    metrics = await calculate_project_status_and_progress(db, result)
    result.update(metrics)
    # Persist updated status and progress
    await db["projects"].update_one(
        {"id": project_id},
        {"$set": {
            "progress": metrics["progress"],
            "status": metrics["status"],
            "calculatedStatus": metrics["calculatedStatus"],
            "istCalculatedAt": metrics["istCalculatedAt"]
        }}
    )
    return result


@router.post("/projects/{project_id}/assign-member")
async def assign_member_to_project(
    project_id: str,
    payload: dict = Body(...),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Manager assigns an employee to a project.
    Creates an assignment with status 'pending', dispatches an in-app invite notification and email.
    """
    target_user_id = payload.get("userId")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_user = await db["users"].find_one({"id": target_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if already assigned
    existing_assignment = next((a for a in project.get("assignments", []) if a.get("userId") == target_user_id), None)
    now = datetime.now(timezone.utc)

    if existing_assignment:
        if existing_assignment.get("status") == "accepted":
            return {"message": "User is already an accepted member of this project"}
        # Reset to pending
        await db["projects"].update_one(
            {"id": project_id, "assignments.userId": target_user_id},
            {"$set": {"assignments.$.status": "pending", "assignments.$.assignedAt": now}}
        )
    else:
        new_assignment = {
            "userId": target_user_id,
            "status": "pending",
            "assignedAt": now
        }
        await db["projects"].update_one(
            {"id": project_id},
            {"$push": {"assignments": new_assignment}}
        )

    # 1. Create in-app notification with accept/reject prompt
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "recipient_id": target_user_id,
        "sender_id": current_user["id"],
        "title": f"New Project Invitation: {project.get('name')}",
        "message": f"You have been assigned to project '{project.get('name')}'. Please accept or reject this invitation from your dashboard.",
        "type": NotificationType.PROJECT_INVITE,
        "entity_type": "project",
        "entity_id": project_id,
        "action_url": f"/project/{project_id}",
        "read": False,
        "response_status": "pending",
        "created_at": now
    }
    await db["notifications"].insert_one(notif_doc)

    # 2. Dispatch email notification with redirect notice
    if target_user.get("email"):
        manager_name = current_user.get("name", "Your Project Manager")
        email_body = (
            f"Hello {target_user.get('name', 'Team Member')},\n\n"
            f"{manager_name} has assigned you to project: '{project.get('name')}'.\n\n"
            f"Please log in to your dashboard and visit the Notifications section to Accept or Reject this assignment.\n\n"
            f"Best regards,\nProject Management System"
        )
        bg_tasks.add_task(
            send_email_notification,
            recipient_email=target_user["email"],
            subject=f"Project Assignment Invitation: {project.get('name')}",
            body=email_body
        )

    return {"message": f"Assigned {target_user.get('name')} to project with pending confirmation"}


@router.post("/projects/{project_id}/remove-member")
async def remove_member_from_project(
    project_id: str,
    payload: dict = Body(...),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Manager removes an employee from a project.
    Sends notification & email to the employee.
    """
    target_user_id = payload.get("userId")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_user = await db["users"].find_one({"id": target_user_id})

    await db["projects"].update_one(
        {"id": project_id},
        {"$pull": {"assignments": {"userId": target_user_id}}}
    )

    now = datetime.now(timezone.utc)
    # Create removal notification
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "recipient_id": target_user_id,
        "sender_id": current_user["id"],
        "title": f"Removed from Project: {project.get('name')}",
        "message": f"You have been removed from project '{project.get('name')}'.",
        "type": NotificationType.SYSTEM,
        "entity_type": "project",
        "entity_id": project_id,
        "action_url": "/dashboard",
        "read": False,
        "response_status": None,
        "created_at": now
    }
    await db["notifications"].insert_one(notif_doc)

    if target_user and target_user.get("email"):
        bg_tasks.add_task(
            send_email_notification,
            recipient_email=target_user["email"],
            subject=f"Update: Removed from Project {project.get('name')}",
            body=f"Hello {target_user.get('name')},\n\nYou have been unassigned from project '{project.get('name')}'. Check your dashboard for active tasks."
        )

    return {"message": "Member removed successfully"}


@router.post("/projects/reorder-priority")
async def reorder_project_priorities(
    payload: List[dict] = Body(..., description="List of {'projectId': str, 'priority': int}"),
    db = Depends(get_db)
):
    """Updates ordering/priority for drag-and-drop project lists."""
    for item in payload:
        p_id = item.get("projectId")
        p_prio = item.get("priority")
        if p_id and p_prio is not None:
            await db["projects"].update_one(
                {"id": p_id},
                {"$set": {"priority": int(p_prio)}}
            )
    return {"message": "Priorities updated successfully"}


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, db = Depends(get_db)):
    active_issues = await db["issues"].count_documents({"projectId": project_id})
    if active_issues > 0:
        raise HTTPException(
            status_code=409, 
            detail=f"Conflict: Cannot delete Project. It has {active_issues} associated task(s). Please delete or reassign them first."
        )
        
    result = await db["projects"].delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found.")
    return None