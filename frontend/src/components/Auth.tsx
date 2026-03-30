import { useState } from 'react';
import { LogIn, Mail, Lock, UserPlus, Sparkles, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { authApi } from '../api/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = isLogin 
        ? await authApi.login({ email, password })
        : await authApi.register({ email, password, name });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 overflow-hidden border border-slate-100">
        
        {/* Left Side: Brand/Marketing */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-blue-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-black tracking-tight">ClickSIP</span>
            </div>
            
            <h2 className="text-5xl font-black leading-tight mb-6">
              Turn your images into <span className="text-blue-200">revenue</span> machines.
            </h2>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              The world's most intuitive platform for creating shoppable, interactive image experiences that convert.
            </p>
          </div>

          <div className="relative z-10 bg-blue-700/30 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full"></div>)}
            </div>
            <p className="italic text-blue-50 font-medium">
              "ClickSIP transformed our product catalog. Our conversion rate jumped by 40% in the first month."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400 rounded-full"></div>
              <div>
                <div className="font-bold text-sm">Sarah Jenkins</div>
                <div className="text-xs text-blue-200">Head of E-commerce, StyleCo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-slate-500">
                {isLogin ? 'Enter your details to access your dashboard.' : 'Join thousands of creators today.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />
                  )}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-slate-500">
              {isLogin ? "New to ClickSIP?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
                type="button"
              >
                {isLogin ? 'Create an account' : 'Sign in instead'}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
