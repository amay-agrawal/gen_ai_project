import sys
import json
import os
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'express-backend', '.env'))

class DeadlineSchema(BaseModel):
    label: str = Field(description="Description of the deadline.")
    date: str = Field(description="ISO Date string or empty if unspecified.")

class SummarizationSchema(BaseModel):
    summary: str = Field(description="A concise summary of the incoming email.")
    actionItems: List[str] = Field(description="List of action items.")
    deadlines: List[DeadlineSchema] = Field(description="List of deadlines.")
    sentiment: str = Field(description="Sentiment (positive, neutral, negative).")

class VariantsSchema(BaseModel):
    professional: str = Field(description="Professional reply option.")
    brief: str = Field(description="Short/brief reply option.")
    positive: str = Field(description="Positive/enthusiastic reply option.")
    clarification: str = Field(description="Clarification-asking reply option.")

def handle_summarize(email_body):
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Analyze the following incoming email body. Extract a concise summary, key action items, deadlines with labels and dates, and the overall sentiment. Return a JSON object matching the requested schema."),
            ("user", "{email_body}")
        ])
        chain = prompt | llm.with_structured_output(SummarizationSchema)
        res = chain.invoke({"email_body": email_body})
        print(json.dumps({
            "success": True,
            "summary": res.summary,
            "actionItems": res.actionItems,
            "deadlines": [{"label": d.label, "date": d.date} for d in res.deadlines],
            "sentiment": res.sentiment
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

def handle_variants(args):
    try:
        thread_history = args.get("thread_history", "")
        summary_json = args.get("summary_json", "")
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Based on the thread history and the email summary, generate 4 different reply options: professional, brief, positive, and clarification. Return a JSON object matching the requested schema."),
            ("user", "Thread History:\n{thread_history}\n\nSummary:\n{summary_json}")
        ])
        chain = prompt | llm.with_structured_output(VariantsSchema)
        res = chain.invoke({"thread_history": thread_history, "summary_json": summary_json})
        print(json.dumps({
            "success": True,
            "professional": res.professional,
            "brief": res.brief,
            "positive": res.positive,
            "clarification": res.clarification
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python reply_agent.py [action] [args]"}), file=sys.stderr)
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "summarize":
        handle_summarize(sys.argv[2])
    elif action == "variants":
        try:
            args = json.loads(sys.argv[2])
        except Exception:
            args = {}
        handle_variants(args)
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}), file=sys.stderr)
        sys.exit(1)
