import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { mcomService } from '../services/mcom';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Your MCOM account does not have access to ClickSIP yet. Contact your MCOM administrator to enable it.',
  invalid_state: 'The sign-in request expired or was tampered with. Please try again.',
  missing_code: 'MCOM did not return an authorization code. Please try again.',
  missing_token: 'No sign-in token was received. Please try again.',
  invalid_token: 'The sign-in token was not valid. Please try again.',
  oauth_failed: 'MCOM could not complete the sign-in. Please try again.',
  server_error: 'Sign-in is not configured correctly on the server. Contact your administrator.',
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    ERROR_MESSAGES[searchParams.get('error') || ''] || null,
  );

  const handleMcomLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await mcomService.startLogin();
    } catch {
      setError(
        'MCOM sign-in is not configured yet. Add MCOM_CLIENT_ID and the other MCOM credentials to the API environment, then try again.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans sm:p-6">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-blue-100 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-blue-600 p-12 text-white lg:flex">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-blue-500 opacity-50 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-700 opacity-50 blur-3xl" />

          <div className="relative z-10">
            <Link to="/" className="mb-12 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-black tracking-tight">ClickSIP</span>
            </Link>

            <h2 className="mb-6 text-5xl font-black leading-tight">
              Turn your images into <span className="text-blue-200">revenue</span> machines.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-blue-100">
              Upload one image, drop hotspots on your products, and share a link. Visitors tap to explore, buy or leave their email.
            </p>
          </div>

          <div className="relative z-10 space-y-3 text-sm font-medium text-blue-100">
            {[
              'One MCOM account for every tool',
              'No coding or website needed',
              'Leads and analytics built in',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-200" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Sign-in panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>

          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-black text-slate-900">Sign in to ClickSIP</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Use your MCOM Solutions account. You will be taken to MCOM to approve the sign-in, then brought straight back.
          </p>

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold leading-relaxed text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleMcomLogin}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Connecting to MCOM…
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" /> Sign in with MCOM Solutions
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs font-medium leading-relaxed text-slate-400">
            Don’t have an MCOM account? Create one at MCOM Solutions, then come back here to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
