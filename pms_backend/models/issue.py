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
    teamId: Optional[str] = Field(None, description="UUID of the Team")
    projectId: str = Field(..., description="UUID of the Project")
    workflowId: Optional[str] = Field(None, description="UUID of the Workflow")
    stateId: Optional[str] = Field(None, description="UUID of the Workflow State")
    status: str = Field(default="assigned", description="'assigned', 'in_progress', 'review_pending', 'approved', 'completed', 'rejected'")
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
    deadline: Optional[date] = None
    assignmentStatus: str = Field(default="pending", description="'pending', 'accepted', 'rejected'")
    deadlineConflict: bool = Field(default=False, description="True if two tasks have identical deadlines, allowing manual accept/reject")
    attachmentIds: Optional[List[str]] = []
    commentIds: Optional[List[str]] = []
    gitBranchLinks: Optional[List[Dict[str, Any]]] = []
    reportText: Optional[str] = Field(None, description="Task report submitted by employee")
    githubUrl: Optional[str] = Field(None, description="GitHub repository or commit link")
    dockerfileUrl: Optional[str] = Field(None, description="Dockerfile or deployment link")
    approvalStatus: Optional[str] = Field(None, description="'pending', 'approved', 'changes_requested'")
    approvalComment: Optional[str] = Field(None, description="Feedback from project manager")

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
    workflowId: Optional[str] = None
    stateId: Optional[str] = None
    status: Optional[str] = None
    assigneeId: Optional[str] = None
    assignmentStatus: Optional[str] = None
    priority: Optional[IssuePriority] = None
    labelIds: Optional[List[str]] = None
    dueDate: Optional[date] = None
    deadline: Optional[date] = None
    reportText: Optional[str] = None
    githubUrl: Optional[str] = None
    dockerfileUrl: Optional[str] = None
    approvalStatus: Optional[str] = None
    approvalComment: Optional[str] = None

class IssueSubmitReport(BaseModel):
    reportText: str = Field(..., min_length=5, description="Work report summary")
    githubUrl: Optional[str] = Field(None, description="GitHub repo or PR link")
    dockerfileUrl: Optional[str] = Field(None, description="Dockerfile or deployment URL")

class IssueReviewRequest(BaseModel):
    status: str = Field(..., description="'approved' or 'changes_requested'")
    comment: Optional[str] = None

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