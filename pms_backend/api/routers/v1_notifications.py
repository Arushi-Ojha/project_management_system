import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from core.database import get_db
from core.security import get_current_user
from services.notification_service import send_email_notification
from models.notification import NotificationCreate, NotificationResponse, NotificationType

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications Engine"])

@router.get("", response_model=List[NotificationResponse])
async def list_user_notifications(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Fetch all notifications for the authenticated user (auto-expires older than 7 days).
    Also performs a dynamic 24-hour deadline scan for urgent task alerts.
    """
    user_id = user["id"]
    now = datetime.now(timezone.utc)
    in_24h = now + timedelta(hours=24)

    # 1. Scan for any upcoming task deadlines within 24 hours
    try:
        active_tasks = db["issues"].find({
            "assigneeId": user_id,
            "status": {"$nin": ["completed", "approved", "rejected"]},
            "assignmentStatus": {"$in": ["pending", "accepted"]}
        })
        
        async for task in active_tasks:
            # Check deadline or dueDate
            d_val = task.get("deadline") or task.get("dueDate")
            if d_val:
                task_deadline = None
                if isinstance(d_val, datetime):
                    task_deadline = d_val if d_val.tzinfo else d_val.replace(tzinfo=timezone.utc)
                elif isinstance(d_val, str):
                    try:
                        task_deadline = datetime.fromisoformat(d_val.replace("Z", "+00:00"))
                        if not task_deadline.tzinfo:
                            task_deadline = task_deadline.replace(tzinfo=timezone.utc)
                    except Exception:
                        pass
                
                if task_deadline and now <= task_deadline <= in_24h:
                    # Check if an alert was already generated in the last 24 hours
                    existing_alert = await db["notifications"].find_one({
                        "recipient_id": user_id,
                        "type": NotificationType.DEADLINE_ALERT,
                        "entity_id": task["id"],
                        "created_at": {"$gte": now - timedelta(hours=24)}
                    })
                    if not existing_alert:
                        alert_doc = {
                            "notification_id": str(uuid.uuid4()),
                            "recipient_id": user_id,
                            "sender_id": task.get("creatorId"),
                            "title": f"Urgent: Task Deadline in < 24 Hours",
                            "message": f"Task '{task.get('identifier', 'Task')}: {task.get('title')}' is due very soon on {d_val}!",
                            "type": NotificationType.DEADLINE_ALERT,
                            "entity_type": "task",
                            "entity_id": task["id"],
                            "action_url": f"/project/{task.get('projectId')}",
                            "read": False,
                            "response_status": None,
                            "created_at": now
                        }
                        await db["notifications"].insert_one(alert_doc)
    except Exception as e:
        print(f"Error checking 24h deadline notifications: {e}")

    # 2. Return sorted notifications (TTL index in MongoDB ensures items > 7 days are auto-deleted)
    cursor = db["notifications"].find({"recipient_id": user_id}).sort("created_at", -1).limit(50)
    notifications = []
    async for doc in cursor:
        doc.pop("_id", None)
        notifications.append(doc)
    return notifications


@router.get("/unread-count")
async def get_unread_count(user = Depends(get_current_user), db = Depends(get_db)):
    """Return count of unread notifications for badge counter."""
    count = await db["notifications"].count_documents({"recipient_id": user["id"], "read": False})
    return {"unreadCount": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str, user = Depends(get_current_user), db = Depends(get_db)):
    """Mark a notification as read."""
    result = await db["notifications"].update_one(
        {"notification_id": notification_id, "recipient_id": user["id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.post("/{notification_id}/respond")
async def respond_to_notification(
    notification_id: str,
    payload: dict,
    bg_tasks: BackgroundTasks,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Accept or reject a project or task invite.
    Automatically updates the project/task assignment status and sends confirmation back to manager.
    """
    action = payload.get("action", "").lower().strip()
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")

    notif = await db["notifications"].find_one({"notification_id": notification_id, "recipient_id": user["id"]})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    new_status = "accepted" if action == "accept" else "rejected"
    user_id = user["id"]
    user_name = user.get("name", "Team Member")
    now = datetime.now(timezone.utc)

    # 1. Project Invite response
    if notif.get("entity_type") == "project" and notif.get("entity_id"):
        project_id = notif["entity_id"]
        project = await db["projects"].find_one({"id": project_id})
        if project:
            # Update specific user's assignment in project
            await db["projects"].update_one(
                {"id": project_id, "assignments.userId": user_id},
                {"$set": {"assignments.$.status": new_status}}
            )
            
            # Notify project manager
            manager_id = project.get("userId")
            if manager_id and manager_id != user_id:
                manager = await db["users"].find_one({"id": manager_id})
                notif_type = NotificationType.PROJECT_ACCEPTED if action == "accept" else NotificationType.PROJECT_REJECTED
                mgr_notif = {
                    "notification_id": str(uuid.uuid4()),
                    "recipient_id": manager_id,
                    "sender_id": user_id,
                    "title": f"Project Invite {action.capitalize()}ed",
                    "message": f"{user_name} has {action}ed the assignment for project '{project.get('name')}'.",
                    "type": notif_type,
                    "entity_type": "project",
                    "entity_id": project_id,
                    "action_url": f"/project/{project_id}",
                    "read": False,
                    "response_status": new_status,
                    "created_at": now
                }
                await db["notifications"].insert_one(mgr_notif)

                if manager and manager.get("email"):
                    bg_tasks.add_task(
                        send_email_notification,
                        recipient_email=manager["email"],
                        subject=f"Project Invite {action.capitalize()}ed: {project.get('name')}",
                        body=f"{user_name} has {action}ed your assignment to project '{project.get('name')}'."
                    )

    # 2. Task Invite response
    elif notif.get("entity_type") == "task" and notif.get("entity_id"):
        task_id = notif["entity_id"]
        task = await db["issues"].find_one({"id": task_id})
        if task:
            await db["issues"].update_one(
                {"id": task_id},
                {"$set": {"assignmentStatus": new_status, "updatedAt": now}}
            )
            
            # Notify task creator / PM
            creator_id = task.get("creatorId")
            if creator_id and creator_id != user_id:
                creator = await db["users"].find_one({"id": creator_id})
                notif_type = NotificationType.TASK_ACCEPTED if action == "accept" else NotificationType.TASK_REJECTED
                mgr_notif = {
                    "notification_id": str(uuid.uuid4()),
                    "recipient_id": creator_id,
                    "sender_id": user_id,
                    "title": f"Task Invite {action.capitalize()}ed",
                    "message": f"{user_name} has {action}ed task '{task.get('identifier', 'Task')}: {task.get('title')}'.",
                    "type": notif_type,
                    "entity_type": "task",
                    "entity_id": task_id,
                    "action_url": f"/project/{task.get('projectId')}",
                    "read": False,
                    "response_status": new_status,
                    "created_at": now
                }
                await db["notifications"].insert_one(mgr_notif)

                if creator and creator.get("email"):
                    bg_tasks.add_task(
                        send_email_notification,
                        recipient_email=creator["email"],
                        subject=f"Task Invite {action.capitalize()}ed: {task.get('identifier')}",
                        body=f"{user_name} has {action}ed task '{task.get('identifier')}: {task.get('title')}'."
                    )

    # Mark original notification as answered and read
    await db["notifications"].update_one(
        {"notification_id": notification_id},
        {"$set": {"read": True, "response_status": new_status}}
    )

    return {"message": f"Successfully {action}ed", "status": new_status}
