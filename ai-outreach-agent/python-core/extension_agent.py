import sys
import json
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'express-backend', '.env'))

def handle_generate(args):
    try:
        instruction = args.get("instruction", "")
        context = args.get("context", "")
        thread_text = args.get("threadText", "")
        
        system_prompt = "You are a professional email writing assistant. Write a clear, professional email based on the user's instruction. Return ONLY the email body."
        if context == "reply" and thread_text:
            system_prompt += f"\n\nThis is a reply to an existing thread. Here is the thread context:\n{thread_text}"
            
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{instruction}")
        ])
        chain = prompt | llm
        res = chain.invoke({"instruction": instruction})
        print(json.dumps({"success": True, "result": res.content.strip()}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

def handle_rewrite(args):
    try:
        selected_text = args.get("selectedText", "")
        mode = args.get("mode", "professional")
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert editor. Rewrite the user's selected text to be in the requested mode: {mode}. Return ONLY the rewritten text."),
            ("user", "{selected_text}")
        ])
        chain = prompt | llm
        res = chain.invoke({"mode": mode, "selected_text": selected_text})
        print(json.dumps({"success": True, "result": res.content.strip()}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

def handle_summarize(args):
    try:
        thread_text = args.get("threadText", "")
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert summarizer. Summarize the following email thread text. Return a concise, clear summary of key points and any active action items."),
            ("user", "{thread_text}")
        ])
        chain = prompt | llm
        res = chain.invoke({"thread_text": thread_text})
        print(json.dumps({"success": True, "result": res.content.strip()}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python extension_agent.py [action] [args_json]"}), file=sys.stderr)
        sys.exit(1)
        
    action = sys.argv[1]
    try:
        args = json.loads(sys.argv[2])
    except Exception:
        args = {}
        
    if action == "generate":
        handle_generate(args)
    elif action == "rewrite":
        handle_rewrite(args)
    elif action == "summarize":
        handle_summarize(args)
    else:
        print(json.dumps({"error": f"Unknown action: {action}"}), file=sys.stderr)
        sys.exit(1)
