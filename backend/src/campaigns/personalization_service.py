# backend/src/campaigns/personalization_service.py
from typing import List, Dict, Any, Tuple

# Assuming email_generator is in backend/src/llm/email_generator.py
# Adjust import path based on actual project structure and how modules are loaded.
# For this subtask, we assume it can be imported or its function passed.
# from ..llm.email_generator import generate_personalized_email, LLMIntegrationError

# Placeholder for database interaction functions/classes
# async def db_get_contacts_for_campaign(campaign_id: int) -> List[Dict[str, Any]]:
#     print(f"DB: Fetching contacts for campaign {campaign_id}")
#     # Simulate fetching contacts
#     return [
#         {"id": 1, "campaign_id": campaign_id, "first_name": "Alice", "company_name": "Wonderland Inc.", "email": "alice@example.com", "job_title": "CEO"},
#         {"id": 2, "campaign_id": campaign_id, "first_name": "Bob", "company_name": "Builders Co.", "email": "bob@example.com", "job_title": "Lead Architect"}
#     ]

# async def db_store_draft_email(draft_email_data: Dict[str, Any]) -> Dict[str, Any]]:
#     print(f"DB: Storing draft email for contact {draft_email_data.get('contact_id')} to {draft_email_data.get('email_address')}")
#     # Simulate storing draft email and returning it with an ID
#     draft_email_data["id"] = "draft_" + str(draft_email_data.get("contact_id"))
#     draft_email_data["status"] = "draft"
#     return draft_email_data

class PersonalizationError(Exception):
    """Custom exception for personalization service issues."""
    pass

