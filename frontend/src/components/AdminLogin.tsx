import { useState } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import { getErrorMessage } from '../lib/errors';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/admin';
    } catch (err) {
      setError(getErrorMessage(err, 'Admin login failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950"><Shield className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-white">Super Admin</h1>
            <p className="text-sm text-slate-400">Sign in to manage Hotspot</p>
          </div>
        </div>
        {error && <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
        <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          {loading ? 'Signing in...' : 'Sign in as admin'}
        </button>
      </form>
    </div>
  );
}
