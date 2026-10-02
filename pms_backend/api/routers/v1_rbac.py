import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from core.database import get_db
from models.role import RoleCreate, RoleUpdate, RoleResponse, RoleStatusUpdate, RoleStatus
from models.permission import PermissionCreate, PermissionUpdate, PermissionResponse, PermissionStatusUpdate, PermissionStatus
from models.role_permission import RolePermissionAssign, RolePermissionMappingResponse

router = APIRouter(prefix="/api/v1/rbac", tags=["RBAC"])

# ==================== ROLES ====================

@router.post("/roles", response_model=RoleResponse, status_code=201)
async def create_role(role_in: RoleCreate, db = Depends(get_db)):
    role_doc = role_in.model_dump()
    role_doc["role_id"] = str(uuid.uuid4())
    role_doc["created_at"] = datetime.now(timezone.utc)
    role_doc["updated_at"] = datetime.now(timezone.utc)

    existing = await db["roles"].find_one({"role_key": role_doc["role_key"]})
    if existing:
        raise HTTPException(status_code=409, detail="Role key already exists.")

    await db["roles"].insert_one(role_doc)
    return role_doc

@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(db = Depends(get_db)):
    cursor = db["roles"].find({})
    roles = []
    async for doc in cursor:
        doc.pop("_id", None)
        roles.append(doc)
    return roles

@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(role_id: str, db = Depends(get_db)):
    result = await db["roles"].delete_one({"role_id": role_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    # Also delete associated permissions mapping
    await db["role_permissions"].delete_many({"role_id": role_id})
    return None

# ==================== PERMISSIONS ====================

@router.post("/permissions", response_model=PermissionResponse, status_code=201)
async def create_permission(perm_in: PermissionCreate, db = Depends(get_db)):
    perm_doc = perm_in.model_dump()
    perm_doc["permission_id"] = str(uuid.uuid4())
    perm_doc["created_at"] = datetime.now(timezone.utc)
    perm_doc["updated_at"] = datetime.now(timezone.utc)

    existing = await db["permissions"].find_one({"permission_key": perm_doc["permission_key"]})
    if existing:
        raise HTTPException(status_code=409, detail="Permission key already exists.")

    await db["permissions"].insert_one(perm_doc)
    return perm_doc

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(db = Depends(get_db)):
    cursor = db["permissions"].find({})
    perms = []
    async for doc in cursor:
        doc.pop("_id", None)
        perms.append(doc)
    return perms

# ==================== ROLE-PERMISSIONS MAPPING ====================

@router.post("/roles/{role_id}/permissions", response_model=RolePermissionMappingResponse, status_code=201)
async def assign_permission_to_role(role_id: str, payload: RolePermissionAssign, db = Depends(get_db)):
    rp_doc = payload.model_dump()
    rp_doc["mapping_id"] = str(uuid.uuid4())
    rp_doc["role_id"] = role_id
    rp_doc["created_at"] = datetime.now(timezone.utc)
    rp_doc["updated_at"] = datetime.now(timezone.utc)

    existing = await db["role_permissions"].find_one({"role_id": role_id, "permission_id": payload.permission_id})
    if existing:
        raise HTTPException(status_code=409, detail="Permission already assigned to this role.")

    await db["role_permissions"].insert_one(rp_doc)
    return rp_doc

@router.get("/roles/{role_id}/permissions", response_model=List[RolePermissionMappingResponse])
async def get_role_permissions(role_id: str, db = Depends(get_db)):
    cursor = db["role_permissions"].find({"role_id": role_id})
    mappings = []
    async for doc in cursor:
        doc.pop("_id", None)
        mappings.append(doc)
    return mappings
