import uuid
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from enum import Enum

class LogLevel(str, Enum):
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    DEBUG = "DEBUG"

class SystemLogCreate(BaseModel):
    message: str = Field(..., description="Raw terminal log message")
    level: LogLevel = Field(default=LogLevel.INFO)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemLogResponse(SystemLogCreate):
    log_id: str
