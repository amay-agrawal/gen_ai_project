import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLogin, useRegister } from '../lib/queries';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await registerMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }
      // Redirect to home/dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'login'
            ? 'Sign in to manage your AI campaigns.'
            : 'Get started with MailPilot email outreach.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name
            </label>
            <Input
              required
              type="text"
              placeholder="Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-black/5 dark:bg-white/5 border-white/20"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <Input
            required
            type="email"
            placeholder="jane@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-black/5 dark:bg-white/5 border-white/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="bg-black/5 dark:bg-white/5 border-white/20"
          />
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending || registerMutation.isPending}
          className="w-full h-11 text-sm font-semibold"
        >
          {loginMutation.isPending || registerMutation.isPending
            ? 'Processing...'
            : mode === 'login'
            ? 'Sign In'
            : 'Create Account'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card dark:bg-[#121212] px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="premium"
        className="w-full h-11 text-sm font-semibold"
        onClick={handleGoogleLogin}
      >
        Sign In with Google
      </Button>

      <div className="text-center mt-6">
        <button
          onClick={toggleMode}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
