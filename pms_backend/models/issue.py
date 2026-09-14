from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

class IssuePriority(int, Enum):
    none = 0
    urgent = 1
    high = 2
    medium = 3
    low = 4

class IssueCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    teamId: str = Field(..., description="UUID of the Team")
    projectId: str = Field(..., description="UUID of the Project")
    stateId: str = Field(..., description="UUID of the Workflow State")
    cycleId: Optional[str] = None
    assigneeId: Optional[str] = None
    creatorId: Optional[str] = None
    priority: IssuePriority = Field(default=IssuePriority.none)
    estimate: Optional[float] = None
    labelIds: Optional[List[str]] = []
    parentIssueId: Optional[str] = None
    subIssueIds: Optional[List[str]] = []
    dependencyIds: Optional[List[str]] = []
    customFields: Optional[Dict[str, Any]] = {}
    dueDate: Optional[date] = None
    attachmentIds: Optional[List[str]] = []
    commentIds: Optional[List[str]] = []
    gitBranchLinks: Optional[List[Dict[str, Any]]] = []

class IssueResponse(IssueCreate):
    id: str
    identifier: str = Field(..., description="Auto-generated, e.g. ENG-142")
    createdAt: datetime
    updatedAt: datetime
    completedAt: Optional[datetime] = None
    archivedAt: Optional[datetime] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    stateId: Optional[str] = None
    assigneeId: Optional[str] = None
    priority: Optional[IssuePriority] = None
    labelIds: Optional[List[str]] = None

class CommentCreate(BaseModel):
    issueId: str
    authorId: str
    body: str = Field(..., min_length=1)

class CommentResponse(CommentCreate):
    id: str
    createdAt: datetime

class AttachmentCreate(BaseModel):
    issueId: str
    url: HttpUrl
    filename: str
    mimeType: Optional[str] = None
    sizeBytes: Optional[int] = None

class AttachmentResponse(AttachmentCreate):
    id: str