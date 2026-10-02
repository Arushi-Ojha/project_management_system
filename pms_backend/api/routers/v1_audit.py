import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from core.database import get_db
from models.activity_log import ActivityLogCreate, ActivityLogResponse

router = APIRouter(prefix="/api/v1/audit", tags=["Audit & Activity Logs"])

@router.post("/logs", response_model=ActivityLogResponse, status_code=201)
async def create_activity_log(log_in: ActivityLogCreate, db = Depends(get_db)):
    log_doc = log_in.model_dump()
    log_doc["log_id"] = str(uuid.uuid4())
    log_doc["created_at"] = datetime.now(timezone.utc)
    
    await db["activity_logs"].insert_one(log_doc)
    return log_doc

@router.get("/logs", response_model=List[ActivityLogResponse])
async def list_activity_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db = Depends(get_db)
):
    query = {}
    if module: query["module"] = module
    if action: query["action"] = action
    if user_id: query["user_id"] = user_id
    if status: query["status"] = status
    
    cursor = db["activity_logs"].find(query).sort("created_at", -1).limit(limit)
    logs = []
    async for doc in cursor:
        doc.pop("_id", None)
        logs.append(doc)
    return logs
