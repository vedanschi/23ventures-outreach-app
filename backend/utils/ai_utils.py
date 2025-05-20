import os
import requests

# Load the Together AI API key from environment variables
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

# Define the API endpoint and model
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"

def generate_outreach_prompt(company_name, recipient_name, product_description):
    """
    Constructs a prompt for generating an initial outreach email.
    """
    prompt = (
        f"You are an AI assistant tasked with drafting an initial outreach email to {recipient_name} at {company_name}. "
        f"Introduce 23 Ventures and its offerings: {product_description}.\n\n"
        "Compose a concise, engaging, and personalized email that:\n"
        "- Introduces 23 Ventures.\n"
        "- Highlights the value proposition.\n"
        "- Encourages a response or meeting.\n\n"
        "End the email with a signature: 'Manthan Gupta, Founder, 23Ventures'\n"
        "Ensure the tone is professional and friendly."
    )
    return prompt

def generate_followup_prompt(company_name, recipient_name, previous_interaction):
    """
    Constructs a prompt for generating a follow-up email.
    """
    prompt = (
        f"You are an AI assistant tasked with drafting a follow-up email to {recipient_name} at {company_name}. "
        f"The previous interaction was: \"{previous_interaction}\"\n\n"
        "Compose a concise, engaging, and personalized follow-up email that:\n"
        "- References the previous interaction.\n"
        "- Highlights the value proposition of 23 Ventures.\n"
        "- Encourages a response or meeting.\n\n"
        "End the email with a signature: 'Manthan Gupta, Founder, 23Ventures'\n"
        "Ensure the tone is professional and friendly."
    )
    return prompt

def get_generated_email(prompt, email_id):
    """
    Sends the constructed prompt to Together AI's API and retrieves the generated email content.
    Adds a tracking pixel to the email.
    """
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
        "temperature": 0.7
    }
    try:
        response = requests.post(TOGETHER_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        email_content = result['choices'][0]['message']['content'].strip()
        
        # Add tracking pixel at the end of the email
        tracking_url = f"{os.getenv('BACKEND_URL', 'http://localhost:5000')}/api/track/{email_id}"
        tracking_pixel = f'<img src="{tracking_url}" width="1" height="1" alt="" style="display:none">'
        
        # For HTML emails
        if '<html>' in email_content:
            # Insert before closing body tag
            email_content = email_content.replace('</body>', f'{tracking_pixel}</body>')
        else:
            # For plain text emails, append at the end
            email_content += f'\n\n{tracking_pixel}'
            
        return email_content
    except requests.exceptions.RequestException as e:
        # Log the error or handle it as needed
        return f"Error generating email content: {e}"
