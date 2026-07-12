import sys
import json
import os
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables (like GEMINI_API_KEY)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

class ParsedIntent(BaseModel):
    intent: Literal["single_outreach", "bulk_outreach", "follow_up", "reply"] = Field(
        description="The type of outreach intent."
    )
    topic: str = Field(description="The main topic or reason for outreach.")
    year: Optional[str] = Field(description="Any specific year mentioned, or null.")
    recipients: List[str] = Field(description="List of recipient names or 'all'.")
    requiredFacts: List[str] = Field(description="Specific facts that must be included.")
    tone: Literal["professional", "casual", "formal", "friendly"] = Field(
        description="The requested tone."
    )
    constraints: List[str] = Field(description="Constraints such as word count or style.")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0.")

def parse_transcript(transcript: str):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.3
    )
    
    structured_llm = llm.with_structured_output(ParsedIntent)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the AI engine inside "AI Outreach Agent," a tool that drafts professional outreach emails on behalf of a human user, who reviews and approves every email before it is sent. You never send emails yourself. You only draft.

Extract a structured intent from the user's outreach command. If the command is ambiguous (e.g. recipients unclear), set confidence below 0.6."""),
        ("user", "Transcript: {transcript}")
    ])
    
    chain = prompt | structured_llm
    
    try:
        result = chain.invoke({"transcript": transcript})
        # Print JSON so Node.js can read it from stdout
        print(result.model_dump_json())
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No transcript provided"}), file=sys.stderr)
        sys.exit(1)
        
    parse_transcript(sys.argv[1])
