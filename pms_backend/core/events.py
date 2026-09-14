import uuid
from datetime import datetime, timezone
from core.database import get_db
from models.extension import AuditLogEntryCreate

async def dispatch_audit_log(log_data: AuditLogEntryCreate):
    """
    Saves an audit log entry asynchronously.
    Designed to be passed into FastAPI's BackgroundTasks.
    """
    db = get_db()
    
    log_doc = log_data.model_dump()
    log_doc["id"] = str(uuid.uuid4())
    log_doc["timestamp"] = datetime.now(timezone.utc)
    
    try:
        await db["auditLog"].insert_one(log_doc)
        print(f"Audit log recorded: {log_doc['action']} on {log_doc['entityType']}")
    except Exception as e:
        print(f"CRITICAL: Failed to write audit log - {str(e)}")