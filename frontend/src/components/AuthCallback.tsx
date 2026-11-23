import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ssoApi } from '../api/auth';
import { getErrorMessage, getSsoErrorMessage } from '../lib/errors';

interface AuthCallbackProps {
  mode?: 'callback' | 'handshake';
}

function decodeToken(token: string) {
  const part = token.split('.')[1];
  if (!part) throw new Error('Invalid authentication token');
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function AuthCallback({ mode = 'callback' }: AuthCallbackProps) {
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');
    if (errorCode) {
      setError(getSsoErrorMessage(errorCode) || 'Authentication failed. Please try again.');
      return;
    }

    const finish = (token: string, user?: any) => {
      try {
        const payload = decodeToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem(
          'user',
          JSON.stringify(
            user || {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              role: payload.role,
              isOnboarded: payload.isOnboarded,
            },
          ),
        );
        window.location.replace('/');
      } catch (err) {
        setError(getErrorMessage(err, 'We could not process the authentication token.'));
      }
    };

    const token = params.get('token');
    if (mode === 'handshake') {
      if (!token) {
        setError('No authentication token received.');
        return;
      }
      ssoApi
        .completeHandshake(token)
        .then(({ data }) => finish(data.token, data.user))
        .catch((err) => setError(getErrorMessage(err, 'We could not complete the SSO handshake.')));
      return;
    }

    if (token) {
      finish(token);
      return;
    }

    const code = params.get('code');
    if (code) {
      ssoApi
        .complete(code, params.get('state') || '')
        .then(({ data }) => finish(data.token, data.user))
        .catch((err) => setError(getErrorMessage(err, 'We could not complete sign-in.')));
      return;
    }

    setError('No authentication token received.');
  }, [mode]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-blue-100">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-xl font-black text-slate-900">Sign-in failed</h1>
          <p className="mb-7 text-sm text-slate-500">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
        <p className="text-lg font-black text-slate-900">Completing sign-in…</p>
        <p className="mt-1 text-sm text-slate-500">Please wait while we verify your Central Hub account.</p>
      </div>
    </div>
  );
}