async def generate_draft_emails_for_campaign(
    campaign_id: int,
    user_core_prompt: str,
    llm_api_key: str, # Or handle API key sourcing within generate_personalized_email
    your_company_name: str,
    # Injected DB functions for testability and framework flexibility
    db_get_contacts_for_campaign_func,
    db_store_draft_email_func,
    generate_personalized_email_func # Injected LLM email generation function
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Generates personalized draft emails for all contacts in a given campaign.

    Args:
        campaign_id: The ID of the campaign.
        user_core_prompt: The user's high-level instruction for the email content.
        llm_api_key: API key for the LLM service.
        your_company_name: Name of the company sending the email.
        db_get_contacts_for_campaign_func: Async function to fetch contacts.
        db_store_draft_email_func: Async function to store a draft email.
        generate_personalized_email_func: Async function to generate email from LLM.

    Returns:
        A tuple containing:
        - successfully_drafted_emails: List of dictionaries, each representing a stored draft email.
        - errors: List of error messages for contacts where email generation failed.
    """

    successfully_drafted_emails: List[Dict[str, Any]] = []
    generation_errors: List[str] = []

    try:
        contacts = await db_get_contacts_for_campaign_func(campaign_id)
        if not contacts:
            raise PersonalizationError(f"No contacts found for campaign ID {campaign_id}.")
    except Exception as e:
        # Catch errors from db_get_contacts_for_campaign_func itself
        raise PersonalizationError(f"Failed to retrieve contacts for campaign {campaign_id}: {e}")

    for contact in contacts:
        try:
            # Prepare contact_data for the LLM. Ensure all relevant fields are included.
            # This might involve mapping DB column names to expected keys if they differ.
            contact_data_for_llm = {
                "first_name": contact.get("first_name"),
                "last_name": contact.get("last_name"),
                "email": contact.get("email"),
                "job_title": contact.get("job_title"),
                "company_name": contact.get("company_name"),
                # Add other relevant fields from your Contacts table schema
                "linkedin_url": contact.get("linkedin_url"),
                "company_website": contact.get("company_website"),
                "industry": contact.get("industry"),
                # ... etc.
            }
            # Filter out None values to keep the prompt cleaner
            contact_data_for_llm = {k: v for k, v in contact_data_for_llm.items() if v is not None}

            if not contact_data_for_llm.get("email"):
                generation_errors.append(f"Skipping contact ID {contact.get('id')} due to missing email address.")
                continue

            print(f"Generating email for {contact_data_for_llm['email']} (Contact ID: {contact.get('id')})...")

            subject, body = await generate_personalized_email_func(
                user_core_prompt=user_core_prompt,
                contact_data=contact_data_for_llm,
                api_key=llm_api_key, # Pass the API key
                your_company_name=your_company_name
            )

            # Store this generated email as a draft associated with the contact and campaign
            draft_email_payload = {
                "campaign_id": campaign_id,
                "contact_id": contact.get("id"),
                "email_address": contact_data_for_llm["email"], # Redundant but can be useful
                "subject": subject,
                "body": body,
                "status": "draft" # Initial status
                # Potentially add 'generated_by_llm_prompt': user_core_prompt
            }

            stored_draft = await db_store_draft_email_func(draft_email_payload)
            successfully_drafted_emails.append(stored_draft)

        # except LLMIntegrationError as e: # Specific error from email_generator
        #     generation_errors.append(f"LLM Error for contact {contact.get('email')} (ID {contact.get('id')}): {e}")
        except Exception as e: # Catch any other errors during generation or storage for this contact
            generation_errors.append(f"Failed to generate/store email for contact {contact.get('email')} (ID {contact.get('id')}): {e}")
            # Decide if one failure should stop the whole batch or just be skipped. Here, we skip.

    return successfully_drafted_emails, generation_errors


async def example_personalization_usage():
    """Example of how generate_draft_emails_for_campaign might be called."""

    # --- Mocking dependencies for the example ---
    async def mock_db_get_contacts(campaign_id: int) -> List[Dict[str, Any]]:
        print(f"MOCK DB: Fetching contacts for campaign {campaign_id}")
        return [
            {"id": 1, "campaign_id": campaign_id, "first_name": "Alice", "last_name": "Smith", "company_name": "Wonderland Inc.", "email": "alice@example.com", "job_title": "CEO", "industry": "Tech"},
            {"id": 2, "campaign_id": campaign_id, "first_name": "Bob", "last_name": "Johnson", "company_name": "Builders Co.", "email": "bob@example.com", "job_title": "Lead Architect", "industry": "Construction"},
            {"id": 3, "campaign_id": campaign_id, "first_name": "Carol", "last_name": "Williams", "company_name": "Foodies Ltd.", "email": "carol@example.com", "job_title": "Head Chef", "industry": "Hospitality"}
        ]

    async def mock_db_store_draft(draft_data: Dict[str, Any]) -> Dict[str, Any]:
        print(f"MOCK DB: Storing draft email for contact {draft_data.get('contact_id')} to {draft_data.get('email_address')}")
        draft_data["id"] = f"mock_draft_{draft_data.get('contact_id')}"
        return draft_data

    async def mock_generate_personalized_email(user_core_prompt: str, contact_data: Dict[str, str], api_key: str, your_company_name: str) -> Tuple[str, str]:
        print(f"MOCK LLM: Generating email for {contact_data.get('email')} based on: '{user_core_prompt}' from {your_company_name}")
        # Simulate some personalization based on contact_data
        subject = f"Special Offer for {contact_data.get('first_name')} at {contact_data.get('company_name')}"
        body = (f"Dear {contact_data.get('first_name')},\n\n"
                f"We at {your_company_name} have a special offer related to '{user_core_prompt}' "
                f"that we think would greatly benefit {contact_data.get('company_name')} in the {contact_data.get('industry', 'your industry')} sector.\n\n"
                f"Looking forward to hearing from you.\n\n"
                f"Sincerely,\nThe {your_company_name} Team")
        return subject, body
    # --- End of Mocks ---

    campaign_id_to_process = 101
    main_user_prompt = "our latest AI-driven analytics platform"
    llm_key = "fake_api_key" # In real use, this comes from secure storage/config
    sender_company_name = "AI Solutions Co."

    print(f"--- Running Campaign Personalization Example for Campaign ID: {campaign_id_to_process} ---")

    drafts, errors = await generate_draft_emails_for_campaign(
        campaign_id=campaign_id_to_process,
        user_core_prompt=main_user_prompt,
        llm_api_key=llm_key,
        your_company_name=sender_company_name,
        db_get_contacts_for_campaign_func=mock_db_get_contacts,
        db_store_draft_email_func=mock_db_store_draft,
        generate_personalized_email_func=mock_generate_personalized_email
    )

    print("\n--- Personalization Summary ---")
    print(f"Successfully Drafted Emails: {len(drafts)}")
    for draft in drafts:
        print(f"  - Draft ID: {draft.get('id')}, To: {draft.get('email_address')}, Subject: {draft.get('subject')}")

    if errors:
        print(f"Errors Encountered ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(example_personalization_usage())
