import smtplib
from email.message import EmailMessage
import os

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email_notification(recipient_email: str, subject: str, body: str):
    """
    Sends an email synchronously. Designed to be called via FastAPI's BackgroundTasks
    so it does not block the main event loop.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"Skipping email to {recipient_email}: SMTP credentials not configured.")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Notification successfully sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email to {recipient_email}. Error: {str(e)}")
        # Note: In the final steps, we will wire this failure into the AuditLogEntry schema