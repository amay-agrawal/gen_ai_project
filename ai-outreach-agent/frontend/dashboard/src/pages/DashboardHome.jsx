import React, { useState } from 'react';
import { 
  Mic, 
  Send, 
  Bot, 
  UploadCloud, 
  FileText, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Trash, 
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { 
  useParseVoice, 
  useGenerateBulkEmail, 
  useDrafts, 
  useApproveDraft, 
  useSendEmails, 
  useDocuments, 
  useUploadDocument, 
  useDeleteDocument, 
  useQueryRag
} from '../lib/queries';

export default function DashboardHome() {
  // Voice command state
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const parseVoice = useParseVoice();
  const generateBulk = useGenerateBulkEmail();

  // RAG query state
  const [query, setQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const queryRag = useQueryRag();

  // Selected drafts state
  const [selectedDrafts, setSelectedDrafts] = useState({});
  const { data: draftsRes, refetch: refetchDrafts } = useDrafts();
  const approveDraft = useApproveDraft();
  const sendEmails = useSendEmails();

  // Document upload state
  const { data: docRes, refetch: refetchDocs } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  // Load drafts list
  const drafts = draftsRes?.data?.drafts || [];
  const documents = docRes?.data?.documents || [];

  const handleVoiceSubmit = async (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    try {
      const res = await parseVoice.mutateAsync(transcript);
      setVoiceResult(res.data);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to parse voice command.');
    }
  };

  const handleExecuteVoiceOutreach = async () => {
    if (!voiceResult) return;
    try {
      const contactIds = voiceResult.resolvedContacts.map(c => c.contactId).filter(Boolean);
      if (contactIds.length > 0) {
        await generateBulk.mutateAsync({
          recipientIds: contactIds,
          intent: voiceResult.intent
        });
        refetchDrafts();
        setTranscript('');
        setVoiceResult(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRagQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await queryRag.mutateAsync(query);
      setRagResult(res.chunks || res.data?.chunks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadDoc.mutateAsync(formData);
      refetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id) => {
    try {
      await deleteDoc.mutateAsync(id);
      refetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectDraft = (id) => {
    setSelectedDrafts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleBulkSend = async () => {
    const selectedIds = Object.keys(selectedDrafts).filter(id => selectedDrafts[id]);
    if (selectedIds.length === 0) return;
    try {
      await sendEmails.mutateAsync(selectedIds);
      setSelectedDrafts({});
      refetchDrafts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDraft.mutateAsync(id);
      refetchDrafts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-foreground">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Outreach Control Terminal
          </h1>
          <p className="text-muted-foreground mt-1">
            Send bulk emails, search document knowledge base, and trigger follow-ups in seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Voice Agent & RAG Assistant */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Voice Agent */}
          <Card className="glass border-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Mic className="w-24 h-24 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold">
                <Sparkles className="w-6 h-6 mr-2 text-primary animate-pulse" />
                AI Outreach Voice Command
              </CardTitle>
              <CardDescription>
                Speak or type your custom email instructions to compile personalized drafts for HRs instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVoiceSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="e.g. Write a followup email to all HRs who received my resume..."
                    className="w-full bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5 rounded-xl py-4 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecording(!isRecording);
                      if (!isRecording) {
                        setTranscript("Follow up with Google HR about my developer job application status in a polite tone");
                      }
                    }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                      isRecording ? 'bg-red-500 text-white animate-bounce' : 'text-muted-foreground hover:text-primary hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={parseVoice.isPending}
                    className="flex items-center bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all text-sm"
                  >
                    {parseVoice.isPending ? 'Analyzing Transcript...' : 'Parse Command'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>

              {/* Resolved Voice Intent */}
              {voiceResult && (
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-enter">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Parsed Voice Intent</span>
                    <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-semibold">{voiceResult.intent.tone}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Subject/Topic:</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{voiceResult.intent.topic}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Matched Recipients ({voiceResult.resolvedContacts.length}):</h4>
                    <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-2">
                      {voiceResult.resolvedContacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                          <span>{c.hrName || c.company}</span>
                          <span className="text-muted-foreground">{c.email || 'No email found'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleExecuteVoiceOutreach}
                    disabled={generateBulk.isPending}
                    className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm transition-all"
                  >
                    {generateBulk.isPending ? 'Generating Drafts...' : 'Generate Emails for Matches'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RAG Knowledge Base Assistant */}
          <Card className="glass border-0 shadow-2xl relative overflow-hidden group">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold">
                <Bot className="w-6 h-6 mr-2 text-primary" />
                Knowledge Base Chat
              </CardTitle>
              <CardDescription>
                Ask questions directly against your uploaded candidate profiles, portfolios, or resume documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Query Form */}
              <form onSubmit={handleRagQuerySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask something, e.g. What projects are on my resume?"
                  className="flex-1 bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={queryRag.isPending}
                  className="bg-primary hover:bg-primary/80 text-white p-3 rounded-xl shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Retrieved Chunks Display */}
              {queryRag.isPending && (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              {ragResult && (
                <div className="space-y-4 animate-enter">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-primary" />
                    Retrieved Knowledge Chunks
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {ragResult.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No matching context found.</p>
                    ) : (
                      ragResult.map((c, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-white/5 dark:bg-black/20 border border-white/5 text-xs text-muted-foreground leading-relaxed">
                          {c.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Outreach Queue & Document Upload */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Document Upload Area */}
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">RAG Document Loader</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-all rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group text-center bg-white/5">
                <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-all mb-2" />
                <span className="text-xs font-bold text-muted-foreground">Upload Portfolio, Resume or CSV</span>
                <span className="text-[10px] text-muted-foreground/60 mt-1">PDF, DOCX, CSV or TXT</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Documents List */}
              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center min-w-0 mr-2">
                      <FileText className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                      <span className="truncate font-semibold">{doc.filename}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outreach Queue */}
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg font-bold">Outreach Queue</CardTitle>
                <CardDescription className="text-xs">Select generated drafts to send instantly.</CardDescription>
              </div>
              {drafts.some(d => selectedDrafts[d._id]) && (
                <button
                  onClick={handleBulkSend}
                  disabled={sendEmails.isPending}
                  className="bg-primary hover:bg-primary/85 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all flex items-center"
                >
                  <Mail className="w-3.5 h-3.5 mr-1" />
                  Send Selected
                </button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                {drafts.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground italic">
                    Queue is empty. Create drafts via voice agent.
                  </div>
                ) : (
                  drafts.map((d) => (
                    <div key={d._id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-all">
                      <input
                        type="checkbox"
                        checked={!!selectedDrafts[d._id]}
                        onChange={() => toggleSelectDraft(d._id)}
                        disabled={d.status === 'sent'}
                        className="mt-1 rounded border-white/20 bg-transparent text-primary focus:ring-primary/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{d.contactId?.hrName || 'HR Contact'}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            d.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-muted-foreground mt-1 truncate">{d.subject}</h5>
                        <p className="text-[11px] text-muted-foreground/75 mt-0.5 line-clamp-2 leading-relaxed">
                          {d.body}
                        </p>
                        
                        {d.status !== 'sent' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleApprove(d._id)}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
