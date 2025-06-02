import os
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
import csv
import io # Changed from 'from io import StringIO'
import base64
import uuid

# Load environment variables
load_dotenv()

# Import at the top
from flask import Flask, request, jsonify
from flask_cors import CORS
from .config import init_mail, supabase  # Import from config

# Create Flask app
app = Flask(__name__)
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'https://23venturesoutreach.netlify.app').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Initialize mail with app
init_mail(app)

# Now import modules that depend on initialized extensions
from backend.utils.followup_job import send_scheduled_followups
from backend.utils.ai_utils import generate_outreach_prompt, generate_followup_prompt, get_generated_email
from backend.utils.email_utils import send_email

@app.route('/api/send-email', methods=['POST'])
def send_email_route():
    data = request.get_json()

    email_type = data.get("type")  # 'outreach' or 'followup'
    recipient_name = data.get("recipient_name")
    recipient_email = data.get("recipient_email")
    company_name = data.get("company_name")

    if not isinstance(recipient_email, str) or not recipient_email.strip():
        return jsonify({"error": "Recipient email must be a non-empty string"}), 400

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

    # Generate email via Together AI
    # Note: The 'email_id' parameter was removed from get_generated_email as part of the changes
    # in backend/utils/ai_utils.py, so it's correctly called here without it.
    email_body_generated = get_generated_email(prompt, recipient_email)

    if not isinstance(email_body_generated, str):
        print(f"Error: get_generated_email did not return a string. Got: {type(email_body_generated)}")
        return jsonify({"error": "Failed to generate email content due to unexpected AI response type."}), 500
    if email_body_generated.startswith("Error"): # Keep existing check for error strings from AI
        return jsonify({"error": email_body_generated}), 500

    startup_id = None # Default to None
    if company_name: # Only query if company_name is available
        try:
            startup_response = supabase.table('startups').select('id').eq('name', company_name).limit(1).execute()
            if startup_response.data and len(startup_response.data) > 0:
                startup_id = startup_response.data[0].get('id')
                print(f"INFO: Found startup_id: {startup_id} for company: {company_name}")
            else:
                print(f"INFO: No startup found with name: {company_name}. Proceeding without startup_id.")
        except Exception as e:
            print(f"WARNING: Error querying startups table for {company_name}: {e}")

    email_record = {
        "recipient_email": recipient_email,
        "subject": subject,
        "body": email_body_generated,
        "startup_id": startup_id, # This was added in the previous step
        "email_type": email_type  # Add this line
    }

    email_id = None # Initialize email_id
    try:
        # Attempt to insert the email record into Supabase
        insertion_response = supabase.table('emails').insert(email_record).execute()

        if hasattr(insertion_response, 'data') and insertion_response.data and len(insertion_response.data) > 0:
            # Ensure data[0] is a dictionary before calling .get()
            if isinstance(insertion_response.data[0], dict):
                email_id = insertion_response.data[0].get('id')
            else:
                email_id = None # data[0] is not a dict, so cannot get id
        else:
            email_id = None # No data or data is empty

        # If no email_id was obtained, the insertion failed or didn't return an ID
        if not email_id:
            error_detail = "Failed to insert email record into database (no ID returned)."
            # Try to get more specific error information from the Supabase response
            if hasattr(insertion_response, 'error') and insertion_response.error:
                error_detail = f"Supabase error on insert: {str(insertion_response.error)}"
            elif hasattr(insertion_response, 'message') and insertion_response.message: # Check for a message if no explicit error object
                error_detail = f"Supabase message on insert: {insertion_response.message}"

            # Log the critical failure and the full Supabase response for debugging
            print(f"CRITICAL: Email for {recipient_email} not saved to DB. Reason: {error_detail}. Full response: {vars(insertion_response)}")
            # Return a 500 error to the client; do not proceed to send the email
            return jsonify({"error": "Failed to save email record to database. Email not sent."}), 500

    except Exception as e:
        # Catch any other exceptions during the database operation
        import traceback
        print(f"CRITICAL: Exception during Supabase email record insertion for {recipient_email}: {e}")
        print(traceback.format_exc())
        # Return a 500 error to the client; do not proceed to send the email
        return jsonify({"error": "Server error while saving email record. Email not sent."}), 500

    # If we've reached this point, email_id is valid and the database insertion was successful.
    # Now, prepare the email body with the tracking pixel.
    email_body_to_send = email_body_generated
    is_html = False

    # It's guaranteed email_id is not None here due to the check above.
    app_base_url = os.getenv('APP_BASE_URL', 'http://localhost:5000')
    tracking_pixel_url = f"{app_base_url}/api/track/{email_id}"
    tracking_pixel_img = f'<img src="{tracking_pixel_url}" width="1" height="1" alt="" />'
    email_body_to_send = email_body_generated + tracking_pixel_img
    is_html = True

    # Attempt to send the email
    email_sent_successfully = send_email(recipient_email, subject, email_body_to_send, html=is_html)

    if not email_sent_successfully:
        # If email sending fails after successful DB save
        # Optionally, one could try to update the DB record here to reflect the send failure.
        print(f"ERROR: Email for {recipient_email} (DB ID: {email_id}) saved to DB, but FAILED to send via provider.")
        return jsonify({"error": "Email record saved, but failed to send email. Check server logs."}), 500

    # Success: Email saved to DB and sent
    return jsonify({"message": f"Email successfully sent to {recipient_email} and saved (ID: {email_id})."})

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
        
        # Check for errors in the response
        if hasattr(result, 'error') and result.error:
            return jsonify({'error': str(result.error)}), 500
            
        return jsonify({'message': 'CSV processed successfully', 'inserted': len(rows)}), 200
            
    except Exception as e:
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
    # Run on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
