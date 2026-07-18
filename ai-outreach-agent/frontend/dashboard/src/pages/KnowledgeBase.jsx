import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

import { useDocuments, useUploadDocument, useDeleteDocument } from '../lib/queries';

export default function KnowledgeBase() {
  const { data: docsRes, isLoading } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  
  const fileInputRef = useRef(null);
  const [docType, setDocType] = useState('other');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);

    try {
      await uploadDoc.mutateAsync(formData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
    }
  };

  const documents = docsRes?.data?.documents || [];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Upload company context, product sheets, and statistics to ground the AI.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="brochure">Brochure</option>
            <option value="statistics">Statistics</option>
            <option value="company_info">Company Info</option>
            <option value="template">Template</option>
            <option value="other">Other</option>
          </select>
          
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadDoc.isPending}>
            {uploadDoc.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Document
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.xlsx,.csv"
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="col-span-3 text-center py-12 text-muted-foreground">Loading documents...</div>}
        
        {!isLoading && documents.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-xl bg-card/50">
            <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="text-muted-foreground">Upload your first document to enhance AI accuracy.</p>
          </div>
        )}

        {documents.map((doc) => (
          <Card key={doc._id} className="group overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold truncate max-w-[180px]" title={doc.fileName}>
                    {doc.fileName}
                  </CardTitle>
                  <CardDescription className="uppercase text-xs tracking-wider mt-1">
                    {doc.fileType} • {doc.docType}
                  </CardDescription>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2 transition-opacity"
                onClick={() => deleteDoc.mutate(doc._id)}
                disabled={deleteDoc.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    doc.status === 'indexed' ? 'bg-green-500' : 
                    doc.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span className="capitalize text-muted-foreground">{doc.status}</span>
                </div>
                <span className="font-medium">{doc.chunkCount} chunks</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
