-- File: database/schema/005_create_sent_emails_table.sql

-- Drop the table if it exists to apply changes (useful during development)
DROP TABLE IF EXISTS SentEmails CASCADE;

-- Recreate the SentEmails table with new tracking and follow-up fields
CREATE TABLE SentEmails (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    email_template_id INTEGER,

    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    status_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    first_opened_ip VARCHAR(100),
    last_opened_at TIMESTAMP WITH TIME ZONE,
    open_count INTEGER DEFAULT 0,

    clicked_at TIMESTAMP WITH TIME ZONE,
    first_clicked_ip VARCHAR(100),
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    click_count INTEGER DEFAULT 0,

    bounce_type VARCHAR(50),

    tracking_pixel_id VARCHAR(100) UNIQUE,
    esp_message_id VARCHAR(255) UNIQUE,

    -- New fields for follow-up tracking
    is_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
    follows_up_on_email_id INTEGER NULL REFERENCES SentEmails(id) ON DELETE SET NULL, -- Self-referential link

    -- Foreign Key Constraints (re-adding them explicitly for clarity in this consolidated version)
    CONSTRAINT fk_campaign FOREIGN KEY (campaign_id) REFERENCES Campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_email_template FOREIGN KEY (email_template_id) REFERENCES EmailTemplates(id) ON DELETE SET NULL
    -- The self-referential FK for follows_up_on_email_id is already defined inline
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentemails_status ON SentEmails(status);
CREATE INDEX IF NOT EXISTS idx_sentemails_campaign_id ON SentEmails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sentemails_contact_id ON SentEmails(contact_id);
CREATE INDEX IF NOT EXISTS idx_sentemails_tracking_pixel_id ON SentEmails(tracking_pixel_id);
CREATE INDEX IF NOT EXISTS idx_sentemails_esp_message_id ON SentEmails(esp_message_id);
CREATE INDEX IF NOT EXISTS idx_sentemails_created_at ON SentEmails(created_at);
CREATE INDEX IF NOT EXISTS idx_sentemails_sent_at ON SentEmails(sent_at);
-- New index for follow-up linking
CREATE INDEX IF NOT EXISTS idx_sentemails_follows_up_on_email_id ON SentEmails(follows_up_on_email_id);
CREATE INDEX IF NOT EXISTS idx_sentemails_is_follow_up ON SentEmails(is_follow_up);


-- Ensure the common function for updating 'updated_at' timestamp is available.
-- CREATE OR REPLACE FUNCTION update_updated_at_column() ... (as defined before)

-- Trigger to update 'updated_at' timestamp on modification
CREATE TRIGGER trigger_update_sent_emails_updated_at
BEFORE UPDATE ON SentEmails
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN SentEmails.status IS 'e.g., draft, pending_send, sending, sent, delivered, opened, clicked, hard_bounced, soft_bounced, spam_complaint, failed';
COMMENT ON COLUMN SentEmails.esp_message_id IS 'Message ID from the Email Service Provider, useful for webhooks and delivery tracking';
COMMENT ON COLUMN SentEmails.tracking_pixel_id IS 'Unique ID for the open tracking pixel embedded in the email';
COMMENT ON COLUMN SentEmails.is_follow_up IS 'True if this email is a follow-up to a previous email.';
COMMENT ON COLUMN SentEmails.follows_up_on_email_id IS 'If this is a follow-up, this ID points to the original email in this table.';
