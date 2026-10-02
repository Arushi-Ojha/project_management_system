import uuid
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query, Body
from core.database import get_db
from core.events import dispatch_audit_log
from core.security import get_current_user
from services.issue_service import generate_issue_identifier
from services.notification_service import send_email_notification
from models.issue import (
    IssueCreate, 
    IssueResponse, 
    IssueUpdate, 
    IssueSubmitReport, 
    IssueReviewRequest, 
    IssuePriority
)
from models.extension import AuditLogEntryCreate, ActionEnum
from models.notification import NotificationType

router = APIRouter(prefix="/api/v1/issues", tags=["Core Issue Engine"])

@router.post("/", response_model=IssueResponse, status_code=201)
async def create_issue(
    payload: IssueCreate, 
    bg_tasks: BackgroundTasks, 
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Creates a new task/issue.
    - Status is auto-set to 'assigned'.
    - If employee has an existing task with identical deadline, flags deadlineConflict allowing accept/reject.
    - Sends in-app task invite and email notification.
    """
    issue_doc = payload.model_dump(mode="json")
    issue_doc["id"] = str(uuid.uuid4())
    issue_doc["status"] = "assigned" # Auto-set as requested
    issue_doc["assignmentStatus"] = "pending"
    issue_doc["creatorId"] = current_user["id"]
    
    team_id = payload.teamId
    if not team_id:
        project = await db["projects"].find_one({"id": payload.projectId})
        if project and project.get("organizationId"):
            team = await db["teams"].find_one({"organizationId": project["organizationId"]})
            if team:
                team_id = team["id"]
        if not team_id:
            team_id = "default"
    issue_doc["teamId"] = team_id
    
    # Generate dynamic identifier (e.g. ENG-142 or TSK-1)
    issue_doc["identifier"] = await generate_issue_identifier(team_id)
    
    # Check deadline conflict for the assignee
    if payload.assigneeId and (payload.deadline or payload.dueDate):
        task_deadline = payload.deadline or payload.dueDate
        deadline_str = task_deadline.isoformat() if hasattr(task_deadline, 'isoformat') else str(task_deadline)
        
        # Check if assignee has any other task with the exact same deadline
        collision = await db["issues"].find_one({
            "assigneeId": payload.assigneeId,
            "status": {"$nin": ["completed", "approved"]},
            "$or": [
                {"deadline": deadline_str},
                {"dueDate": deadline_str}
            ]
        })
        if collision:
            issue_doc["deadlineConflict"] = True

    now = datetime.now(timezone.utc)
    issue_doc["createdAt"] = now
    issue_doc["updatedAt"] = now
    
    await db["issues"].insert_one(issue_doc)
    
    # Audit log
    bg_tasks.add_task(dispatch_audit_log, AuditLogEntryCreate(
        actorId=current_user["id"],
        entityType="Issue",
        entityId=issue_doc["id"],
        action=ActionEnum.create
    ))
    
    # Send in-app notification & email to assignee
    if payload.assigneeId:
        assignee = await db["users"].find_one({"id": payload.assigneeId})
        conflict_msg = " Note: Multiple tasks share this deadline; you may choose to Accept or Reject." if issue_doc.get("deadlineConflict") else ""
        
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "recipient_id": payload.assigneeId,
            "sender_id": current_user["id"],
            "title": f"New Task Assigned: {issue_doc['identifier']}",
            "message": f"Task '{issue_doc['title']}' has been assigned to you. Status: Assigned.{conflict_msg}",
            "type": NotificationType.TASK_INVITE,
            "entity_type": "task",
            "entity_id": issue_doc["id"],
            "action_url": f"/project/{payload.projectId}",
            "read": False,
            "response_status": "pending",
            "created_at": now
        }
        await db["notifications"].insert_one(notif_doc)

        if assignee and assignee.get("email"):
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=assignee["email"],
                subject=f"New Task Assigned: {issue_doc['identifier']}",
                body=(
                    f"Hello {assignee.get('name', 'Team Member')},\n\n"
                    f"You have been assigned to task {issue_doc['identifier']}: '{issue_doc['title']}'.\n"
                    f"Status: Assigned\n"
                    f"Deadline: {issue_doc.get('deadline') or issue_doc.get('dueDate') or 'None'}\n"
                    f"{conflict_msg}\n\n"
                    f"Please log in to your dashboard to review and manage your tasks."
                )
            )
            
    return issue_doc


@router.get("/", response_model=List[IssueResponse])
async def list_issues(
    projectId: Optional[str] = Query(None, description="Filter by project"),
    assigneeId: Optional[str] = Query(None, description="Filter by user (sorted by closer deadline)"),
    teamId: Optional[str] = Query(None, description="Filter by team"),
    db = Depends(get_db)
):
    """
    Fetch issues.
    When querying by assigneeId, automatically sorts pending tasks by closer deadline!
    """
    query = {}
    if projectId:
        query["projectId"] = projectId
    if assigneeId:
        query["assigneeId"] = assigneeId
    if teamId:
        query["teamId"] = teamId
        
    cursor = db["issues"].find(query)
    issues = []
    async for doc in cursor:
        doc.pop("_id", None)
        issues.append(doc)

    # Sort closer deadline first if assignee view
    if assigneeId:
        def deadline_sorter(item):
            d = item.get("deadline") or item.get("dueDate")
            if not d:
                return "9999-12-31" # No deadline comes last
            return str(d)
        issues.sort(key=deadline_sorter)
    else:
        issues.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)

    return issues


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue_details(issue_id: str, db = Depends(get_db)):
    """Fetch complete details of a single issue."""
    issue = await db["issues"].find_one({"id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
        
    issue.pop("_id", None)
    return issue


@router.patch("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: str, 
    payload: IssueUpdate, 
    bg_tasks: BackgroundTasks, 
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update issue status, state, priority, or assignment."""
    update_data = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    old_issue = await db["issues"].find_one({"id": issue_id})
    if not old_issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
        
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    result = await db["issues"].find_one_and_update(
        {"id": issue_id},
        {"$set": update_data},
        return_document=True
    )
    result.pop("_id", None)
    
    # Audit log
    bg_tasks.add_task(dispatch_audit_log, AuditLogEntryCreate(
        actorId=current_user["id"],
        entityType="Issue",
        entityId=issue_id,
        action=ActionEnum.update,
        diff=update_data
    ))
    
    # Send email if assignee changed
    new_assignee_id = update_data.get("assigneeId")
    if new_assignee_id and new_assignee_id != old_issue.get("assigneeId"):
        assignee = await db["users"].find_one({"id": new_assignee_id})
        if assignee and assignee.get("email"):
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=assignee["email"],
                subject=f"Task Reassigned: {result['identifier']}",
                body=f"You have been assigned to task {result['identifier']}: {result['title']}."
            )
        
    return result


