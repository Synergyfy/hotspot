import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail, Sparkles, User, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../lib/errors';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setIsLogin((previous) => !previous);
    setErrors({});
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!isLogin && !name.trim()) next.name = 'Enter your full name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'That email address does not look right.';
    if (!password) next.password = 'Enter your password.';
    else if (!isLogin && password.length < 8) next.password = 'Use at least 8 characters.';
    return next;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = isLogin ? { email: email.trim(), password } : { email: email.trim(), password, name: name.trim() };
      const { data } = isLogin ? await authApi.login(payload) : await authApi.register(payload);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setErrors({ form: 'That email and password combination is not correct. Check them and try again.' });
      } else if (status === 400 && isLogin === false) {
        setErrors({ form: getErrorMessage(err, 'We could not create that account. Try signing in instead.') });
      } else {
        setErrors({ form: getErrorMessage(err, 'We could not sign you in right now. Please try again.') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans sm:p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-blue-100 lg:grid-cols-2">
        {/* Left Side: Brand/Marketing */}
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

        {/* Right Side: Auth Form */}
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
              <h1 className="mb-2 text-3xl font-black text-slate-900">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
              <p className="text-slate-500">
                {isLogin ? 'Sign in to manage your campaigns and leads.' : 'Start turning images into interactive experiences.'}
              </p>
            </div>

            <form onSubmit={handleAuth} noValidate className="space-y-4">
              {errors.form && (
                <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="auth-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((previous) => ({ ...previous, name: undefined, form: undefined }));
                      }}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'auth-name-error' : undefined}
                      className={`w-full rounded-2xl border bg-slate-50 py-4 pl-12 pr-4 text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                        errors.name ? 'border-red-200 focus:ring-red-400' : 'border-slate-100 focus:ring-blue-500'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p id="auth-name-error" className="mt-1.5 text-[11px] font-bold text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((previous) => ({ ...previous, email: undefined, form: undefined }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'auth-email-error' : undefined}
                    className={`w-full rounded-2xl border bg-slate-50 py-4 pl-12 pr-4 text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-200 focus:ring-red-400' : 'border-slate-100 focus:ring-blue-500'
                    }`}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && (
                  <p id="auth-email-error" className="mt-1.5 text-[11px] font-bold text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="auth-password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((previous) => ({ ...previous, password: undefined, form: undefined }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'auth-password-error' : !isLogin ? 'auth-password-help' : undefined}
                    className={`w-full rounded-2xl border bg-slate-50 py-4 pl-12 pr-12 text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                      errors.password ? 'border-red-200 focus:ring-red-400' : 'border-slate-100 focus:ring-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p id="auth-password-error" className="mt-1.5 text-[11px] font-bold text-red-600">
                    {errors.password}
                  </p>
                ) : (
                  !isLogin && (
                    <p id="auth-password-help" className="mt-1.5 text-[11px] font-medium text-slate-400">
                      At least 8 characters.
                    </p>
                  )
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              {isLogin ? 'New to ClickSIP?' : 'Already have an account?'}{' '}
              <button type="button" onClick={switchMode} className="font-bold text-blue-600 transition-colors hover:text-blue-700">
                {isLogin ? 'Create an account' : 'Sign in instead'}
              </button>
            </p>

            <p className="mt-6 text-center text-[11px] font-medium leading-relaxed text-slate-400">
              {isLogin
                ? 'Forgot your password? Ask your workspace owner to reset it.'
                : 'You only need an account to build campaigns. Your visitors never sign in.'}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
