import sys
import json
import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials

from googleapiclient.discovery import build
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.tools.gmail.create_draft import GmailCreateDraft
from langchain_community.tools.gmail.send_message import GmailSendMessage

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'express-backend', '.env'))

DB_DIR = os.path.join(os.path.dirname(__file__), 'chroma_db')

class EmailDraftSchema(BaseModel):
    subject: str = Field(description="The subject line of the email.")
    body: str = Field(description="The body of the email. Do not include signature in the body.")

def get_gmail_resource(auth_info):
    creds = Credentials(
        token=auth_info.get("access_token"),
        refresh_token=auth_info.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=auth_info.get("client_id"),
        client_secret=auth_info.get("client_secret"),
        scopes=auth_info.get("scopes", ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.compose"])
    )
    return build('gmail', 'v1', credentials=creds)

def retrieve_rag_context(query):
    try:
        if not os.path.exists(DB_DIR):
            return "No vector store found. No documents have been loaded."
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")
        db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        results = db.similarity_search(query, k=3)
        return "\n\n".join([doc.page_content for doc in results])
    except Exception as e:
        print(f"Warning: RAG retrieval failed: {e}", file=sys.stderr)
        return "Failed to retrieve RAG context."

def handle_generate(args, auth_info):
    recipient_email = args.get("recipient_email")
    recipient_name = args.get("recipient_name")
    topic = args.get("topic")
    tone = args.get("tone", "professional")
    signature = args.get("signature", "")
    
    # Get context from RAG
    context = retrieve_rag_context(topic)
    
    # Generate draft using Gemini LLM
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert sales email copywriter. Write a highly converting outreach email based on the context retrieved from the company documents. Return a JSON object with 'subject' and 'body'."),
        ("user", "Context:\n{context}\n\nRecipient Name: {name}\nRecipient Email: {email}\nTopic: {topic}\nTone: {tone}\nSignature: {signature}")
    ])
    
    structured_llm = llm.with_structured_output(EmailDraftSchema)
    chain = prompt | structured_llm
    
    draft = chain.invoke({
        "context": context,
        "name": recipient_name,
        "email": recipient_email,
        "topic": topic,
        "tone": tone,
        "signature": signature
    })
    
    # Create draft in Gmail if credentials are provided
    gmail_draft_id = None
    if auth_info:
        try:
            gmail = get_gmail_resource(auth_info)
            draft_tool = GmailCreateDraft(api_resource=gmail)
            result = draft_tool.invoke({
                "to": [recipient_email],
                "subject": draft.subject,
                "message": f"Dear {recipient_name},\n\n{draft.body}\n\n{signature}"
            })
            # Parse response to get ID
            gmail_draft_id = result
        except Exception as e:
            print(f"Warning: Failed to create Gmail draft: {e}", file=sys.stderr)
            
    print(json.dumps({
        "success": True,
        "subject": draft.subject,
        "body": draft.body,
        "gmailDraftId": gmail_draft_id
    }))

def handle_send(args, auth_info):
    recipient_email = args.get("recipient_email")
    subject = args.get("subject")
    body = args.get("body")
    
    if not auth_info:
        print(json.dumps({"success": False, "error": "Authentication required to send emails"}), file=sys.stderr)
        sys.exit(1)
        
    try:
        gmail = get_gmail_resource(auth_info)
        send_tool = GmailSendMessage(api_resource=gmail)
        result = send_tool.invoke({
            "to": [recipient_email],
            "subject": subject,
            "message": body
        })
        print(json.dumps({"success": True, "result": result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

def handle_regenerate(args, auth_info):
    subject = args.get("subject")
    body = args.get("body")
    instruction = args.get("instruction")
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert sales email copywriter. Regenerate the following email draft subject and body based on the user's instructions. Return a JSON object with 'subject' and 'body'."),
        ("user", "Original Subject: {subject}\nOriginal Body: {body}\nInstructions: {instruction}")
    ])
    
    structured_llm = llm.with_structured_output(EmailDraftSchema)
    chain = prompt | structured_llm
    
    res = chain.invoke({
        "subject": subject,
        "body": body,
        "instruction": instruction
    })
    
    print(json.dumps({
        "success": True,
        "subject": res.subject,
        "body": res.body
    }))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python email_agent.py [action] [args_json] [auth_info_json]"}), file=sys.stderr)
        sys.exit(1)
        
    action = sys.argv[1]
    
    try:
        args = json.loads(sys.argv[2])
    except Exception:
        args = {}
        
    try:
        auth_info = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
    except Exception:
        auth_info = None
        
    if action == "generate":
        handle_generate(args, auth_info)
    elif action == "send":
        handle_send(args, auth_info)
    elif action == "regenerate":
        handle_regenerate(args, auth_info)
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}), file=sys.stderr)
        sys.exit(1)
