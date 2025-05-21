import os
import io
import base64
from flask import make_response, send_file, request
from ..config import supabase

# backend/api/track.py
# This handler updates email as viewed and returns a 1x1 pixel GIF

def handler(event, context):
    # Netlify style: event.pathParameters.id or path part
    # For Render CLI, use query param or route param
    email_id = request.view_args.get('email_id') if hasattr(request, 'view_args') else request.args.get('email_id')
    try:
        update = supabase.table('emails') \
            .update({'viewed': True, 'viewed_at': 'now()'}) \
            .eq('id', email_id) \
            .execute()
        if hasattr(update, 'error') and update.error:
            print(f"Error updating viewed flag for {{email_id}}: {{update.error}}")
    except Exception as err:
        print(f"Exception in track handler for {{email_id}}: {{err}}")

    # Always return a transparent pixel
    pixel = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    response = make_response(send_file(io.BytesIO(pixel), mimetype='image/gif'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response