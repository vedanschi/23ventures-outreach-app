# /backend/config.py

import os
from dotenv import load_dotenv
from flask_mail import Mail
from supabase import create_client, Client

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)

# Create mail instance without initializing it
mail = Mail()

# Initialize mail with the app
def init_mail(app):
    app.config.from_object(Config)
    mail.init_app(app)

# Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(supabase_url, supabase_service_key)

# Print a masked version of the key for debugging
if supabase_service_key:
    print("Using Supabase Key:", supabase_service_key[:4] + "…")
