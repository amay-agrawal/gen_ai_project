import { useState } from 'react';
import { Mic, Send, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { useParseVoice, useGenerateEmail, useGenerateBulkEmail, useDrafts, useSendEmails } from '../lib/queries';

export default function Campaigns() {
  const [transcript, setTranscript] = useState('');
  const [parsedIntent, setParsedIntent] = useState(null);
  
  const parseVoice = useParseVoice();
  const generateEmail = useGenerateEmail();
  const generateBulkEmail = useGenerateBulkEmail();
  const sendEmails = useSendEmails();
  
  const { data: draftsRes } = useDrafts();
  const drafts = draftsRes?.data?.drafts || [];

  const handleParse = async () => {
    if (!transcript) return;
    try {
      const res = await parseVoice.mutateAsync(transcript);
      setParsedIntent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!parsedIntent) return;
    try {
      if (parsedIntent.intent.intent === 'bulk_outreach') {
        const recipientIds = parsedIntent.resolvedContacts
          .map((c) => c.contactId)
          .filter((id) => id !== '');
        
        if (recipientIds.length === 0) {
          alert('No valid contacts found for bulk outreach. Please specify the names of contacts in your CRM.');
          return;
        }

        await generateBulkEmail.mutateAsync({
          intent: parsedIntent.intent,
          recipientIds,
        });
      } else {
        await generateEmail.mutateAsync({
          intent: parsedIntent.intent,
          contactId: parsedIntent.resolvedContacts[0]?.contactId,
        });
      }
      alert('Draft generated! Scroll down to review it.');
      setTranscript('');
      setParsedIntent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendDraft = async (draftId) => {
    try {
      const res = await sendEmails.mutateAsync([draftId]);
      const result = res.data?.results?.[0];
      if (result && !result.success) {
        alert('Failed to send email: ' + result.error);
        return;
      }
      alert('Email sent successfully via Gmail!');
    } catch (err) {
      alert(err.message || 'Failed to send email.');
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your intent instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onresult = (event) => {
      setTranscript(event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outreach Campaigns</h1>
        <p className="text-muted-foreground mt-2">
          Create new outreach sequences via natural language.
        </p>
      </div>

      <Card className="glass-panel border-0 shadow-2xl relative overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-20 blur-xl rounded-3xl" />
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2 text-primary" />
            Voice Command Interface
          </CardTitle>
          <CardDescription>
            Type or speak your outreach intent. The AI will extract the parameters automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="e.g. 'Reach out to Acme Corp about our new security feature, keep it brief and mention the SOC2 compliance doc.'"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="h-32 text-lg resize-none bg-black/5 dark:bg-white/5 border-white/20 focus:ring-primary backdrop-blur shadow-inner rounded-xl"
          />
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={startRecording}>
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
            <Button variant="premium" onClick={handleParse} disabled={parseVoice.isPending || !transcript}>
              {parseVoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Parse Intent
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedIntent && (
        <Card className="animate-enter glass border-0">
          <CardHeader>
            <CardTitle>Extracted Intent</CardTitle>
            <CardDescription>Review the parameters before generating drafts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Topic</label>
                <Input value={parsedIntent.intent.topic} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tone</label>
                <Input value={parsedIntent.intent.tone} readOnly />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Required Facts</label>
                <Input value={parsedIntent.intent.requiredFacts?.join(', ') || 'None'} readOnly />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Resolved Contacts</label>
                <div className="p-3 bg-muted rounded-md text-sm font-medium">
                  {parsedIntent.resolvedContacts.map((c) => c.company).join(', ') || 'No matches found in CRM'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleGenerate} disabled={generateEmail.isPending}>
                {generateEmail.isPending ? 'Generating...' : 'Generate Drafts'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drafts Section */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center">
          <Mail className="w-6 h-6 mr-2" /> Recent Drafts &amp; Campaigns
        </h2>
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No pending drafts. Use the voice command to generate one!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <Card key={draft._id} className="relative overflow-hidden glass border-0 hover-glow group transition-all duration-300">
                <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-300 group-hover:w-3 ${draft.status === 'pending_review' ? 'bg-amber-400' : 'bg-green-500'}`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{draft.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        To: {draft.contactId?.company || 'Unknown'} ({draft.contactId?.email})
                      </CardDescription>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      draft.status === 'pending_review' ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'
                    }`}>
                      {draft.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap font-mono text-sm border">
                    {draft.body}
                    {draft.signature && `\n\n${draft.signature}`}
                  </div>
                  
                  {draft.status === 'pending_review' && (
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" size="sm">Edit Draft</Button>
                      <Button size="sm" onClick={() => handleSendDraft(draft._id)} disabled={sendEmails.isPending}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {sendEmails.isPending ? 'Sending...' : 'Approve & Send'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
