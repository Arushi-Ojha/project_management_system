import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from core.database import get_db
from models.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentStatusUpdate,
    DepartmentResponse,
    DepartmentDetailResponse,
    DepartmentStatus
)

router = APIRouter(prefix="/api/v1", tags=["Departments"])

@router.post("/organizations/{organization_id}/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(organization_id: str, dept_in: DepartmentCreate, db = Depends(get_db)):
    if dept_in.organization_id is not None and str(dept_in.organization_id) != str(organization_id):
        raise HTTPException(status_code=400, detail="Organization ID mismatch")

    dept_doc = dept_in.model_dump()
    dept_doc["department_id"] = str(uuid.uuid4())
    dept_doc["organization_id"] = organization_id
    dept_doc["created_at"] = datetime.now(timezone.utc)
    dept_doc["updated_at"] = datetime.now(timezone.utc)

    # Check for duplicate
    existing = await db["departments"].find_one({"organization_id": organization_id, "department_name": dept_doc["department_name"]})
    if existing:
        raise HTTPException(status_code=409, detail="Department with this name already exists in the organization.")

    await db["departments"].insert_one(dept_doc)
    return dept_doc

@router.get("/organizations/{organization_id}/departments", response_model=List[DepartmentResponse])
async def list_departments(organization_id: str, search: Optional[str] = None, status: Optional[DepartmentStatus] = None, db = Depends(get_db)):
    query = {"organization_id": organization_id}
    if status:
        query["status"] = status
    if search:
        query["department_name"] = {"$regex": search, "$options": "i"}
        
    cursor = db["departments"].find(query)
    depts = []
    async for doc in cursor:
        doc.pop("_id", None)
        depts.append(doc)
    return depts

@router.get("/departments/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: str, db = Depends(get_db)):
    dept = await db["departments"].find_one({"department_id": department_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.pop("_id", None)
    return dept

@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(department_id: str, dept_in: DepartmentUpdate, db = Depends(get_db)):
    update_data = {k: v for k, v in dept_in.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await db["departments"].find_one_and_update(
        {"department_id": department_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    result.pop("_id", None)
    return result

@router.delete("/departments/{department_id}", status_code=204)
async def delete_department(department_id: str, db = Depends(get_db)):
    result = await db["departments"].delete_one({"department_id": department_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return None
