import uuid
import random
import io
import csv
import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from services.notification_service import send_email_notification
from models.system_log import SystemLogResponse
from models.notification import NotificationType
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
        "plan": "enterprise",
        "isActive": False,
        "createdAt": now
    }
    await db["organizations"].insert_one(org_doc)

    user_doc = {
        "id": str(uuid.uuid4()),
        "organizationId": org_id,
        "email": payload.email,
        "name": payload.name,
        "role": RoleEnum.admin,
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

    org_id = user.get("organizationId")
    if not org_id:
        org = await db["organizations"].find_one({"isActive": True})
        if org:
            org_id = org["id"]
            await db["users"].update_one({"id": user["id"]}, {"$set": {"organizationId": org_id}})

    # Fetch user's organization name
    org_name = "Enterprise Workspace"
    if org_id:
        org_doc = await db["organizations"].find_one({"id": org_id})
        if org_doc:
            org_name = org_doc.get("name", org_name)

    token_payload = {
        "userId": user["id"],
        "organizationId": org_id or "",
        "role": user.get("role", "member")
    }
    access_token = create_access_token(data=token_payload)

    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "user": {
            "id": user["id"],
            "name": user.get("name", ""),
            "email": user["email"],
            "role": user.get("role"),
            "organizationId": org_id,
            "organizationName": org_name,
            "employeeId": user.get("employeeId"),
            "position": user.get("position"),
            "avatarUrl": user.get("avatarUrl")
        }
    }

# ==========================================
# USER MANAGEMENT & BULK ACTIONS
# ==========================================

