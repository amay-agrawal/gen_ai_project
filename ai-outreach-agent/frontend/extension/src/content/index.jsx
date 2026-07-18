import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bot, Wand2, Loader2, Minimize2 } from 'lucide-react';
import '../styles/globals.css';

// Inject the React app into Gmail's DOM
function injectToolbar() {
  const container = document.createElement('div');
  container.id = 'ai-outreach-extension-root';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(<GmailOverlay />);
}

function GmailOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('generate');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Example heuristic to get thread text from Gmail DOM
  const getThreadText = () => {
    const messages = Array.from(document.querySelectorAll('.a3s'));
    return messages.map(m => m.innerText).join('\n\n');
  };

  const getComposeBox = () => {
    return document.querySelector('div[role="textbox"][aria-label="Message Body"]');
  };

  const handleAction = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      let response;
      if (mode === 'generate') {
        const threadText = getThreadText();
        response = await chrome.runtime.sendMessage({
          type: 'GENERATE_EMAIL',
          payload: {
            context: threadText ? 'reply' : 'new',
            threadText,
            instruction: input,
          }
        });
      } else if (mode === 'rewrite') {
        response = await chrome.runtime.sendMessage({
          type: 'REWRITE_TEXT',
          payload: {
            selectedText: window.getSelection()?.toString() || '',
            mode: input, // e.g. "professional", "concise"
          }
        });
      } else if (mode === 'summarize') {
        const threadText = getThreadText();
        response = await chrome.runtime.sendMessage({
          type: 'SUMMARIZE_THREAD',
          payload: { threadText }
        });
      }

      if (response.error) throw new Error(response.error);
      setResult(response.result);
      
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const insertToCompose = () => {
    const box = getComposeBox();
    if (box && result) {
      box.innerText = result;
      setIsOpen(false);
    } else {
      alert("Please open a compose window first.");
    }
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors z-[9999]"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="w-7 h-7 text-white" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="w-5 h-5 mr-2 text-indigo-400" />
          <span className="font-semibold">MailPilot Assistant</span>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsOpen(false)} className="hover:text-slate-300">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 ${mode === 'generate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setMode('generate')}
        >
          Generate
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 ${mode === 'rewrite' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setMode('rewrite')}
        >
          Rewrite
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 ${mode === 'summarize' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setMode('summarize')}
        >
          Summarize
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col space-y-4 max-h-[500px] overflow-y-auto">
        {mode === 'generate' && (
          <textarea 
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            rows={3}
            placeholder="What should this email be about?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}
        
        {mode === 'rewrite' && (
          <select 
            className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          >
            <option value="">Select style...</option>
            <option value="professional">Make Professional</option>
            <option value="concise">Make Concise</option>
            <option value="expand">Expand Details</option>
          </select>
        )}

        {mode === 'summarize' && (
          <p className="text-sm text-slate-600">
            Click summarize to generate a bulleted summary of the current thread.
          </p>
        )}

        <button 
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 flex justify-center items-center disabled:opacity-50"
          onClick={handleAction}
          disabled={isLoading || (mode !== 'summarize' && !input)}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          {mode === 'summarize' ? 'Summarize Thread' : 'Generate'}
        </button>

        {result && (
          <div className="mt-4 border-t pt-4 border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Result</h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap text-slate-800">
              {result}
            </div>
            {(mode === 'generate' || mode === 'rewrite') && (
              <button 
                className="mt-3 w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900"
                onClick={insertToCompose}
              >
                Insert into Compose Window
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Inject on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectToolbar);
} else {
  injectToolbar();
}
