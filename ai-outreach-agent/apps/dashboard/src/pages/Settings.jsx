import { Settings as SettingsIcon, Mail, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUser } from '../lib/queries';

// API base URL for Google OAuth
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Settings() {
  const { data: userRes, isLoading } = useUser();
  
  const handleConnectGmail = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const isConnected = userRes?.data?.gmailConnected;
  const user = userRes?.data?.user;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-primary" />
            Gmail Integration
          </CardTitle>
          <CardDescription>Connect your Gmail account to enable sending and receiving emails.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : isConnected ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Gmail Connected</h3>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">Your emails are securely synced.</p>
              </div>
              <Button variant="outline" onClick={handleConnectGmail}>Reconnect</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center">
                <ShieldAlert className="w-8 h-8 text-destructive mr-4" />
                <div>
                  <h3 className="font-semibold text-destructive">Action Required</h3>
                  <p className="text-sm text-destructive/80">Connect Gmail to start campaigns.</p>
                </div>
              </div>
              <Button variant="premium" onClick={handleConnectGmail}>Connect Gmail</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
            Account Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Name</label>
              <div className="p-2 border rounded bg-muted/50">{user?.name || 'Loading...'}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Email</label>
              <div className="p-2 border rounded bg-muted/50">{user?.email || 'Loading...'}</div>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">Daily Send Cap</label>
              <div className="p-2 border rounded bg-muted/50">{user?.dailySendCap || 500} emails / day</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
