import sys
import json
import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

class GeneratedEmail(BaseModel):
    subject: str = Field(description="The subject line of the email.")
    body: str = Field(description="The body of the email. Use {{recipient_greeting}} and {{company_hook}} as placeholders.")
    signature: str = Field(description="The signature block of the email.")

def generate_email(intent_json: str, signature: str):
    try:
        intent = json.loads(intent_json)
    except Exception as e:
        print(json.dumps({"error": "Invalid intent JSON"}), file=sys.stderr)
        sys.exit(1)
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    
    structured_llm = llm.with_structured_output(GeneratedEmail)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert sales email copywriter. Write a highly converting outreach email based on the user's intent. 
        Always use {{recipient_greeting}} at the very start instead of a name.
        Always include {{company_hook}} in the first paragraph.
        Return a JSON object containing the subject line, the body, and the signature."""),
        ("user", f"Topic: {intent.get('topic')}\nTone: {intent.get('tone')}\nSignature: {signature}")
    ])
    
    chain = prompt | structured_llm
    
    try:
        result = chain.invoke({})
        print(result.model_dump_json())
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing intent or signature arguments"}), file=sys.stderr)
        sys.exit(1)
        
    generate_email(sys.argv[1], sys.argv[2])
