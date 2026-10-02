from enum import Enum
class PermissionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator



class PermissionBase(BaseModel):
    module: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Module name (e.g. organization, user, project, task)"
    )
    action: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Action name (e.g. create, read, update, delete, manage)"
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Human-readable description of what this permission grants"
    )

    @field_validator("module", "action")
    @classmethod
    def validate_identifier_slug(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be blank or whitespace only")
        normalized = v.strip().lower()
        if not re.match(r"^[a-z0-9_\-]+$", normalized):
            raise ValueError("Must contain only lowercase alphanumeric characters, hyphens, or underscores")
        return normalized


class PermissionCreate(PermissionBase):
    permission_key: Optional[str] = Field(
        None,
        max_length=205,
        description="Explicit permission key in 'module:action' format. If omitted, generated automatically."
    )
    status: Optional[PermissionStatus] = Field(
        default=PermissionStatus.ACTIVE,
        description="Permission status (ACTIVE or INACTIVE)"
    )

    @model_validator(mode="after")
    def validate_or_generate_key(self) -> "PermissionCreate":
        expected_key = f"{self.module}:{self.action}"
        if self.permission_key:
            normalized_key = self.permission_key.strip().lower()
            if normalized_key != expected_key:
                raise ValueError(
                    f"Provided permission_key '{self.permission_key}' does not match expected '{expected_key}'"
                )
            self.permission_key = normalized_key
        else:
            self.permission_key = expected_key
        return self


class PermissionUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[PermissionStatus] = None


class PermissionStatusUpdate(BaseModel):
    status: PermissionStatus = Field(..., description="Updated permission status (ACTIVE or INACTIVE)")


class PermissionResponse(BaseModel):
    permission_id: str = Field(..., description="Unique permission identifier")
    permission_key: str = Field(..., description="Canonical permission key in module:action format")
    module: str = Field(..., description="Associated PMS module")
    action: str = Field(..., description="Associated action")
    description: Optional[str] = Field(None, description="Human-readable permission description")
    status: PermissionStatus = Field(..., description="Status of the permission (ACTIVE or INACTIVE)")
    created_at: datetime = Field(..., description="UTC creation timestamp")
    updated_at: datetime = Field(..., description="UTC last update timestamp")

    model_config = ConfigDict(from_attributes=True)
