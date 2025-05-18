from utils.followup_job import send_scheduled_followups
# Vercel Functions run per-request; you can trigger manually or via cron on Vercel Enterprise.
def handler(request):
    send_scheduled_followups()
    return {"status": "ok"}
