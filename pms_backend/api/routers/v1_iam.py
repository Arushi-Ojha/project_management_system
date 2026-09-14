import uuid
import random
import io
import csv
import secrets
import string
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token
from services.notification_service import send_email_notification
from models.iam import (
    OrganizationCreate, OrganizationResponse,
    UserCreate, UserResponse,
    TeamCreate, TeamResponse, TeamUpdate,
    SignupRequest, OTPVerifyRequest, LoginRequest, RoleEnum
)

router = APIRouter(prefix="/api/v1/iam", tags=["Identity & Access Management"])

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for i in range(length))

# ==========================================
# AUTHENTICATION & ONBOARDING FLOW
# ==========================================

@router.post("/auth/signup", status_code=201)
async def signup_organization(
    payload: SignupRequest, 
    background_tasks: BackgroundTasks, 
    db = Depends(get_db)
):
    existing_user = await db["users"].find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    otp_code = str(random.randint(100000, 999999))
    
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    org_doc = {
        "id": org_id,
        "name": payload.organizationName,
        "slug": payload.organizationName.lower().replace(" ", "-"),
        "plan": "free",
        "isActive": False,
        "createdAt": now
    }
    await db["organizations"].insert_one(org_doc)

    user_doc = {
        "id": str(uuid.uuid4()),
        "organizationId": org_id,
        "email": payload.email,
        "name": payload.name,
        "role": RoleEnum.owner,
        "passwordHash": hash_password(payload.password),
        "otp": otp_code,
        "isVerified": False,
        "isActive": True,
        "createdAt": now
    }
    await db["users"].insert_one(user_doc)

    email_body = (
        f"Hello {payload.name},\n\n"
        f"Thank you for registering {payload.organizationName}.\n"
        f"Your verification code is: {otp_code}\n\n"
        f"Please enter this code in the app to activate your workspace."
    )
    background_tasks.add_task(
        send_email_notification,
        recipient_email=payload.email,
        subject="Your Workspace Verification Code",
        body=email_body
    )

    return {"message": "Signup successful. Please check your email for the OTP.", "email": payload.email}


@router.post("/auth/verify-otp", status_code=200)
async def verify_otp(payload: OTPVerifyRequest, db = Depends(get_db)):
    user = await db["users"].find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.get("isVerified"):
        return {"message": "Account is already verified. You can log in."}
        
    if user.get("otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    await db["users"].update_one(
        {"email": payload.email},
        {"$set": {"isVerified": True}, "$unset": {"otp": ""}}
    )
    await db["organizations"].update_one(
        {"id": user["organizationId"]},
        {"$set": {"isActive": True}}
    )

    return {"message": "Account verified successfully. You can now log in."}


@router.post("/auth/login", status_code=200)
async def login(payload: LoginRequest, db = Depends(get_db)):
    user = await db["users"].find_one({"email": payload.email})
    
    if not user or not verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not user.get("isVerified"):
        raise HTTPException(status_code=403, detail="Account not verified. Please verify your OTP.")

    token_payload = {
        "userId": user["id"],
        "organizationId": user.get("organizationId", ""),
        "role": user.get("role", "member")
    }
    access_token = create_access_token(data=token_payload)

    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role"),
            "organizationId": user.get("organizationId")
        }
    }

# ==========================================
# STANDARD MANAGEMENT ENDPOINTS
# ==========================================

@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate, 
    background_tasks: BackgroundTasks, 
    db = Depends(get_db)
):
    existing_user = await db["users"].find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    user_doc = payload.model_dump()
    user_doc["id"] = str(uuid.uuid4())
    
    raw_password = generate_random_password()
    user_doc["passwordHash"] = hash_password(raw_password)
    user_doc["isVerified"] = True
    
    if user_doc.get("avatarUrl"):
        user_doc["avatarUrl"] = str(user_doc["avatarUrl"])
        
    user_doc["isActive"] = True
    user_doc["createdAt"] = datetime.now(timezone.utc)
    
    await db["users"].insert_one(user_doc)
    
    user_name = user_doc["name"] or "there"
    email_body = (
        f"Hello {user_name},\n\n"
        f"You have been invited to join the workspace with the role of '{user_doc['role']}'.\n\n"
        f"Your account has been created. Here are your temporary login credentials:\n"
        f"Email: {user_doc['email']}\n"
        f"Password: {raw_password}\n\n"
        f"Please log in and change your password immediately."
    )
    
    background_tasks.add_task(
        send_email_notification,
        recipient_email=user_doc["email"],
        subject="Welcome to the Project Management System",
        body=email_body
    )
    
    return user_doc

