import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

/** Decode the payload of the local JWT the API issues after MCOM signs the user in. */
function decodePayload(token: string): any {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('MCOM could not complete the sign-in. Please try again.');
      return;
    }

    if (!token) {
      setError('No sign-in token was received.');
      return;
    }

    try {
      const payload = decodePayload(token);
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: role || payload.role || 'agent',
        isOnboarded: payload.isOnboarded || false,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.replace('/');
    } catch {
      setError('We could not read the sign-in token. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      {error ? (
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h1 className="mb-2 text-xl font-black text-white">Sign-in failed</h1>
          <p className="mb-6 text-sm text-red-200">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </a>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
          <p className="text-lg font-bold text-white">Completing sign-in…</p>
          <p className="mt-1 text-sm text-slate-400">Please wait while we set up your session.</p>
        </div>
      )}
    </div>
  );
}
