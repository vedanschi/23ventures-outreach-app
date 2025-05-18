# /backend/utils/followup_job.py
from datetime import datetime, timedelta
from config import supabase  # Import from config instead of creating a new client
from utils.email_utils import send_email
from utils.ai_utils import generate_followup_prompt, get_generated_email

def send_scheduled_followups():
    """
    Query 'emails' table for rows with follow_up=False and
    sent_at older than N days, then generate & send follow-up emails.
    """
    # 2) Determine which rows need follow-up (e.g. sent_at <= now - 3 days)
    cutoff = datetime.utcnow() - timedelta(days=3)
    resp = supabase.from_("emails") \
        .select("id, startup_id, sent_at") \
        .eq("follow_up", False) \
        .lte("sent_at", cutoff.isoformat()) \
        .execute()

    if resp.error:
        print("Error fetching emails for follow-up:", resp.error)
        return

    for email_row in resp.data:
        # Fetch startup details
        s = supabase.from_("startups") \
            .select("name, email") \
            .eq("id", email_row["startup_id"]) \
            .single() \
            .execute()
        if s.error:
            print("Error fetching startup:", s.error)
            continue

        startup = s.data
        # 3) Generate follow-up content
        prompt = generate_followup_prompt(
            company_name=startup["name"],
            recipient_name=startup["name"],
            previous_interaction=f"Initial email sent at {email_row['sent_at']}"
        )
        body = get_generated_email(prompt)

        # 4) Send email
        subject = f"Following Up: 23 Ventures & {startup['name']}"
        send_email(startup["email"], subject, body)

        # 5) Mark follow_up=True and update sent_at
        supabase.from_("emails").update({
            "follow_up": True,
            "sent_at": datetime.utcnow().isoformat()
        }).eq("id", email_row["id"]).execute()
