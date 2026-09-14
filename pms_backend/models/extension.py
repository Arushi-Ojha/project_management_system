from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TriggerEnum(str, Enum):
    issue_created = "issue.created"
    issue_stateChanged = "issue.stateChanged"
    issue_assigned = "issue.assigned"
    comment_created = "comment.created"
    cycle_started = "cycle.started"
    cycle_ended = "cycle.ended"

class ActionEnum(str, Enum):
    create = "create"
    update = "update"
    delete = "delete"
    archive = "archive"

class IntegrationProvider(str, Enum):
    github = "github"
    gitlab = "gitlab"
    slack = "slack"
    figma = "figma"
    sentry = "sentry"
    zendesk = "zendesk"
    confluence = "confluence"
    bitbucket = "bitbucket"

class AutomationCreate(BaseModel):
    teamId: str
    trigger: TriggerEnum
    conditions: Optional[List[Dict[str, Any]]] = []
    actions: List[Dict[str, Any]] = Field(..., min_length=1)
    isEnabled: bool = True

class AutomationResponse(AutomationCreate):
    id: str

class WebhookCreate(BaseModel):
    url: HttpUrl
    events: List[str] = Field(..., min_length=1)
    secret: Optional[str] = None
    isActive: bool = True

class WebhookResponse(WebhookCreate):
    id: str

class IntegrationCreate(BaseModel):
    provider: IntegrationProvider
    config: Optional[Dict[str, Any]] = {}
    connectedByUserId: Optional[str] = None

class IntegrationResponse(IntegrationCreate):
    id: str

class AuditLogEntryCreate(BaseModel):
    actorId: str
    entityType: str = Field(..., description="e.g., 'Project', 'Issue'")
    entityId: str
    action: ActionEnum
    diff: Optional[Dict[str, Any]] = {}

class AuditLogEntryResponse(AuditLogEntryCreate):
    id: str
    timestamp: datetime