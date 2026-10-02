import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ActivityLogBase(BaseModel):
    module: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="PMS module identifier (e.g. organization, department, team, permission, role, rbac, project, task)"
    )
    action: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Specific activity/audit action performed (e.g. create, update, delete, member_added, access_denied)"
    )
    entity_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Type of entity affected (e.g. organization, department, team, team_member, role, permission, role_permission)"
    )
    entity_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Identifier of the target entity (e.g. ObjectId string or business identifier)"
    )
    user_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Identifier of the actor performing the action (optional for now until User/Auth is integrated)"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Human-readable summary or details of the activity"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Arbitrary contextual key-value payload associated with the activity"
    )
    status: Optional[str] = Field(
        default="SUCCESS",
        max_length=50,
        description="Result status of the activity (e.g. SUCCESS, FAILED, DENIED, WARNING, INFO)"
    )

    @field_validator("module", "action", "entity_type")
    @classmethod
    def normalize_identifiers(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be blank or whitespace only")
        normalized = v.strip().lower()
        if not re.match(r"^[a-z0-9_\-]+$", normalized):
            raise ValueError("Must contain only lowercase alphanumeric characters, hyphens, or underscores")
        return normalized

    @field_validator("status")
    @classmethod
    def normalize_status(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return "SUCCESS"
        return v.strip().upper()

    @field_validator("entity_id", "user_id")
    @classmethod
    def clean_optional_ids(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            return cleaned if cleaned else None
        return None


class ActivityLogCreate(ActivityLogBase):
    """Schema used to record an activity internally or via service layer."""
    pass


class ActivityLogResponse(BaseModel):
    activity_id: str = Field(..., description="Unique activity log identifier")
    user_id: Optional[str] = Field(None, description="User ID of the actor (if authenticated)")
    module: str = Field(..., description="PMS module name")
    action: str = Field(..., description="Action performed")
    entity_type: str = Field(..., description="Target entity type")
    entity_id: Optional[str] = Field(None, description="Target entity identifier")
    description: Optional[str] = Field(None, description="Activity description/details")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Contextual metadata")
    status: str = Field(..., description="Activity outcome status")
    created_at: datetime = Field(..., description="UTC timestamp of the activity")

    model_config = ConfigDict(from_attributes=True)


class ActivityLogPaginationMeta(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool
    has_previous: bool


class ActivityLogPaginatedResponse(BaseModel):
    success: bool = True
    message: str = "Activity logs retrieved successfully"
    data: List[ActivityLogResponse]
    pagination: ActivityLogPaginationMeta
