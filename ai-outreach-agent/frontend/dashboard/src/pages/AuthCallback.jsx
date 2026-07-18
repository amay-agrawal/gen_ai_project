import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate queries so that dashboard fetches updated logged-in user profile
    queryClient.invalidateQueries({ queryKey: ['user'] });
    
    // Redirect back to settings page so user sees Gmail is connected successfully
    navigate('/settings');
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground text-sm font-semibold">Completing authentication...</p>
      </div>
    </div>
  );
}
