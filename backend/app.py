import os
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import csv
import io # Changed from 'from io import StringIO'
import base64

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

    if not isinstance(recipient_email, str) or not recipient_email.strip():
        return jsonify({"error": "Recipient email must be a non-empty string"}), 400

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

    # Generate email via Together AI
    # Note: The 'email_id' parameter was removed from get_generated_email as part of the changes
    # in backend/utils/ai_utils.py, so it's correctly called here without it.
    email_body_generated = get_generated_email(prompt, recipient_email) 

    if not isinstance(email_body_generated, str):
        print(f"Error: get_generated_email did not return a string. Got: {type(email_body_generated)}")
        return jsonify({"error": "Failed to generate email content due to unexpected AI response type."}), 500
    if email_body_generated.startswith("Error"): # Keep existing check for error strings from AI
        return jsonify({"error": email_body_generated}), 500

    email_record = {
        "recipient_email": recipient_email,
        "subject": subject,
        "body": email_body_generated,  # Store the original generated body
        "type": email_type,
        "status": "sent"
        # "viewed" and "viewed_at" will be updated by the tracking pixel
    }

    email_body_to_send = email_body_generated # Default to original if anything goes wrong
    is_html = False # Initialize is_html flag

    try:
        insertion_response = supabase.table('emails').insert(email_record).execute()
        
        if hasattr(insertion_response, 'data') and insertion_response.data and len(insertion_response.data) > 0:
            email_id = insertion_response.data[0].get('id')
            if email_id:
                app_base_url = os.getenv('APP_BASE_URL', 'http://localhost:5000') # Default if not set
                tracking_pixel_url = f"{app_base_url}/api/track/{email_id}"
                tracking_pixel_img = f'<img src="{tracking_pixel_url}" width="1" height="1" alt="" />'
                email_body_to_send = email_body_generated + tracking_pixel_img
                is_html = True # Set flag here
            else:
                print(f"Email ID not found in Supabase response for {recipient_email}. Proceeding without tracking pixel.")
        else:
            error_detail = "Unknown error during Supabase insertion."
            if hasattr(insertion_response, 'error') and insertion_response.error:
                error_detail = str(insertion_response.error)
            elif hasattr(insertion_response, 'message') and insertion_response.message:
                error_detail = insertion_response.message
            print(f"Error inserting email record into Supabase for {recipient_email}: {error_detail}. Proceeding without tracking pixel.")

    except Exception as e:
        print(f"Exception inserting email record into Supabase for {recipient_email}: {e}. Proceeding without tracking pixel.")

    email_sent_successfully = send_email(recipient_email, subject, email_body_to_send, html=is_html)
    
    if not email_sent_successfully:
        # Optionally update the status in the database if email sending failed
        # For now, just return an error to the client
        return jsonify({"error": "Failed to send email. Check server logs for details."}), 500
        
    return jsonify({"message": f"{email_type.title()} email sent to {recipient_email}."})

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
        reader = csv.DictReader(io.StringIO(text)) # Changed to io.StringIO

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
        # Use a specific timestamp for viewed_at for consistency, e.g., supabase.rpc('now') or similar
        update_response = supabase.table('emails').update({'viewed': True, 'viewed_at': 'now()'}).eq('id', email_id).execute()

        # Log if update failed for some reason (optional, but good for debugging)
        if hasattr(update_response, 'error') and update_response.error:
            print(f"Error updating email view status for {email_id}: {update_response.error}")
        elif not (hasattr(update_response, 'data') and update_response.data and len(update_response.data) > 0):
            print(f"No data returned or update seemed unsuccessful for {email_id}, but no explicit error.")


    except Exception as e:
        print(f"Exception while tracking email {email_id}: {e}")
    
    # Always return a 1x1 transparent pixel, regardless of DB update success
    # This prevents broken images in emails if tracking fails
    pixel_gif = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    response = make_response(send_file(io.BytesIO(pixel_gif), mimetype='image/gif'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    # Add a basic logger handler for console output during local development
    import logging
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=5000)