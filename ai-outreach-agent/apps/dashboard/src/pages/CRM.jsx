import { useState } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { useContacts, useCreateContact } from '../lib/queries';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function CRM() {
  const { data: contactsRes, isLoading } = useContacts();
  const createContact = useCreateContact();
  const contacts = contactsRes?.data?.contacts || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ company: '', hrName: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    createContact.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ company: '', hrName: '', email: '' });
      },
      onError: (err) => {
        alert(err.message || 'Failed to add contact');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM &amp; Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage your outreach targets.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      <Card className="glass-panel border-0 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/5 dark:bg-white/5 border-b border-white/10 dark:border-white/5 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Contact Person</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Loading contacts...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-10 h-10 text-muted-foreground mb-3 opacity-20" />
                        <p className="text-muted-foreground">No contacts found. Click "Add Contact" to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-medium">{contact.company}</td>
                      <td className="px-6 py-4">{contact.hrName} <span className="text-muted-foreground ml-1">{contact.designation ? `(${contact.designation})` : ''}</span></td>
                      <td className="px-6 py-4">{contact.email}</td>
                      <td className="px-6 py-4 capitalize">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {contact.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border-white/20 glass-panel animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Add New Contact</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input 
                    required 
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Person (HR Name)</label>
                  <Input 
                    required 
                    placeholder="e.g. Jane Doe"
                    value={formData.hrName}
                    onChange={(e) => setFormData({...formData, hrName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    required 
                    type="email" 
                    placeholder="jane@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createContact.isPending}>
                    {createContact.isPending ? 'Adding...' : 'Add Contact'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
