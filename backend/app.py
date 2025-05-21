import os
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import csv
from io import StringIO, BytesIO
import base64
import datetime # For sent_at, though 'now()' is often handled by Supabase

# Load environment variables
load_dotenv()

# Assuming config.py is in the same directory
from config import init_mail, supabase

# Assuming other utility files are in the same directory as per GitHub structure
from followup_job import send_scheduled_followups # Keep if used, or remove if not directly called by app.py routes
from ai_utils import generate_outreach_prompt, generate_followup_prompt, get_generated_email
from email_utils import send_email

# Create Flask app
app = Flask(__name__)
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'https://23venturesoutreach.netlify.app').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Initialize mail with app
# Ensure init_mail is called and mail instance is correctly configured for email_utils
mail_instance = init_mail(app)


@app.route('/api/send-email', methods=['POST'])
def send_email_route():
    data = request.get_json()

    email_type = data.get("type")  # 'outreach' or 'followup'
    recipient_name = data.get("recipient_name")
    recipient_email = data.get("recipient_email")
    company_name = data.get("company_name")
    # Optionally, frontend could send startup_id if known
    # startup_id_from_request = data.get("startup_id") 

    if not all([email_type, recipient_name, recipient_email, company_name]):
        return jsonify({"error": "Missing required fields: type, recipient_name, recipient_email, company_name"}), 400

    subject = ""
    prompt = ""

    if email_type == "outreach":
        product_description = data.get("product_description", "our founder-first accelerator with equity-for-growth model.")
        prompt = generate_outreach_prompt(company_name, recipient_name, product_description)
        subject = f"Let’s Unlock {company_name}’s Potential | 23 Ventures"
    elif email_type == "followup":
        previous_interaction = data.get("previous_interaction", "Initial outreach email sent last week.")
        prompt = generate_followup_prompt(company_name, recipient_name, previous_interaction)
        subject = f"Following Up: 23 Ventures & {company_name}"
    else:
        return jsonify({"error": "Invalid email type"}), 400

    # --- Logic to store email in Supabase ---
    startup_id = None
    try:
        # Attempt to find startup_id by recipient's email
        # This assumes 'startups' table has an 'email' column for the primary contact
        startup_response = supabase.table('startups').select('id').eq('email', recipient_email).maybe_single().execute()
        if startup_response.data:
            startup_id = startup_response.data['id']
        else:
            app.logger.warning(f"Startup with email {recipient_email} not found. Email will be logged without startup_id.")
    except Exception as e:
        app.logger.error(f"Error fetching startup_id for {recipient_email}: {e}")
        # Decide if this is critical. For now, proceed without startup_id.

    email_record_payload = {
        'recipient_name': recipient_name,
        'recipient_email': recipient_email,
        'company_name': company_name,
        'subject': subject,
        'email_type': email_type,
        'startup_id': startup_id, # Can be None if not found/applicable
        'sent_at': datetime.datetime.utcnow().isoformat(), # Or use Supabase 'now()' in SQL function/default value
        'viewed': False,
        'follow_up': False, # Assuming this is for initial send; follow-ups might set this differently
        # 'body' will be added after generation
    }

    try:
        insert_response = supabase.table('emails').insert(email_record_payload).execute()
        if not insert_response.data or (hasattr(insert_response, 'error') and insert_response.error is not None):
            error_detail = str(insert_response.error.message) if hasattr(insert_response, 'error') and insert_response.error else "Unknown error"
            app.logger.error(f"Supabase insert error: {error_detail} - Data: {insert_response.data}")
            return jsonify({"error": f"Failed to save email to database: {error_detail}"}), 500
        
        email_id = insert_response.data[0]['id']
        app.logger.info(f"Email record created with ID: {email_id}")

    except Exception as e:
        app.logger.error(f"Exception during Supabase insert: {e}")
        return jsonify({"error": f"An unexpected error occurred while saving email: {str(e)}"}), 500

    # Generate email via Together AI, passing the new email_id for tracking
    # ai_utils.get_generated_email should now handle HTML formatting and pixel insertion
    email_body_html = get_generated_email(prompt, email_id) # Expecting HTML content

    if email_body_html.startswith("Error"): # Check if get_generated_email indicated an error
        # Optionally, you could delete the placeholder email_record or mark it as 'failed_to_generate'
        return jsonify({"error": email_body_html}), 500

    # Update the email record with the generated body
    try:
        update_response = supabase.table('emails').update({'body': email_body_html}).eq('id', email_id).execute()
        if hasattr(update_response, 'error') and update_response.error is not None:
            app.logger.error(f"Supabase update error (body): {update_response.error.message}")
            # Decide if this is a critical failure. Email might be sent without body in DB.
    except Exception as e:
        app.logger.error(f"Exception during Supabase update (body): {e}")


    # Send the email (email_utils.send_email should handle HTML content)
    try:
        send_email(recipient_email, subject, email_body_html, html=True) # html=True is important
        app.logger.info(f"Email sent to {recipient_email} with ID {email_id}")
    except Exception as e:
        app.logger.error(f"Error sending email via Flask-Mail: {e}")
        # Potentially update the email record in DB to mark as 'send_failed'
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500
    
    return jsonify({"message": f"{email_type.title()} email sent to {recipient_email} and logged with ID {email_id}."})


