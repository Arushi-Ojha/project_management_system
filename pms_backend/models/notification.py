import uuid
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

class NotificationType(str, Enum):
    PROJECT_INVITE = "PROJECT_INVITE"
    PROJECT_ACCEPTED = "PROJECT_ACCEPTED"
    PROJECT_REJECTED = "PROJECT_REJECTED"
    TASK_INVITE = "TASK_INVITE"
    TASK_ACCEPTED = "TASK_ACCEPTED"
    TASK_REJECTED = "TASK_REJECTED"
    DEADLINE_ALERT = "DEADLINE_ALERT"
    APPROVAL_REQUEST = "APPROVAL_REQUEST"
    APPROVAL_RESPONSE = "APPROVAL_RESPONSE"
    MEET_INVITE = "MEET_INVITE"
    SYSTEM = "SYSTEM"

class NotificationCreate(BaseModel):
    recipient_id: str = Field(..., description="User ID of the notification recipient")
    sender_id: Optional[str] = Field(None, description="User ID of the sender / actor")
    title: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    type: NotificationType = Field(default=NotificationType.SYSTEM)
    entity_type: Optional[str] = Field(None, description="'project', 'task', 'meet'")
    entity_id: Optional[str] = Field(None, description="ID of associated project or task")
    action_url: Optional[str] = None
    read: bool = False
    response_status: Optional[str] = Field(None, description="'pending', 'accepted', 'rejected'")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationResponse(NotificationCreate):
    notification_id: str
