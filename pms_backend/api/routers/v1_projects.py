import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from core.database import get_db
from core.events import dispatch_audit_log
from models.execution import ProjectCreate, ProjectResponse, ProjectUpdate, CycleCreate, CycleResponse, GoalCreate, GoalResponse
from models.extension import AuditLogEntryCreate, ActionEnum

router = APIRouter(prefix="/api/v1/execution", tags=["Planning & Execution"])

@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(payload: ProjectCreate, bg_tasks: BackgroundTasks, db = Depends(get_db)):
    project_doc = payload.model_dump()
    project_doc["id"] = str(uuid.uuid4())
    
    await db["projects"].insert_one(project_doc)
    
    # Dispatch an audit log in the background
    audit_entry = AuditLogEntryCreate(
        actorId="system",
        entityType="Project",
        entityId=project_doc["id"],
        action=ActionEnum.create
    )
    bg_tasks.add_task(dispatch_audit_log, audit_entry)
    
    return project_doc

# (You would follow this identical pattern for POST /cycles and POST /goals)

@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    organizationId: str, 
    status: str = None, 
    db = Depends(get_db)
):
    """Fetch all projects for an org. Can be filtered by status (e.g., 'active')."""
    query = {"organizationId": organizationId}
    if status:
        query["status"] = status
        
    cursor = db["projects"].find(query)
    projects = []
    async for doc in cursor:
        doc.pop("_id", None)
        projects.append(doc)
    return projects

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_details(project_id: str, db = Depends(get_db)):
    """Fetch a single project's details."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    
    project.pop("_id", None)
    return project

@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectUpdate, db = Depends(get_db)):
    """Update a project, used by Leads to add members."""
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
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
    return result

@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str, db = Depends(get_db)):
    # Conflict Check
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