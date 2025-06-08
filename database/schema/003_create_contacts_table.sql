CREATE TABLE Contacts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE,
    linkedin_url VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    industry VARCHAR(255),
    keywords TEXT,
    employees INTEGER,
    company_city VARCHAR(100),
    company_state VARCHAR(100),
    company_country VARCHAR(100),
    company_linkedin_url VARCHAR(255),
    company_twitter_url VARCHAR(255),
    company_facebook_url VARCHAR(255),
    company_phone_numbers VARCHAR(255),
    twitter_url VARCHAR(255),
    facebook_url VARCHAR(255),
    custom_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (campaign_id, email) -- Email should be unique within a campaign
);

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON Contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
