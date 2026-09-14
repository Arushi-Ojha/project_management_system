import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from models.config import (
    WorkflowCreate, WorkflowResponse,
    LabelCreate, LabelResponse,
    CustomFieldDefinitionCreate, CustomFieldDefinitionResponse
)

router = APIRouter(prefix="/api/v1/config", tags=["System Configuration"])

@router.post("/workflows", response_model=WorkflowResponse, status_code=201)
async def create_workflow(payload: WorkflowCreate, db = Depends(get_db)):
    """Creates a new workflow and auto-generates IDs for nested states."""
    workflow_doc = payload.model_dump()
    workflow_doc["id"] = str(uuid.uuid4())
    
    # Generate a UUID for each nested state in the workflow
    for state in workflow_doc["states"]:
        state["id"] = str(uuid.uuid4())
        
    await db["workflows"].insert_one(workflow_doc)
    return workflow_doc

@router.post("/labels", response_model=LabelResponse, status_code=201)
async def create_label(payload: LabelCreate, db = Depends(get_db)):
    """Creates a global label/tag."""
    label_doc = payload.model_dump()
    label_doc["id"] = str(uuid.uuid4())
    
    await db["labels"].insert_one(label_doc)
    return label_doc

@router.post("/custom-fields", response_model=CustomFieldDefinitionResponse, status_code=201)
async def create_custom_field(payload: CustomFieldDefinitionCreate, db = Depends(get_db)):
    """Creates a custom field definition for issues."""
    # If this field is restricted to a specific project, verify the project exists
    if payload.appliesToProjectId:
        project = await db["projects"].find_one({"id": payload.appliesToProjectId})
        if not project:
            raise HTTPException(
                status_code=404, 
                detail=f"Project with ID {payload.appliesToProjectId} not found."
            )

    field_doc = payload.model_dump()
    field_doc["id"] = str(uuid.uuid4())
    
    await db["customFieldDefinitions"].insert_one(field_doc)
    return field_doc

@router.get("/workflows", response_model=List[WorkflowResponse])
async def get_workflows(db = Depends(get_db)):
    """Fetch all workflows to render Kanban columns."""
    cursor = db["workflows"].find()
    workflows = []
    async for doc in cursor:
        doc.pop("_id", None)
        workflows.append(doc)
    return workflows

@router.get("/labels", response_model=List[LabelResponse])
async def get_labels(db = Depends(get_db)):
    """Fetch all labels."""
    cursor = db["labels"].find()
    labels = []
    async for doc in cursor:
        doc.pop("_id", None)
        labels.append(doc)
    return labels