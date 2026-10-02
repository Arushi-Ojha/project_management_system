from enum import Enum
class DepartmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class DepartmentBase(BaseModel):
    department_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Name of the department (unique within organization)"
    )
    department_description: Optional[str] = Field(
        None,
        description="Detailed description of the department's purpose"
    )
    department_head: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the department head / manager"
    )

    @field_validator("department_name")
    @classmethod
    def validate_name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Department name cannot be empty or blank")
        return v.strip()


class DepartmentCreate(DepartmentBase):
    organization_id: Optional[str] = Field(
        None,
        description="Parent organization ID (optional in body if provided in route URL)"
    )
    status: Optional[DepartmentStatus] = Field(
        default=DepartmentStatus.ACTIVE,
        description="Initial department status (ACTIVE or INACTIVE)"
    )


class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Updated department name"
    )
    department_description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    department_head: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated department head name"
    )
    status: Optional[DepartmentStatus] = Field(
        None,
        description="Updated status"
    )

    @field_validator("department_name")
    @classmethod
    def validate_name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Department name cannot be empty or blank")
            return v.strip()
        return v


class DepartmentStatusUpdate(BaseModel):
    status: DepartmentStatus = Field(
        ...,
        description="Target status: ACTIVE or INACTIVE"
    )


class DepartmentResponse(BaseModel):
    department_id: str = Field(..., description="Unique department ID")
    organization_id: str = Field(..., description="ID of the parent organization")
    department_name: str
    department_description: Optional[str] = None
    department_head: Optional[str] = None
    status: DepartmentStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DepartmentDetailResponse(BaseModel):
    department: DepartmentResponse = Field(..., description="Department detailed information")
    department_head: Optional[str] = Field(None, description="Current department head")
    status: DepartmentStatus = Field(..., description="Current status of the department")
    team_count: int = Field(0, description="Total teams in this department")
    user_count: int = Field(0, description="Total users in this department (0 until User Management)")
    project_count: int = Field(0, description="Total projects assigned to this department (0 until Projects Module)")
    historical_activity: List[Any] = Field(default_factory=list, description="Historical activity log entries (0 until Activity Logs Module)")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

