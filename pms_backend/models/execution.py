from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date, datetime
from enum import Enum

class ProjectStatus(str, Enum):
    created = "created"
    planned = "planned"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"
    on_track = "on_track"
    at_risk = "at_risk"
    overdue = "overdue"

class ProjectAssignment(BaseModel):
    userId: str
    status: str = Field(default="pending", description="'pending', 'accepted', 'rejected'")
    assignedAt: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    organizationId: str = Field(..., description="UUID of the Organization")
    userId: str = Field(..., description="UUID of the User creating the project")
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    status: Optional[str] = Field(default="planned")
    startDate: Optional[date] = None
    deadline: Optional[date] = None
    priority: Optional[int] = Field(1, description="Priority index for sorting")
    workflowStage: Optional[str] = Field(default="Backlog", description="Current workflow stage")

class ProjectResponse(ProjectCreate):
    id: str
    teamIds: Optional[List[str]] = []
    workflowId: Optional[str] = None
    workflowStage: Optional[str] = "Backlog"
    progress: Optional[float] = 0.0
    assignments: Optional[List[ProjectAssignment]] = []
    calculatedStatus: Optional[str] = None
    istCalculatedAt: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = None
    teamIds: Optional[List[str]] = None
    workflowId: Optional[str] = None
    workflowStage: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[date] = None
    deadline: Optional[date] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)

class CycleCreate(BaseModel):
    teamId: str = Field(..., description="UUID of the Team")
    number: int = Field(..., description="Sprint iteration number")
    startsAt: datetime
    endsAt: datetime
    goal: Optional[str] = None

class CycleResponse(CycleCreate):
    id: str

class GoalCreate(BaseModel):
    name: str = Field(..., min_length=2)
    ownerId: Optional[str] = None
    projectIds: Optional[List[str]] = []
    progress: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    dueDate: Optional[date] = None

class GoalResponse(GoalCreate):
    id: str