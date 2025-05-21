import os
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import csv
from io import StringIO, BytesIO
import base64
import datetime

load_dotenv()

# Assuming your project structure aligns with these imports for Render deployment
# e.g., app.py is in 'backend/', config.py is in 'backend/', utils/ is in 'backend/utils/'
from .config import init_mail, supabase
from backend.utils.followup_job import send_scheduled_followups
from backend.utils.ai_utils import generate_outreach_prompt, generate_followup_prompt, get_generated_email
from backend.utils.email_utils import send_email

app = Flask(__name__)
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'https://23venturesoutreach.netlify.app').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

mail_instance = init_mail(app)

@app.route('/api/send-email', methods=['POST'])
def send_email_route():
    data = request.get_json()

    email_type = data.get("type")
    recipient_name = data.get("recipient_name")
    recipient_email = data.get("recipient_email")
    company_name = data.get("company_name")

    if not all([email_type, recipient_name, recipient_email, company_name]):
        return jsonify({"error": "Missing required fields"}), 400

    current_subject = ""
    prompt = ""

    if email_type == "outreach":
        product_description = data.get("product_description", "our founder-first accelerator with equity-for-growth model.")
        prompt = generate_outreach_prompt(company_name, recipient_name, product_description)
        current_subject = f"Let’s Unlock {company_name}’s Potential | 23 Ventures"
    elif email_type == "followup":
        previous_interaction = data.get("previous_interaction", "Initial outreach email sent last week.")
        prompt = generate_followup_prompt(company_name, recipient_name, previous_interaction)
        current_subject = f"Following Up: 23 Ventures & {company_name}"
    else:
        return jsonify({"error": "Invalid email type"}), 400

    startup_id = None
    try:
        startup_response = supabase.table('startups').select('id').eq('email', recipient_email).maybe_single().execute()
        if startup_response.data:
            startup_id = startup_response.data['id']
        else:
            app.logger.warning(f"No startup found with email {recipient_email}. startup_id will be NULL if allowed.")
            # If startup_id is NOT NULL and required, return error:
            # return jsonify({"error": f"Startup with email {recipient_email} not found."}), 404
    except Exception as e:
        app.logger.error(f"Error fetching startup_id for {recipient_email}: {e}")
        return jsonify({"error": f"Database error fetching startup: {str(e)}"}), 500

    initial_email_payload = {
        'startup_id': startup_id,
        'subject': current_subject,
        'body': "Email content pending generation...",
        'sent_at': datetime.datetime().isoformat(),
        'follow_up': False
    }

    email_id_for_tracking = None
    try:
        insert_response = supabase.table('emails').insert(initial_email_payload).execute()
        if not insert_response.data or (hasattr(insert_response, 'error') and insert_response.error is not None):
            error_detail = str(insert_response.error.message if insert_response.error else "Unknown DB error")
            app.logger.error(f"Supabase insert error (initial): {error_detail}")
            return jsonify({"error": f"Failed to save initial email to database: {error_detail}"}), 500
        email_id_for_tracking = insert_response.data[0]['id']
    except Exception as e:
        app.logger.error(f"Exception during Supabase insert (initial): {e}")
        return jsonify({"error": f"Unexpected error saving email: {str(e)}"}), 500

    email_body_html = get_generated_email(prompt, email_id_for_tracking)

    if "Error:" in email_body_html:
        app.logger.error(f"AI generation failed: {email_body_html}")
        return jsonify({"error": f"AI email generation failed: {email_body_html}"}), 500

    try:
        update_payload = {'body': email_body_html}
        update_response = supabase.table('emails').update(update_payload).eq('id', email_id_for_tracking).execute()
        if hasattr(update_response, 'error') and update_response.error is not None:
            app.logger.error(f"Supabase update error (body): {update_response.error.message}")
            return jsonify({"error": f"Failed to update email body in database: {update_response.error.message}"}), 500
    except Exception as e:
        app.logger.error(f"Exception during Supabase update (body): {e}")
        return jsonify({"error": f"Unexpected error updating email body: {str(e)}"}), 500

    try:
        send_email(recipient_email, current_subject, email_body_html, html=True)
    except Exception as e:
        app.logger.error(f"Error sending email via Flask-Mail: {e}")
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500
    
    return jsonify({"message": f"{email_type.title()} email sent to {recipient_email} and logged with ID {email_id_for_tracking}."})

@app.route('/api/process-csv', methods=['POST'])
def process_csv():
    data = request.get_json()
    path = data.get('path')
    if not path:
        return jsonify({'error': 'Missing path'}), 400

    try:
        response_bytes = supabase.storage.from_('csv').download(path)
        text = response_bytes.decode('utf-8')
        reader = csv.DictReader(StringIO(text))
        rows = []
        for row in reader:
            rows.append({
                'name':       row.get('name'),
                'email':      row.get('email'),
                'website':    row.get('website'),
                'linkedin':   row.get('linkedin'),
                'industry':   row.get('industry'),
                'tech_stack': row.get('tech_stack'),
            })

        if not rows:
            return jsonify({'message': 'No rows to insert from CSV'}), 200
            
        result = supabase.table('startups').insert(rows).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({'error': str(result.error.message if result.error else "Unknown CSV error")}), 500
            
        return jsonify({'message': 'CSV processed successfully', 'inserted_count': len(result.data if result.data else [])}), 200
            
    except Exception as e:
        app.logger.error(f"Error processing CSV: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/track/<email_id>', methods=['GET'])
def track_email(email_id):

    app.logger.info(f"Tracking pixel accessed for email_id: {email_id}. DB update skipped.")
    
    try:
        update_payload = {'viewed': True, 'viewed_at': datetime.datetime.now(datetime.timezone.utc)}
        result = supabase.table('emails').update(update_payload).eq('id', email_id).execute()

        if hasattr(result, 'error') and result.error:
              app.logger.error(f"Error tracking email {email_id} in DB: {result.error.message}")
              
    except Exception as e:
        app.logger.error(f"Exception during DB update for tracking email {email_id}: {e}")
    
    pixel_gif = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    response = make_response(send_file(BytesIO(pixel_gif), mimetype='image/gif'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.logger.setLevel(os.getenv('LOG_LEVEL', 'INFO').upper())
    port = int(os.getenv('PORT', 5000)) 
    app.run(debug=True, host='0.0.0.0', port=port)
