import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
import csv
from io import StringIO

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
    email_body = get_generated_email(prompt, recipient_email)

    if email_body.startswith("Error"):
        return jsonify({"error": email_body}), 500

    send_email(recipient_email, subject, email_body)
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
        supabase.table('emails').update({'viewed': True, 'viewed_at': 'now()'}).eq('id', email_id).execute()

        # Return a 1x1 transparent pixel
        response = make_response(send_file(io.BytesIO(base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')), 
                                          mimetype='image/gif'))
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    except Exception as e:
        print(f"Error tracking email: {e}")
        # Still return a pixel to avoid errors in the email client
        return send_file(io.BytesIO(base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')), 
                         mimetype='image/gif')

if __name__ == '__main__':
    # Run on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