@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate, 
    background_tasks: BackgroundTasks, 
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Admin creates a Project Manager or Employee.
    Auto-generates employeeId (if not supplied), auto-generates temporary password,
    and sends login credentials to their email.
    """
    existing_user = await db["users"].find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    user_doc = payload.model_dump()
    user_doc["id"] = str(uuid.uuid4())
    
    # Auto-generate employeeId if missing
    if not user_doc.get("employeeId"):
        user_doc["employeeId"] = f"EMP-{random.randint(1000, 9999)}"
        
    raw_password = generate_random_password()
    user_doc["passwordHash"] = hash_password(raw_password)
    user_doc["isVerified"] = True
    user_doc["isActive"] = True
    user_doc["createdAt"] = datetime.now(timezone.utc)
    
    if user_doc.get("avatarUrl"):
        user_doc["avatarUrl"] = str(user_doc["avatarUrl"])
        
    if not user_doc.get("organizationId"):
        user_doc["organizationId"] = current_user.get("organizationId")

    await db["users"].insert_one(user_doc)
    
    user_name = user_doc["name"] or "there"
    email_body = (
        f"Hello {user_name},\n\n"
        f"You have been added to the enterprise portal with the role of '{user_doc['role']}'.\n\n"
        f"Your Employee ID: {user_doc['employeeId']}\n"
        f"Login Email: {user_doc['email']}\n"
        f"Temporary Password: {raw_password}\n\n"
        f"Please log in and update your password and avatar from your profile settings."
    )
    
    background_tasks.add_task(
        send_email_notification,
        recipient_email=user_doc["email"],
        subject="Welcome: Your Project Management System Credentials",
        body=email_body
    )
    
    return user_doc


@router.post("/organizations/{org_id}/users/bulk-upload")
async def bulk_upload_users(
    org_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db = Depends(get_db)
):
    """
    Bulk creates users from an Excel (.xlsx/.xls) or CSV (.csv) file.
    Auto-generates employee ID, creates temporary password, and sends credentials via email.
    """
    filename = file.filename.lower()
    content = await file.read()
    
    rows = []
    
    if filename.endswith(".csv"):
        decoded = content.decode('utf-8-sig', errors='replace')
        reader = csv.DictReader(io.StringIO(decoded))
        for r in reader:
            rows.append({k.strip().lower(): v.strip() for k, v in r.items() if k})
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            header = [str(cell.value).strip().lower() if cell.value else "" for cell in sheet[1]]
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if any(row):
                    row_dict = {header[i]: str(val).strip() if val is not None else "" for i, val in enumerate(row) if i < len(header)}
                    rows.append(row_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")

    created_count = 0
    skipped_count = 0
    
    valid_roles = ["owner", "admin", "project_manager", "employee", "member", "guest"]

    for row in rows:
        name = row.get("name", "")
        email = row.get("email", "")
        role = row.get("role", "employee").lower()
        position = row.get("position", "")
        emp_id = row.get("employeeid") or row.get("id") or f"EMP-{random.randint(1000, 9999)}"
        
        if not email or "@" not in email:
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
            "name": name or email.split("@")[0].capitalize(),
            "email": email,
            "role": role if role in valid_roles else "employee",
            "employeeId": emp_id,
            "position": position or "Specialist",
            "passwordHash": hash_password(raw_password),
            "isVerified": True,
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db["users"].insert_one(user_doc)
        created_count += 1
        
        email_body = (
            f"Hello {user_doc['name']},\n\n"
            f"Your employee account has been created via bulk import.\n\n"
            f"Employee ID: {emp_id}\n"
            f"Email: {email}\n"
            f"Temporary Password: {raw_password}\n\n"
            f"Please log in and update your password immediately."
        )
        
        background_tasks.add_task(
            send_email_notification,
            recipient_email=email,
            subject="Account Activated - Project Management System",
            body=email_body
        )
        
    return {
        "message": f"Bulk import complete. Successfully created {created_count} users. Skipped {skipped_count}.",
        "createdCount": created_count,
        "skippedCount": skipped_count
    }


@router.get("/organizations/{org_id}/users/export")
async def export_users_csv(org_id: str, db = Depends(get_db)):
    """Exports all users in an organization to a CSV file."""
    cursor = db["users"].find({"organizationId": org_id, "isActive": True})
    users = []
    async for doc in cursor:
        users.append(doc)
            
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["EmployeeId", "Name", "Email", "Role", "Position", "Status"])
    
    for u in users:
        writer.writerow([
            u.get("employeeId", ""),
            u.get("name", ""),
            u.get("email", ""),
            u.get("role", ""),
            u.get("position", ""),
            "Active" if u.get("isActive") else "Inactive"
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=organization_users.csv"}
    )


@router.patch("/users/me")
async def update_my_profile(payload: dict, user = Depends(get_current_user), db = Depends(get_db)):
    """Update profile: strictly password and avatarUrl as specified."""
    update_data = {}
    if "avatarUrl" in payload:
        update_data["avatarUrl"] = payload["avatarUrl"]
    if "password" in payload and payload["password"]:
        if len(payload["password"]) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        update_data["passwordHash"] = hash_password(payload["password"])
        
    if update_data:
        await db["users"].update_one(
            {"id": user["id"]},
            {"$set": update_data}
        )
    return {"message": "Profile updated successfully"}


@router.get("/system/logs", response_model=List[SystemLogResponse])
async def get_system_logs(user = Depends(get_current_user), db = Depends(get_db)):
    """Fetch raw terminal logs recorded by middleware (Admin only, auto-purged after 24 hours)"""
    if user.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    cursor = db["system_logs"].find().sort("timestamp", -1).limit(150)
    logs = []
    async for doc in cursor:
        doc.pop("_id", None)
        logs.append(doc)
    return logs


@router.post("/meet/schedule")
async def schedule_google_meet(
    payload: dict, 
    bg_tasks: BackgroundTasks, 
    user = Depends(get_current_user), 
    db = Depends(get_db)
):
    """
    Generates a Google Meet link and sends email invites to selected attendees or everyone.
    Also creates in-app notifications for each participant.
    """
    title = payload.get("title", "Project Synchronization Meeting")
    meet_date = payload.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    meet_time = payload.get("time", "15:00")
    attendee_ids = payload.get("attendeeIds", [])

    meet_code = f"{random.choice(string.ascii_lowercase)*3}-{random.choice(string.ascii_lowercase)*4}-{random.choice(string.ascii_lowercase)*3}"
    meet_link = f"https://meet.google.com/{meet_code}"

    # Determine recipient users
    org_id = user.get("organizationId")
    if attendee_ids and len(attendee_ids) > 0:
        cursor = db["users"].find({"id": {"$in": attendee_ids}, "isActive": True})
    else:
        # If no specific attendees selected, invite everyone in the org
        cursor = db["users"].find({"organizationId": org_id, "isActive": True})

    attendees = []
    async for doc in cursor:
        attendees.append(doc)

    now = datetime.now(timezone.utc)
    organizer_name = user.get("name", "Team Member")

    for attendee in attendees:
        # Create in-app notification
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "recipient_id": attendee["id"],
            "sender_id": user["id"],
            "title": f"Google Meet: {title}",
            "message": f"{organizer_name} scheduled a meeting for {meet_date} at {meet_time}. Click to join.",
            "type": NotificationType.MEET_INVITE,
            "entity_type": "meet",
            "entity_id": meet_code,
            "action_url": meet_link,
            "read": False,
            "response_status": None,
            "created_at": now
        }
        await db["notifications"].insert_one(notif_doc)

        if attendee.get("email"):
            email_body = (
                f"Hello {attendee.get('name', 'there')},\n\n"
                f"{organizer_name} has scheduled a Google Meet session:\n\n"
                f"Title: {title}\n"
                f"Date: {meet_date}\n"
                f"Time: {meet_time}\n"
                f"Meeting URL: {meet_link}\n\n"
                f"Please join on time."
            )
            bg_tasks.add_task(
                send_email_notification,
                recipient_email=attendee["email"],
                subject=f"Meeting Invitation: {title} ({meet_date} at {meet_time})",
                body=email_body
            )

    return {
        "message": f"Meeting scheduled successfully with {len(attendees)} participants.",
        "meetLink": meet_link,
        "date": meet_date,
        "time": meet_time
    }

# ==========================================
# TEAMS & AVAILABILITY
# ==========================================

@router.post("/teams", response_model=TeamResponse, status_code=201)
async def create_team(payload: TeamCreate, db = Depends(get_db)):
    org = await db["organizations"].find_one({"id": payload.organizationId})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
        
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


@router.get("/organizations/{org_id}/users", response_model=List[UserResponse])
async def get_organization_users(
    org_id: str, 
    role: Optional[str] = None,
    user = Depends(get_current_user), 
    db = Depends(get_db)
):
    query = {"isActive": True, "organizationId": org_id}
    
    caller_role = user.get("role", "employee")
    # Admin is invisible to employee and the rest of workspace
    if caller_role not in ["admin", "owner"]:
        if role in ["admin", "owner"]:
            return []  # Invisible to non-admins
        if role:
            query["role"] = role
        else:
            query["role"] = {"$nin": ["admin", "owner"]}
    elif role:
        query["role"] = role
        
    cursor = db["users"].find(query)
    users = []
    async for doc in cursor:
        doc.pop("_id", None)
        users.append(doc)
    return users


@router.get("/organizations/{org_id}/employees/availability")
async def get_employee_availability(
    org_id: str, 
    position: Optional[str] = Query(None, description="Filter by position"),
    sort_by: str = Query("availability", description="'availability' or 'position'"),
    db = Depends(get_db)
):
    """
    Intelligent Staffing Engine:
    Calculates workload for each employee.
    Project Manager is head of the project (not staff).
    Admin is not staff.
    Only regular employees/members are considered staff.
    """
    query = {
        "isActive": True, 
        "organizationId": org_id, 
        "role": {"$in": ["employee", "member"]}  # Strictly staff only
    }
    if position:
        query["position"] = {"$regex": position, "$options": "i"}

    cursor = db["users"].find(query)
    employees = []
    async for doc in cursor:
        doc.pop("_id", None)
        employees.append(doc)
        
    now = datetime.now(timezone.utc)
    seven_days_later = now + timedelta(days=7)
    now_str = now.strftime("%Y-%m-%d")
    seven_days_str = seven_days_later.strftime("%Y-%m-%d")
    
    enriched = []
    for emp in employees:
        user_id = emp["id"]
        
        # Count active assigned projects
        active_projects = await db["projects"].count_documents({
            "organizationId": org_id,
            "status": {"$in": ["created", "planned", "active"]},
            "assignments.userId": user_id,
            "assignments.status": {"$in": ["pending", "accepted"]}
        })
        
        # Count tasks due in next 7 days
        tasks_next_7_days = await db["issues"].count_documents({
            "assigneeId": user_id,
            "status": {"$nin": ["completed", "approved"]},
            "assignmentStatus": {"$in": ["pending", "accepted"]},
            "$or": [
                {"deadline": {"$gte": now_str, "$lte": seven_days_str}},
                {"dueDate": {"$gte": now_str, "$lte": seven_days_str}},
                {"deadline": {"$gte": now, "$lte": seven_days_later}},
                {"dueDate": {"$gte": now, "$lte": seven_days_later}}
            ]
        })
        
        # Overloaded rule: active_projects >= 2 OR tasks_next_7_days >= 3
        is_overloaded = (active_projects >= 2) or (tasks_next_7_days >= 3)
        
        emp["active_projects_count"] = active_projects
        emp["tasks_next_7_days_count"] = tasks_next_7_days
        emp["is_overloaded"] = is_overloaded
        
        enriched.append(emp)
        
    if sort_by == "position":
        enriched.sort(key=lambda x: (x.get("position") or "", x["is_overloaded"]))
    else:
        # Available (not overloaded) come first, then least active projects, then least tasks
        enriched.sort(key=lambda x: (x["is_overloaded"], x["active_projects_count"], x["tasks_next_7_days_count"]))
        
    return enriched


@router.get("/organizations/{org_id}/teams", response_model=List[TeamResponse])
async def get_organization_teams(org_id: str, db = Depends(get_db)):
    cursor = db["teams"].find({"organizationId": org_id})
    teams = []
    async for doc in cursor:
        doc.pop("_id", None)
        teams.append(doc)
    return teams


@router.get("/users/lookup", tags=["Identity & Access Management"])
async def get_user_id_by_email(email: str = Query(...), db = Depends(get_db)):
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user["email"], "id": user["id"], "name": user.get("name", "Unknown")}


@router.delete("/teams/{team_id}", status_code=204)
async def delete_team(team_id: str, db = Depends(get_db)):
    active_projects = await db["projects"].count_documents({"teamIds": team_id})
    if active_projects > 0:
        raise HTTPException(
            status_code=409, 
            detail=f"Conflict: Cannot delete Team assigned to {active_projects} active project(s)."
        )
    result = await db["teams"].delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return None