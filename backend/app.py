import os
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import csv
from io import StringIO, BytesIO
import base64
import datetime
import uuid # Import for generating unique email IDs

# Load environment variables
load_dotenv()

from .config import init_mail, supabase # Correct way to import mail and supabase from config
from backend.utils.followup_job import send_scheduled_followups
from backend.utils.ai_utils import generate_outreach_prompt, generate_followup_prompt, get_generated_email
from backend.utils.email_utils import send_email

# Create Flask app
app = Flask(__name__)
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'https://23venturesoutreach.netlify.app').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Initialize mail with app (assigning to mail_instance is good practice)
mail_instance = init_mail(app)

@app.route('/api/send-email', methods=['POST'])
def send_email_route():
    data = request.get_json()

    email_type = data.get("type")  # 'outreach' or 'followup'
    recipient_name = data.get("recipient_name")
    recipient_email = data.get("recipient_email")
    company_name = data.get("company_name")
    
    # Add input validation for required fields
    if not all([email_type, recipient_name, recipient_email, company_name]):
        return jsonify({"error": "Missing required fields"}), 400

    current_subject = ""
    prompt = ""
    # Generate a unique ID for the email for tracking purposes
    email_id = str(uuid.uuid4())

    if email_type == "outreach":
        product_description = data.get("product_description", "our founder-first accelerator with equity-for-growth model.")
        prompt = generate_outreach_prompt(company_name, recipient_name, product_description)
        current_subject = f"Let’s Unlock {company_name}’s Potential | 23 Ventures" # Renamed to current_subject for clarity

    elif email_type == "followup":
        previous_interaction = data.get("previous_interaction", "Initial outreach email sent last week.")
        prompt = generate_followup_prompt(company_name, recipient_name, previous_interaction)
        current_subject = f"Following Up: 23 Ventures & {company_name}" # Renamed to current_subject

    else:
        return jsonify({"error": "Invalid email type"}), 400

    # Generate email via Together AI, passing the generated email_id for tracking
    email_body_html = get_generated_email(prompt, email_id) # Pass email_id here

    if email_body_html.startswith("Error"): # Check for error string from AI utility
        return jsonify({"error": email_body_html}), 500

    # Send email, explicitly setting html=True as get_generated_email produces HTML
    try:
        send_email(recipient_email, current_subject, email_body_html, html=True)
    except Exception as e:
        app.logger.error(f"Error sending email via Flask-Mail: {e}")
        return jsonify({"error": f"Failed to send email: {e}"}), 500

    # --- START: Database saving logic for emails ---
    try:
        # Prepare data for insertion
        email_data = {
            'id': email_id, # Use the generated UUID as the ID
            'recipient_email': recipient_email,
            'subject': current_subject,
            'body': email_body_html,
            'type': email_type,
            'status': 'sent', # Mark as sent
            'sent_at': datetime.datetime.now(datetime.timezone.utc), # Use UTC timezone
            'viewed': False, # Default to not viewed
            'follow_up': False # Default for follow-up status
            # Add other fields as needed based on your 'emails' table schema
        }
        
        # Insert into 'emails' table
        result = supabase.table('emails').insert(email_data).execute()
        
        if hasattr(result, 'error') and result.error:
            app.logger.error(f"Error saving email to DB: {result.error.message}")
            # Even if DB save fails, we should still return success for email send
            return jsonify({"message": f"{email_type.title()} email sent to {recipient_email}, but failed to save to database: {result.error.message}"}), 200
            
    except Exception as e:
        app.logger.error(f"Exception during email DB save: {e}")
        # Even if DB save fails, we should still return success for email send
        return jsonify({"message": f"{email_type.title()} email sent to {recipient_email}, but an error occurred saving to database: {e}"}), 200
    # --- END: Database saving logic for emails ---

    return jsonify({"message": f"{email_type.title()} email sent to {recipient_email} and saved to database."})

@app.route('/api/process-csv', methods=['POST'])
def process_csv():
    data = request.get_json()
    path = data.get('path')
    if not path:
        return jsonify({'error': 'Missing path'}), 400

    try:
        # 1) Download from Storage
        response = supabase.storage.from_('csv').download(path)
        
        # Read file bytes into text
        text = response.decode('utf-8')
        reader = csv.DictReader(StringIO(text))

        # 2) Build payload
        rows = []
        for row in reader:
            rows.append({
                'name':       row['name'],
                'email':      row['email'],
                'website':    row.get('website'),
                'linkedin':   row.get('linkedin'),
                'industry':   row.get('industry'),
                'tech_stack': row.get('tech_stack'),
                # created_at defaults to now()
            })

        # 3) Insert into startups table
        if not rows:
            return jsonify({'message': 'No rows to insert'}), 200
            
        result = supabase.table('startups').insert(rows).execute()
        
        # Improved error checking for Supabase insert
        if hasattr(result, 'error') and result.error:
            app.logger.error(f"Error inserting CSV rows into DB: {result.error.message}")
            return jsonify({'error': f"Failed to insert CSV rows: {result.error.message}"}), 500
            
        return jsonify({'message': 'CSV processed successfully', 'inserted_count': len(result.data if result.data else [])}), 200
            
    except Exception as e:
        app.logger.error(f"Error processing CSV: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/track/<email_id>', methods=['GET'])
def track_email(email_id):
    try:
        # Update the email as viewed in the database
        # Use datetime.datetime.now() for better precision and timezone awareness
        update_payload = {'viewed': True, 'viewed_at': datetime.datetime.now(datetime.timezone.utc)}
        result = supabase.table('emails').update(update_payload).eq('id', email_id).execute()

        if hasattr(result, 'error') and result.error:
            app.logger.error(f"Error tracking email {email_id} in DB: {result.error.message}")
            
    except Exception as e:
        app.logger.error(f"Exception during DB update for tracking email {email_id}: {e}")
    
    # Return a 1x1 transparent pixel
    pixel_gif = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    response = make_response(send_file(BytesIO(pixel_gif), mimetype='image/gif'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache' # Added for stricter caching control
    return response

if __name__ == '__main__':
    # Add a basic logger handler for console output during local development
    import logging
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=5000)