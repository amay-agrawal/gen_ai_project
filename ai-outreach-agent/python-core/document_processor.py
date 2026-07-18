import sys
import json
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, CSVLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'express-backend', '.env'))

DB_DIR = os.path.join(os.path.dirname(__file__), 'chroma_db')

def process_document(file_path, doc_id, action="add"):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")
    
    if action == "delete":
        try:
            db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
            # Delete documents matching document_id in metadata
            db.delete(where={"document_id": doc_id})
            print(json.dumps({"success": True, "message": "Document deleted from index"}))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
            sys.exit(1)
        return
        
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}), file=sys.stderr)
        sys.exit(1)
        
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        loader = PyPDFLoader(file_path)
    elif ext in ['.docx', '.doc']:
        loader = Docx2txtLoader(file_path)
    elif ext == '.csv':
        loader = CSVLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding='utf-8')
        
    try:
        docs = loader.load()
        for doc in docs:
            doc.metadata["document_id"] = doc_id
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        # Save to local vector store
        Chroma.from_documents(splits, embeddings, persist_directory=DB_DIR)
        
        print(json.dumps({
            "success": True,
            "chunkCount": len(splits),
            "message": f"Successfully indexed {len(splits)} chunks."
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

def query_documents(query):
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")
        db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
        results = db.similarity_search(query, k=3)
        chunks = [{"text": doc.page_content, "metadata": doc.metadata} for doc in results]
        print(json.dumps({"success": True, "chunks": chunks}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing arguments"}), file=sys.stderr)
        sys.exit(1)
        
    file_path_or_query = sys.argv[1]
    doc_id = sys.argv[2] if len(sys.argv) > 2 else "none"
    action = sys.argv[3] if len(sys.argv) > 3 else "add"
    
    if action == "query":
        query_documents(file_path_or_query)
    else:
        process_document(file_path_or_query, doc_id, action)
