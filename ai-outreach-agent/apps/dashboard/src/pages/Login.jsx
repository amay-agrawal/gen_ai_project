import { Button } from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="text-center space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">Sign in to manage your AI campaigns.</p>
      </div>
      
      <Button variant="premium" className="w-full h-12 text-md" onClick={handleGoogleLogin}>
        Sign In with Google
      </Button>
      
      <p className="text-xs text-muted-foreground mt-6">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
