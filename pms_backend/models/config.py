from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

# --- ENUMS ---
class StateCategory(str, Enum):
    backlog = "backlog"
    unstarted = "unstarted"
    started = "started"
    completed = "completed"
    cancelled = "cancelled"

class FieldType(str, Enum):
    text = "text"
    number = "number"
    date = "date"
    select = "select"
    multiSelect = "multiSelect"
    checkbox = "checkbox"
    user = "user"
    url = "url"

# ==========================================
# WORKFLOW SCHEMAS
# ==========================================
class WorkflowStateCreate(BaseModel):
    name: str = Field(..., description="e.g., 'In Progress'")
    category: StateCategory
    position: Optional[float] = 0.0
    color: Optional[str] = "#000000"

class WorkflowStateResponse(WorkflowStateCreate):
    id: str = Field(..., description="UUID of the state")

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=2, description="e.g., 'Default Engineering Flow'")
    states: List[WorkflowStateCreate] = Field(..., min_length=1, description="Must have at least one state")

class WorkflowResponse(BaseModel):
    id: str
    name: str
    states: List[WorkflowStateResponse]

# ==========================================
# LABEL SCHEMAS
# ==========================================
class LabelCreate(BaseModel):
    name: str = Field(..., min_length=1)
    color: Optional[str] = "#808080"
    workflowId: Optional[str] = None

class LabelResponse(LabelCreate):
    id: str

# ==========================================
# CUSTOM FIELD DEFINITION SCHEMAS
# ==========================================
class CustomFieldDefinitionCreate(BaseModel):
    name: str = Field(..., min_length=1)
    fieldType: FieldType
    options: Optional[List[str]] = []
    appliesToProjectId: Optional[str] = Field(None, description="If null, applies globally")

class CustomFieldDefinitionResponse(CustomFieldDefinitionCreate):
    id: str