CREATE TABLE EmailTemplates (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE,
    user_prompt TEXT,
    subject_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON EmailTemplates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
