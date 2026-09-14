import uuid
from fastapi import APIRouter, Depends
from core.database import get_db
from models.extension import AutomationCreate, AutomationResponse, WebhookCreate, WebhookResponse

router = APIRouter(prefix="/api/v1/extensions", tags=["Extensibility & Governance"])

@router.post("/webhooks", response_model=WebhookResponse, status_code=201)
async def create_webhook(payload: WebhookCreate, db = Depends(get_db)):
    webhook_doc = payload.model_dump()
    webhook_doc["id"] = str(uuid.uuid4())
    # Ensure URL is saved as a string
    webhook_doc["url"] = str(webhook_doc["url"])
    
    await db["webhooks"].insert_one(webhook_doc)
    return webhook_doc

from core.security import get_current_user

@router.get("/audit-logs", tags=["Extensibility & Governance"])
async def get_audit_logs(user = Depends(get_current_user), db = Depends(get_db)):
    """Allows fetching the system audit trail with RBAC."""
    query = {}
    if user.get("role") != "owner":
        query["actorId"] = user["id"]
        
    cursor = db["auditLog"].find(query).sort("timestamp", -1).limit(100)
    logs = [doc async for doc in cursor]
    for log in logs:
        log["_id"] = str(log["_id"]) # Clean MongoDB ObjectID for JSON serialization
    return logs