import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, LogIn, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ssoApi } from '../api/auth';
import { getErrorMessage, getSsoErrorMessage } from '../lib/errors';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get('mode') === 'register';
  const errorCode = searchParams.get('error') || searchParams.get('reason');
  const [error, setError] = useState<string | null>(getSsoErrorMessage(errorCode));
  const [loading, setLoading] = useState(false);
  const [membershipUrl, setMembershipUrl] = useState<string | null>(null);
  const upgradeUrl = searchParams.get('upgradeUrl') || null;
  const requiresUpgrade = [
    'SUBSCRIPTION_REQUIRED',
    'NO_ACTIVE_PLAN',
    'PLAN_REQUIRED',
    'TRIAL_EXPIRED',
    'PAYMENT_FAILED',
  ].includes(errorCode || '');

  useEffect(() => {
    if (!requiresUpgrade) return;
    ssoApi.getConfig()
      .then(({ data }) => { setMembershipUrl(data?.membershipUrl || null); })
      .catch((): void => undefined);
  }, [requiresUpgrade]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await ssoApi.startLogin();
    } catch (err) {
      setError(getErrorMessage(err, 'We could not connect to MCOM Solutions. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans sm:p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-blue-100 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-blue-600 p-12 text-white lg:flex">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-blue-500 opacity-50 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-700 opacity-50 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-black tracking-tight">ClickSIP</span>
            </div>

            <h2 className="mb-6 text-5xl font-black leading-tight">
              Turn your images into <span className="text-blue-200">revenue</span> machines.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-blue-100">
              Upload one image, drop hotspots on your products, and share a link. Visitors tap to explore, buy or leave their email.
            </p>

            <div className="mt-10 space-y-3 text-sm font-medium text-blue-100">
              {['No coding or website needed', 'Works on phones and desktop', 'Leads and analytics built in'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/60 text-[10px] font-black">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-white/10 bg-blue-700/30 p-6 backdrop-blur-md">
            <div className="mb-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-4 rounded-full bg-yellow-400" />
              ))}
            </div>
            <p className="font-medium italic text-blue-50">
              “ClickSIP transformed our product catalog. Our conversion rate jumped by 40% in the first month.”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-400" />
              <div>
                <div className="text-sm font-bold">Sarah Jenkins</div>
                <div className="text-xs text-blue-200">Head of E-commerce, StyleCo</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <Link
                to="/"
                className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 transition-colors hover:text-blue-600 sm:text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to home
              </Link>
              <div className="mb-6 flex items-center gap-2 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">ClickSIP</span>
              </div>
              <h1 className="mb-2 text-3xl font-black text-slate-900">{isSignup ? 'Get started' : 'Welcome back'}</h1>
              <p className="text-slate-500">
                {isSignup
                  ? 'Create your ClickSIP workspace with your MCOM Solutions account.'
                  : 'Use your MCOM Solutions account to manage your campaigns and leads.'}
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error}
                  {requiresUpgrade && (upgradeUrl || membershipUrl) && (
                    <a href={upgradeUrl || membershipUrl || '#'} className="ml-1 underline">
                      Manage your subscription
                    </a>
                  )}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {loading ? 'Connecting to MCOM…' : 'Sign in with MCOM Solutions'}
            </button>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account? Your MCOM Solutions account works here too.
            </p>

            <p className="mt-6 text-center text-[11px] font-medium leading-relaxed text-slate-400">
              You only need an account to build campaigns. Your visitors never sign in.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
