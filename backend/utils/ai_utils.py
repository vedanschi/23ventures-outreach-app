import os
import requests
import html # For escaping plain text before converting to HTML

# Load the Together AI API key from environment variables
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

# Define the API endpoint and model
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
# Allow MODEL_NAME to be overridden by an environment variable for flexibility
MODEL_NAME = os.getenv("TOGETHER_MODEL_NAME", "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo")

# Assuming BACKEND_URL is where your Flask app is accessible from the internet for the tracking pixel
# This should be your Render service's external URL, e.g., https://your-service-name.onrender.com
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

def generate_outreach_prompt(company_name, recipient_name, product_description):
    """
    Constructs a prompt for generating an initial outreach email.
    Explicitly asks the AI to return HTML content.
    """
    prompt = (
        f"You are an AI assistant tasked with drafting an initial outreach email to {recipient_name} at {company_name}. "
        f"Introduce 23 Ventures and its offerings: {product_description}.\n\n"
        "Compose a concise, engaging, and personalized email that:\n"
        "- Introduces 23 Ventures.\n"
        "- Highlights the value proposition.\n"
        "- Encourages a response or meeting.\n\n"
        "The email should be in **HTML format**. Ensure any special characters are HTML-encoded if necessary, but provide a complete HTML email body.\n"
        "End the email with a signature: 'Manthan Gupta, Founder, 23Ventures'\n"
        "Ensure the tone is professional and friendly."
    )
    return prompt

def generate_followup_prompt(company_name, recipient_name, previous_interaction):
    """
    Constructs a prompt for generating a follow-up email.
    Explicitly asks the AI to return HTML content.
    """
    prompt = (
        f"You are an AI assistant tasked with drafting a follow-up email to {recipient_name} at {company_name}. "
        f"The previous interaction was: \"{previous_interaction}\"\n\n"
        "Compose a concise, engaging, and personalized follow-up email that:\n"
        "- References the previous interaction.\n"
        "- Highlights the value proposition of 23 Ventures.\n"
        "- Encourages a response or meeting.\n\n"
        "The email should be in **HTML format**. Ensure any special characters are HTML-encoded if necessary, but provide a complete HTML email body.\n"
        "End the email with a signature: 'Manthan Gupta, Founder, 23Ventures'\n"
        "Ensure the tone is professional and friendly."
    )
    return prompt

def get_generated_email(prompt: str, email_id: str | None = None):
    """
    Sends the constructed prompt to Together AI's API and retrieves the generated email content.
    Adds a tracking pixel to the email, ensuring content is HTML.
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
        response = requests.post(TOGETHER_API_URL, headers=headers, json=data, timeout=30) # Added timeout
        response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
        result = response.json()
        ai_content = result['choices'][0]['message']['content'].strip()
        
        # Tracking pixel HTML (more robust style)
        tracking_pixel_html = f'<img src="{BACKEND_URL}/api/track/{email_id}" width="1" height="1" style="display:block; border:0px; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic;" aria-hidden="true">'
        
        # Check if AI content is already HTML (simple check)
        is_ai_html = "<html>" in ai_content.lower() or "<p>" in ai_content.lower() or "<br" in ai_content.lower()

        final_email_body = ""
        if is_ai_html:
            # If AI provides HTML, try to inject pixel before </body>, else append
            if "</body>" in ai_content.lower():
                # Case-insensitive replace for </body>
                body_end_index = ai_content.lower().rfind("</body>")
                final_email_body = ai_content[:body_end_index] + tracking_pixel_html + ai_content[body_end_index:]
            else:
                final_email_body = ai_content + tracking_pixel_html
        else:
            # If AI provides plain text, convert to basic HTML and add pixel
            escaped_content = html.escape(ai_content) # Escape special HTML characters
            # Replace newlines with <br> tags for HTML formatting
            html_formatted_content = f"<p>{escaped_content.replace(chr(10), '<br>')}</p>"
            # Wrap in a full HTML document for robustness
            final_email_body = f"<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>{html_formatted_content}{tracking_pixel_html}</body></html>"
            
        return final_email_body

    except requests.exceptions.Timeout:
        return "Error: Timeout connecting to AI API."
    except requests.exceptions.RequestException as e:
        # Catch any request-related errors (e.g., connection errors, HTTP errors)
        return f"Error generating email content: {e}"
    except Exception as e:
        # Catch any other unexpected errors
        return f"An unexpected error occurred in AI email generation: {e}"