from enum import Enum
class RoleScopeType(str, Enum):
    GLOBAL = "GLOBAL"
    ORGANIZATION = "ORGANIZATION"
class RoleStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator



class RoleBase(BaseModel):
    role_key: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Machine-readable unique key (e.g. administrator, project_manager, viewer)"
    )
    role_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Human-readable role name (e.g. Administrator, Project Manager)"
    )
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Detailed description of the role's scope and permissions"
    )
    scope_type: RoleScopeType = Field(
        default=RoleScopeType.GLOBAL,
        description="Scope of the role: GLOBAL (PMS-wide) or ORGANIZATION (tied to a specific organization)"
    )
    organization_id: Optional[str] = Field(
        None,
        description="Organization ID this role is scoped to (required if scope_type is ORGANIZATION, must be null if GLOBAL)"
    )
    is_system_role: bool = Field(
        default=False,
        description="Whether this is a built-in PMS system role"
    )

    @field_validator("role_key")
    @classmethod
    def validate_role_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("role_key cannot be blank or whitespace only")
        normalized = v.strip().lower()
        if not re.match(r"^[a-z0-9_\-]+$", normalized):
            raise ValueError("role_key must contain only lowercase alphanumeric characters, hyphens, or underscores")
        return normalized

    @field_validator("role_name")
    @classmethod
    def validate_role_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("role_name cannot be blank or whitespace only")
        return v.strip()

    @model_validator(mode="after")
    def validate_scope_and_org(self) -> "RoleBase":
        if self.scope_type == RoleScopeType.ORGANIZATION:
            if not self.organization_id or not str(self.organization_id).strip():
                raise ValueError("organization_id is required when scope_type is 'ORGANIZATION'")
            self.organization_id = str(self.organization_id).strip()
        elif self.scope_type == RoleScopeType.GLOBAL:
            # Global roles cannot be bound to a specific organization
            if self.organization_id is not None:
                self.organization_id = None
        return self


class RoleCreate(RoleBase):
    status: Optional[RoleStatus] = Field(
        default=RoleStatus.ACTIVE,
        description="Initial role status (ACTIVE or INACTIVE)"
    )


class RoleUpdate(BaseModel):
    role_name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[RoleStatus] = None

    @field_validator("role_name")
    @classmethod
    def validate_role_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("role_name cannot be blank")
            return v.strip()
        return None


class RoleStatusUpdate(BaseModel):
    status: RoleStatus = Field(..., description="Updated role status (ACTIVE or INACTIVE)")


class RoleResponse(BaseModel):
    role_id: str = Field(..., description="Unique role identifier")
    role_key: str = Field(..., description="Canonical machine-readable role key")
    role_name: str = Field(..., description="Human-readable display name")
    description: Optional[str] = Field(None, description="Role description")
    scope_type: RoleScopeType = Field(..., description="Scope type (GLOBAL or ORGANIZATION)")
    organization_id: Optional[str] = Field(None, description="Organization ID if scoped to an organization")
    is_system_role: bool = Field(..., description="Flag indicating system-level role")
    status: RoleStatus = Field(..., description="Status of the role (ACTIVE or INACTIVE)")
    created_at: datetime = Field(..., description="UTC creation timestamp")
    updated_at: datetime = Field(..., description="UTC last update timestamp")

    model_config = ConfigDict(from_attributes=True)
