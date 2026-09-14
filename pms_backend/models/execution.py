from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class ProjectStatus(str, Enum):
    planned = "planned"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"

class ProjectCreate(BaseModel):
    organizationId: str = Field(..., description="UUID of the Organization")
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    teamIds: Optional[List[str]] = []
    workflowId: Optional[str] = None
    status: ProjectStatus = Field(default=ProjectStatus.planned)
    startDate: Optional[date] = None
    targetDate: Optional[date] = None
    progress: Optional[float] = Field(0.0, ge=0.0, le=100.0)

class ProjectResponse(ProjectCreate):
    id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = None
    teamIds: Optional[List[str]] = None
    workflowId: Optional[str] = None
    status: Optional[ProjectStatus] = None
    startDate: Optional[date] = None
    targetDate: Optional[date] = None
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