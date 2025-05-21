from flask_mail import Message
from ..config import mail
import traceback # Add for logging

def send_email(recipient: str, subject: str, body: str, html: bool = False):
    msg = Message(
        subject=subject,
        recipients=[recipient],
        body=None if html else body, # If HTML, body arg is for plain text part
        html=body if html else None  # If HTML, html arg is for HTML part
    )
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email via Flask-Mail to {recipient}: {e}")
        print(traceback.format_exc()) # Log the full traceback
        return False