@router.post("/{issue_id}/submit-report", response_model=IssueResponse)
async def submit_task_report(
    issue_id: str,
    payload: IssueSubmitReport,
    bg_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Employee submits work report, GitHub repo link, or Dockerfile link,
    and automatically requests approval from the Project Manager.
    """
    issue = await db["issues"].find_one({"id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    now = datetime.now(timezone.utc)
    update_data = {
        "reportText": payload.reportText,
        "githubUrl": payload.githubUrl,
        "dockerfileUrl": payload.dockerfileUrl,
        "status": "review_pending",
        "approvalStatus": "pending",
        "updatedAt": now
    }

    result = await db["issues"].find_one_and_update(
        {"id": issue_id},
        {"$set": update_data},
        return_document=True
    )
    result.pop("_id", None)

    # Notify Project Manager
    manager_id = issue.get("creatorId")
    if not manager_id:
        # Fallback to project owner
        proj = await db["projects"].find_one({"id": issue.get("projectId")})
        if proj:
            manager_id = proj.get("userId")

    if manager_id and manager_id != current_user["id"]:
        user_name = current_user.get("name", "Employee")
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "recipient_id": manager_id,
            "sender_id": current_user["id"],
            "title": f"Task Approval Request: {issue['identifier']}",
            "message": f"{user_name} has submitted task report & artifacts for '{issue['identifier']}: {issue['title']}' and requested your approval.",
            "type": NotificationType.APPROVAL_REQUEST,
            "entity_type": "task",
            "entity_id": issue_id,
            "action_url": f"/project/{issue.get('projectId')}",
            "read": False,
            "response_status": "pending",
            "created_at": now
        }
        await db["notifications"].insert_one(notif_doc)

        manager = await db["users"].find_one({"id": manager_id})
        if manager and manager.get("email"):
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=manager["email"],
                subject=f"Approval Request: {issue['identifier']} submitted by {user_name}",
                body=(
                    f"Hello,\n\n"
                    f"{user_name} has submitted work for task {issue['identifier']}: '{issue['title']}'.\n\n"
                    f"Report: {payload.reportText}\n"
                    f"GitHub: {payload.githubUrl or 'N/A'}\n"
                    f"Dockerfile: {payload.dockerfileUrl or 'N/A'}\n\n"
                    f"Please log in to your manager dashboard to review and approve."
                )
            )

    return result


@router.post("/{issue_id}/review", response_model=IssueResponse)
async def review_task_submission(
    issue_id: str,
    payload: IssueReviewRequest,
    bg_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Project Manager reviews submitted task, either approving or requesting changes.
    """
    issue = await db["issues"].find_one({"id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    new_status = "completed" if payload.status == "approved" else "in_progress"
    now = datetime.now(timezone.utc)

    update_data = {
        "status": new_status,
        "approvalStatus": payload.status,
        "approvalComment": payload.comment,
        "updatedAt": now
    }
    if payload.status == "approved":
        update_data["completedAt"] = now

    result = await db["issues"].find_one_and_update(
        {"id": issue_id},
        {"$set": update_data},
        return_document=True
    )
    result.pop("_id", None)

    # Notify Assignee
    assignee_id = issue.get("assigneeId")
    if assignee_id and assignee_id != current_user["id"]:
        decision_label = "Approved" if payload.status == "approved" else "Changes Requested"
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "recipient_id": assignee_id,
            "sender_id": current_user["id"],
            "title": f"Task {decision_label}: {issue['identifier']}",
            "message": f"Your task submission for '{issue['identifier']}' was {decision_label.lower()} by your manager. {payload.comment or ''}",
            "type": NotificationType.APPROVAL_RESPONSE,
            "entity_type": "task",
            "entity_id": issue_id,
            "action_url": f"/project/{issue.get('projectId')}",
            "read": False,
            "response_status": payload.status,
            "created_at": now
        }
        await db["notifications"].insert_one(notif_doc)

        assignee = await db["users"].find_one({"id": assignee_id})
        if assignee and assignee.get("email"):
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=assignee["email"],
                subject=f"Task {decision_label}: {issue['identifier']}",
                body=f"Your task submission for {issue['identifier']} was {decision_label.lower()}.\nFeedback: {payload.comment or 'None'}"
            )

    return result


@router.delete("/{issue_id}", status_code=204)
async def delete_issue(issue_id: str, db = Depends(get_db)):
    result = await db["issues"].delete_one({"id": issue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return None