@app.route('/api/process-csv', methods=['POST'])
def process_csv():
    data = request.get_json()
    path = data.get('path')
    if not path:
        return jsonify({'error': 'Missing path'}), 400

    try:
        # 1) Download from Storage
        response_bytes = supabase.storage.from_('csv').download(path) # Corrected: download returns bytes
        
        # Read file bytes into text
        text = response_bytes.decode('utf-8') # Assuming UTF-8 encoding
        reader = csv.DictReader(StringIO(text))

        # 2) Build payload
        rows = []
        for row in reader:
            # Basic validation/cleaning can be added here
            rows.append({
                'name':       row.get('name'), # Use .get for safety
                'email':      row.get('email'),
                'website':    row.get('website'),
                'linkedin':   row.get('linkedin'),
                'industry':   row.get('industry'),
                'tech_stack': row.get('tech_stack'),
                # created_at defaults to now() if set in Supabase table definition
            })

        # 3) Insert into startups table
        if not rows:
            return jsonify({'message': 'No rows to insert from CSV'}), 200 # Changed message slightly
            
        result = supabase.table('startups').insert(rows).execute()
        
        if hasattr(result, 'error') and result.error:
            return jsonify({'error': str(result.error.message)}), 500 # Access error message
            
        return jsonify({'message': 'CSV processed successfully', 'inserted_count': len(result.data if result.data else [])}), 200 # More precise count
            
    except Exception as e:
        app.logger.error(f"Error processing CSV: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/track/<email_id>', methods=['GET'])
def track_email(email_id):
    try:
        # Update the email as viewed in the database
        # Ensure 'viewed_at' uses a proper timestamp function if not handled by DB default/trigger
        update_payload = {'viewed': True, 'viewed_at': datetime.datetime.utcnow().isoformat()}
        result = supabase.table('emails').update(update_payload).eq('id', email_id).execute()

        if hasattr(result, 'error') and result.error:
            app.logger.error(f"Error tracking email {email_id}: {result.error.message}")
            # Still return pixel to not break client

    except Exception as e:
        app.logger.error(f"Exception tracking email {email_id}: {e}")
        # Still return a pixel to avoid errors in the email client
    
    # Return a 1x1 transparent pixel
    # Corrected: send_file needs a file-like object for BytesIO
    pixel_gif = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    response = make_response(send_file(BytesIO(pixel_gif), mimetype='image/gif'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    # For development, ensure Flask's logger is configured to see output
    app.logger.setLevel(os.getenv('LOG_LEVEL', 'INFO').upper())
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
