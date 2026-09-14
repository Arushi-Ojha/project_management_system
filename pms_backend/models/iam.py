from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class PlanEnum(str, Enum):
    free = "free"
    starter = "starter"
    business = "business"
    enterprise = "enterprise"

class RoleEnum(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    guest = "guest"

# ==========================================
# ORGANIZATION SCHEMAS
# ==========================================
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Name of the organization")
    slug: Optional[str] = None
    plan: Optional[PlanEnum] = Field(default=PlanEnum.free)

class OrganizationResponse(OrganizationCreate):
    id: str = Field(..., description="UUID")
    createdAt: datetime

# ==========================================
# USER SCHEMAS
# ==========================================
class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    avatarUrl: Optional[HttpUrl] = None
    role: Optional[RoleEnum] = Field(default=RoleEnum.member)

class UserResponse(UserCreate):
    id: str = Field(..., description="UUID")
    isActive: bool
    createdAt: datetime

# ==========================================
# TEAM SCHEMAS
# ==========================================
class TeamCreate(BaseModel):
    organizationId: str = Field(..., description="UUID of the parent organization")
    name: str = Field(..., min_length=2)
    key: str = Field(..., min_length=2, max_length=10, description="Short prefix, e.g. ENG")
    leadId: Optional[str] = None
    memberIds: Optional[List[str]] = []
    workflowId: Optional[str] = None

class TeamResponse(TeamCreate):
    id: str = Field(..., description="UUID")

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    leadId: Optional[str] = None
    memberIds: Optional[List[str]] = None
    workflowId: Optional[str] = None

class SignupRequest(BaseModel):
    organizationName: str = Field(..., min_length=2)
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str