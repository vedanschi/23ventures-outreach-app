CREATE TABLE FollowUpRules (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE,
    original_email_template_id INTEGER NOT NULL REFERENCES EmailTemplates(id) ON DELETE CASCADE,
    follow_up_email_template_id INTEGER NOT NULL REFERENCES EmailTemplates(id) ON DELETE CASCADE,
    delay_days INTEGER NOT NULL,
    condition VARCHAR(100) NOT NULL, -- e.g., 'not_opened_within_delay', 'not_replied_within_delay'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_follow_up_rules_updated_at
BEFORE UPDATE ON FollowUpRules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
