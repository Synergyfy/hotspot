import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      return;
    }

    if (token) {
      // Store the token and user info
      localStorage.setItem('auth_token', token);
      
      // Decode the JWT to get user info (basic decode, not verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          role: role || payload.role,
          isOnboarded: payload.isOnboarded || false,
        };
        setAuth(user, token);
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } catch (e) {
        setError('Failed to process authentication token.');
        setLoading(false);
      }
    } else {
      setError('No authentication token received.');
      setLoading(false);
    }
  }, [searchParams, setAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white text-lg">Completing authentication...</p>
          <p className="text-zinc-400 text-sm mt-2">Please wait while we sign you in.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return null;
}