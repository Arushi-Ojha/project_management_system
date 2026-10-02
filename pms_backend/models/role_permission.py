from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class RolePermissionAssign(BaseModel):
    permission_id: str = Field(..., description="ID of the permission to assign to the role", json_schema_extra={"example": "660000000000000000000001"})

    @field_validator("permission_id")
    @classmethod
    def validate_permission_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("permission_id cannot be empty")
        return v.strip()


class RolePermissionBulkAssign(BaseModel):
    permission_ids: List[str] = Field(
        ...,
        description="List of permission IDs to assign to the role",
        json_schema_extra={"example": ["660000000000000000000001", "660000000000000000000002"]}
    )

    @field_validator("permission_ids")
    @classmethod
    def validate_permission_ids(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("permission_ids list cannot be empty")
        cleaned = [p.strip() for p in v if p and p.strip()]
        if not cleaned:
            raise ValueError("permission_ids list cannot contain only empty strings")
        # Preserve uniqueness while maintaining order
        seen = set()
        deduped = []
        for pid in cleaned:
            if pid not in seen:
                seen.add(pid)
                deduped.append(pid)
        return deduped


class RolePermissionMappingResponse(BaseModel):
    mapping_id: str
    role_id: str
    permission_id: str
    created_at: datetime
    updated_at: datetime


class RoleAssignedPermissionItem(BaseModel):
    mapping_id: str
    permission_id: str
    permission_key: str
    module: str
    action: str
    description: Optional[str] = None
    status: str
    assigned_at: datetime


class PermissionAssignedRoleItem(BaseModel):
    mapping_id: str
    role_id: str
    role_key: str
    role_name: str
    scope_type: str
    organization_id: Optional[str] = None
    is_system_role: bool
    status: str
    assigned_at: datetime


class RolePermissionBulkResponse(BaseModel):
    role_id: str
    assigned_count: int
    already_assigned_count: int
    total_requested: int
    permission_ids: List[str]
