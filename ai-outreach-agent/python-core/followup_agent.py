import sys
import json
import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials

from googleapiclient.discovery import build
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.tools.gmail.get_thread import GmailGetThread
from langchain_community.tools.gmail.create_draft import GmailCreateDraft

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'express-backend', '.env'))

class FollowupSchema(BaseModel):
    should_followup: bool = Field(description="True if we should send a follow-up email, False if they already replied or if no follow-up is needed.")
    reason: str = Field(description="Brief reason for this decision.")
    subject: str = Field(description="Subject line for the follow-up email if should_followup is True.")
    body: str = Field(description="The body content for the follow-up email if should_followup is True.")

def get_gmail_resource(auth_info):
    creds = Credentials(
        token=auth_info.get("access_token"),
        refresh_token=auth_info.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=auth_info.get("client_id"),
        client_secret=auth_info.get("client_secret"),
        scopes=auth_info.get("scopes", ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.readonly"])
    )
    return build('gmail', 'v1', credentials=creds)

def evaluate_and_draft_followup(thread_id, contact_name, auth_info, instruction=""):
    if not auth_info:
        print(json.dumps({"success": False, "error": "Auth info required"}), file=sys.stderr)
        sys.exit(1)
        
    try:
        gmail = get_gmail_resource(auth_info)
        thread_tool = GmailGetThread(api_resource=gmail)
        
        thread_data = thread_tool.invoke({"thread_id": thread_id})
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant analyzing a Gmail thread to decide if we should send a follow-up outreach email. If the recipient has already replied, set should_followup to False. If they haven't replied, set should_followup to True and draft a polite follow-up. Return a JSON structure."),
            ("user", "Thread Data:\n{thread_data}\n\nRecipient Name: {name}\nInstruction: {instruction}")
        ])
        
        structured_llm = llm.with_structured_output(FollowupSchema)
        chain = prompt | structured_llm
        
        res = chain.invoke({
            "thread_data": str(thread_data),
            "name": contact_name,
            "instruction": instruction
        })
        
        gmail_draft_id = None
        if res.should_followup:
            draft_tool = GmailCreateDraft(api_resource=gmail)
            gmail_draft_id = draft_tool.invoke({
                "to": [auth_info.get("recipient_email", "")],
                "subject": res.subject,
                "message": res.body
            })
            
        print(json.dumps({
            "success": True,
            "shouldFollowUp": res.should_followup,
            "reason": res.reason,
            "subject": res.subject,
            "body": res.body,
            "gmailDraftId": gmail_draft_id
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: python followup_agent.py [thread_id] [contact_name] [auth_info_json] [instruction]"}), file=sys.stderr)
        sys.exit(1)
        
    thread_id = sys.argv[1]
    contact_name = sys.argv[2]
    
    try:
        auth_info = json.loads(sys.argv[3])
    except Exception:
        auth_info = {}
        
    instruction = sys.argv[4] if len(sys.argv) > 4 else ""
    
    evaluate_and_draft_followup(thread_id, contact_name, auth_info, instruction)