@router.get("/organizations/{org_id}/users/export")
async def export_users_csv(org_id: str, db = Depends(get_db)):
    """Exports all users in an organization to a CSV file."""
    cursor = db["users"].find({"isActive": True}) # Prototyping: finding all users
    users = []
    async for doc in cursor:
        users.append(doc)
            
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Role", "Status"])
    
    for u in users:
        writer.writerow([
            u.get("name", ""),
            u.get("email", ""),
            u.get("role", ""),
            "Active" if u.get("isActive") else "Inactive"
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users_export.csv"}
    )

@router.post("/organizations/{org_id}/users/bulk-upload")
async def bulk_upload_users(
    org_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db = Depends(get_db)
):
    """Bulk creates users from a CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
        
    content = await file.read()
    decoded = content.decode('utf-8-sig') 
    reader = csv.DictReader(io.StringIO(decoded))
    
    created_count = 0
    skipped_count = 0
    
    for row in reader:
        name = row.get("Name", "").strip()
        email = row.get("Email", "").strip()
        role = row.get("Role", "member").strip().lower()
        
        if not email:
            skipped_count += 1
            continue
            
        existing = await db["users"].find_one({"email": email})
        if existing:
            skipped_count += 1
            continue
            
        raw_password = generate_random_password()
        
        user_doc = {
            "id": str(uuid.uuid4()),
            "organizationId": org_id,
            "name": name,
            "email": email,
            "role": role if role in ["owner", "admin", "member", "guest"] else "member",
            "passwordHash": hash_password(raw_password),
            "isVerified": True,
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db["users"].insert_one(user_doc)
        created_count += 1
        
        email_body = (
            f"Hello {name},\n\n"
            f"You have been mass-onboarded to the workspace.\n"
            f"Email: {email}\n"
            f"Password: {raw_password}\n\n"
            f"Please log in and change your password."
        )
        
        background_tasks.add_task(
            send_email_notification,
            recipient_email=email,
            subject="Welcome to the Project Management System",
            body=email_body
        )
        
    return {"message": f"Bulk upload complete. Created {created_count} users. Skipped {skipped_count}."}


@router.post("/teams", response_model=TeamResponse, status_code=201)
async def create_team(payload: TeamCreate, db = Depends(get_db)):
    org = await db["organizations"].find_one({"id": payload.organizationId})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found. Cannot create team.")
        
    team_doc = payload.model_dump()
    team_doc["id"] = str(uuid.uuid4())
    
    await db["teams"].insert_one(team_doc)
    return team_doc

@router.patch("/teams/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, payload: TeamUpdate, db = Depends(get_db)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db["teams"].find_one_and_update(
        {"id": team_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    result.pop("_id", None)
    return result

from core.security import get_current_user

@router.get("/organizations/{org_id}/users", response_model=List[UserResponse])
async def get_organization_users(org_id: str, user = Depends(get_current_user), db = Depends(get_db)):
    query = {"isActive": True, "organizationId": org_id}
    
    if user.get("role") != "owner":
        # Admin and Members only see member users
        query["role"] = "member"
        
    cursor = db["users"].find(query)
    users = []
    async for doc in cursor:
        doc.pop("_id", None)
        users.append(doc)
    return users

@router.get("/organizations/{org_id}/teams", response_model=List[TeamResponse])
async def get_organization_teams(org_id: str, db = Depends(get_db)):
    cursor = db["teams"].find({"organizationId": org_id})
    teams = []
    async for doc in cursor:
        doc.pop("_id", None)
        teams.append(doc)
    return teams

@router.get("/users/lookup", tags=["Identity & Access Management"])
async def get_user_id_by_email(
    email: str = Query(..., description="The email address to search for"),
    db = Depends(get_db)
):
    user = await db["users"].find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found.")
        
    return {
        "email": user["email"],
        "id": user["id"],
        "name": user.get("name", "Unknown")
    }

@router.delete("/teams/{team_id}", status_code=204)
async def delete_team(team_id: str, db = Depends(get_db)):
    # Conflict Check
    active_projects = await db["projects"].count_documents({"teamIds": team_id})
    if active_projects > 0:
        raise HTTPException(
            status_code=409, 
            detail=f"Conflict: Cannot delete Team. It is assigned to {active_projects} active project(s). Please edit or delete those projects first."
        )
        
    result = await db["teams"].delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found.")
    return None