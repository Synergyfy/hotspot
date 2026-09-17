import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mcomService } from '../../services/mcom';
import { useAuthStore } from '../../stores/useAuthStore';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'oauth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'access_denied':
          setError('Access denied. You do not have permission to access this application.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleMcomSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      await mcomService.startLogin();
    } catch (err) {
      setError('Failed to initiate MCOM signup. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 to-zinc-800 p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">ClickSIP</h1>
          <p className="text-zinc-400">Smart QR Code Marketing Platform</p>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Join ClickSIP</h2>
          <p className="text-zinc-300">
            Create QR code campaigns, track analytics, and manage leads all in one place.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center text-zinc-300">
              <span className="text-green-400 mr-3">✓</span>
              Create unlimited QR codes
            </li>
            <li className="flex items-center text-zinc-300">
              <span className="text-green-400 mr-3">✓</span>
              Real-time analytics tracking
            </li>
            <li className="flex items-center text-zinc-300">
              <span className="text-green-400 mr-3">✓</span>
              Lead capture and management
            </li>
            <li className="flex items-center text-zinc-300">
              <span className="text-green-400 mr-3">✓</span>
              Custom domain support
            </li>
          </ul>
        </div>

        <p className="text-zinc-500 text-sm">© 2024 ClickSIP. All rights reserved.</p>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold text-white">ClickSIP</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-zinc-400 mb-8">Sign up with your MCOM Solutions account</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleMcomSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {loading ? 'Connecting to MCOM...' : 'Sign up with MCOM Solutions'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <h3 className="text-sm font-medium text-white mb-2">Required Role</h3>
            <p className="text-xs text-zinc-400">
              You need an MCOM Solutions account with one of the following roles:
              <span className="text-blue-400"> Agent</span>,
              <span className="text-blue-400"> Account Manager</span>,
              <span className="text-blue-400"> Consultant</span>, or
              <span className="text-blue-400"> Admin</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}