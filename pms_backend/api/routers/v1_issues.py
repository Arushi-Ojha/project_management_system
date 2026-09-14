import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from core.database import get_db
from core.events import dispatch_audit_log
from services.issue_service import generate_issue_identifier
from services.notification_service import send_email_notification
from models.issue import IssueCreate, IssueResponse, IssueUpdate
from models.extension import AuditLogEntryCreate, ActionEnum

router = APIRouter(prefix="/api/v1/issues", tags=["Core Issue Engine"])

@router.post("/", response_model=IssueResponse, status_code=201)
async def create_issue(payload: IssueCreate, bg_tasks: BackgroundTasks, db = Depends(get_db)):
    issue_doc = payload.model_dump()
    issue_doc["id"] = str(uuid.uuid4())
    
    # 1. Generate the dynamic identifier (e.g., ENG-142)
    issue_doc["identifier"] = await generate_issue_identifier(payload.teamId)
    
    # 2. Add timestamps
    now = datetime.now(timezone.utc)
    issue_doc["createdAt"] = now
    issue_doc["updatedAt"] = now
    
    await db["issues"].insert_one(issue_doc)
    
    # 3. Background Task: Audit Log
    bg_tasks.add_task(dispatch_audit_log, AuditLogEntryCreate(
        actorId=payload.creatorId or "system",
        entityType="Issue",
        entityId=issue_doc["id"],
        action=ActionEnum.create
    ))
    
    # 4. Background Task: Email Notification
    if payload.assigneeId:
        assignee = await db["users"].find_one({"id": payload.assigneeId})
        if assignee and assignee.get("email"):
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=assignee["email"],
                subject=f"New Task Assigned: {issue_doc['identifier']}",
                body=f"You have been assigned to {issue_doc['identifier']}: {issue_doc['title']}."
            )
            
    return issue_doc

@router.get("/", response_model=List[IssueResponse])
async def list_issues(
    projectId: str = Query(None, description="Filter by project (for Kanban boards)"),
    assigneeId: str = Query(None, description="Filter by user (for personal Dashboards)"),
    teamId: str = Query(None, description="Filter by team"),
    db = Depends(get_db)
):
    """
    Dynamic endpoint to fetch issues. 
    - Pass 'projectId' to render a Project Kanban board.
    - Pass 'assigneeId' to render a user's personal Dashboard.
    """
    query = {}
    if projectId:
        query["projectId"] = projectId
    if assigneeId:
        query["assigneeId"] = assigneeId
    if teamId:
        query["teamId"] = teamId
        
    cursor = db["issues"].find(query).sort("createdAt", -1)
    issues = []
    async for doc in cursor:
        doc.pop("_id", None)
        issues.append(doc)
    return issues

@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue_details(issue_id: str, db = Depends(get_db)):
    """Fetch complete details of a single issue (for opening a task modal)."""
    issue = await db["issues"].find_one({"id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
        
    issue.pop("_id", None)
    return issue

@router.patch("/{issue_id}", response_model=IssueResponse)
async def update_issue(issue_id: str, payload: IssueUpdate, bg_tasks: BackgroundTasks, db = Depends(get_db)):
    """Update an issue, specifically used for drag-and-drop state changes."""
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
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
    
    # Audit Log
    bg_tasks.add_task(dispatch_audit_log, AuditLogEntryCreate(
        actorId="system", # Ideally we get this from Auth context
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
                subject=f"Task Assigned to You: {result['identifier']}",
                body=f"You have been assigned to {result['identifier']}: {result['title']}."
            )
            
    # Log state changes
    if "stateId" in update_data:
        print(f"Issue {result['identifier']} moved to state {update_data['stateId']}")
        
    return result