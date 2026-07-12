import { useState } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useInbox, useReplySuggest, useSyncInbox } from '../lib/queries';
import { Loader2, RefreshCw } from 'lucide-react';

export default function Inbox() {
  const { data: inboxRes, isLoading } = useInbox();
  const suggestReply = useReplySuggest();
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  const syncInbox = useSyncInbox();

  const messages = inboxRes?.data?.messages || [];

  const handleSync = async () => {
    try {
      const res = await syncInbox.mutateAsync();
      if (res.data.synced > 0) {
        alert(`Synced ${res.data.synced} new messages!`);
      } else {
        alert('No new replies found.');
      }
    } catch (err) {
      alert('Failed to sync: ' + err.message);
    }
  };

  const handleSuggest = async (msg) => {
    try {
      const res = await suggestReply.mutateAsync(msg._id);
      setSuggestions(res.data.variants);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in flex h-[calc(100vh-8rem)]">
      {/* List */}
      <div className="w-1/3 border-r border-border pr-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Reply Inbox</h1>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncInbox.isPending}>
            {syncInbox.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sync Gmail
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isLoading ? (
            <p className="text-muted-foreground">Loading inbox...</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground">No inbound messages yet.</p>
          ) : (
            messages.map((msg) => (
              <Card 
                key={msg._id} 
                className={`cursor-pointer transition-all duration-300 glass hover-scale border-0 ${selectedMessage?._id === msg._id ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}`}
                onClick={() => { setSelectedMessage(msg); setSuggestions(null); }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm truncate">{msg.from}</span>
                    <span className="text-xs text-muted-foreground">{new Date(msg.receivedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{msg.snippet}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 pl-8 flex flex-col">
        {selectedMessage ? (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold">Message Details</h2>
              <p className="text-muted-foreground">{selectedMessage.from}</p>
            </div>
            
            <Card className="glass-panel border-0 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-10 blur-xl rounded-3xl pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <p>{selectedMessage.aiSummary}</p>
                {selectedMessage.actionItems?.length > 0 && (
                  <div>
                    <span className="font-semibold block mb-1">Action Items:</span>
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedMessage.actionItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="premium" onClick={() => handleSuggest(selectedMessage)} disabled={suggestReply.isPending}>
                {suggestReply.isPending ? 'Generating...' : 'Suggest Replies'}
              </Button>
            </div>

            {suggestions && (
              <div className="space-y-4 mt-8 animate-enter">
                <h3 className="font-semibold text-lg border-b pb-2">AI Reply Suggestions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(suggestions).map(([variant, body]) => (
                    <Card key={variant} className="glass hover-glow border-0 transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize text-primary">{variant}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
                        <Button variant="outline" size="sm" className="mt-4 w-full">Use this draft</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <Mail className="w-16 h-16 mb-4" />
            <p>Select a message to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
