from flask_mail import Message
from ..config import mail  # Import from config

def send_email(recipient: str, subject: str, body: str, html: bool = False):
    """
    Send an email with given subject and body. If html is True, send as HTML.
    """
    msg = Message(
        subject=subject,
        recipients=[recipient],
        body=body,
        html=html
    )
    mail.send(msg)
    return True