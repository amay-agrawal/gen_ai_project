import React from 'react';
import { createRoot } from 'react-dom/client';
import { Bot } from 'lucide-react';
import '../styles/globals.css';

function Popup() {
  return (
    <div className="w-[350px] min-h-[400px] p-6 bg-slate-900 text-white font-sans">
      <div className="flex items-center justify-center mb-8 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Bot className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-xl font-bold tracking-tight">MailPilot</h1>
        <p className="text-sm text-slate-400">Your intelligent Gmail companion.</p>
      </div>

      <div className="space-y-4">
        <a 
          href="http://localhost:3000" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-center rounded-xl font-medium transition-colors border border-white/5"
        >
          Open Dashboard
        </a>
        
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-center">
          <p className="text-indigo-200">
            Open Gmail to see the AI assistant in action while composing emails and reading threads.
          </p>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
