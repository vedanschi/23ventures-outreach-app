from flask_mail import Message
from ..config import mail  # Assuming mail is initialized in config.py and imported

def send_email(recipient: str, subject: str, body_content: str, html: bool = False):
    """
    Sends an email.
    If html is True, body_content is treated as HTML.
    Otherwise, body_content is treated as plain text.
    """
    if not mail.default_sender:
        raise ValueError("Flask-Mail default_sender (MAIL_DEFAULT_SENDER) is not configured.")

    msg = Message(
        subject=subject,
        recipients=[recipient],
        # sender=mail.default_sender # Optional: specify sender if different from default
    )

    if html:
        msg.html = body_content
        # For best practice, you might want to generate a plain text version from HTML
        # and set msg.body as well, but for now, this will send an HTML-only email.
        # Example: from html2text import html2text
        # msg.body = html2text(body_content) 
    else:
        msg.body = body_content
    
    try:
        mail.send(msg)
        return True
    except Exception as e:
        # Log the exception e
        print(f"Error sending email via Flask-Mail: {e}") # Replace with proper logging
        raise # Re-raise the exception to be caught by the caller in app.py
