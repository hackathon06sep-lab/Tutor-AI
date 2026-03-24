import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function Signin() {
  const [form,         setForm]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Login failed');
      login(data.user);
      navigate('/chat');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-surface font-['Plus_Jakarta_Sans'] text-on-surface">

      {/* LEFT — Illustration */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0f0f1a 100%)' }}>

        {/* Floating symbols */}
        <div className="absolute top-20 left-20 opacity-20 transform -rotate-12 animate-pulse">
          <span className="material-symbols-outlined text-6xl text-primary">functions</span>
        </div>
        <div className="absolute bottom-20 right-20 opacity-20 transform rotate-12 animate-pulse">
          <span className="material-symbols-outlined text-6xl text-secondary">genetics</span>
        </div>
        <div className="absolute top-1/4 right-32 opacity-20 animate-bounce">
          <span className="material-symbols-outlined text-4xl text-tertiary">science</span>
        </div>
        <div className="absolute bottom-1/4 left-32 opacity-20">
          <span className="text-4xl text-primary-dim font-bold">π</span>
        </div>

        {/* Book illustration */}
        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="mb-12" style={{ filter: 'drop-shadow(0 0 15px rgba(189,157,255,0.4))' }}>
            <svg fill="none" height="180" viewBox="0 0 240 180" width="240">
              <path d="M120 160C120 160 80 140 20 140V40C80 40 120 60 120 60C120 60 160 40 220 40V140C160 140 120 160 120 160Z"
                    fill="#242434" stroke="#bd9dff" strokeWidth="4"/>
              <path d="M120 150C120 150 85 130 30 130V50C85 50 120 70 120 70C120 70 155 50 210 50V130C155 130 120 150 120 150Z"
                    fill="#1e1e2d"/>
              <g opacity="0.6">
                <line stroke="#bd9dff" strokeLinecap="round" strokeWidth="2" x1="120" x2="120" y1="60" y2="10"/>
                <line stroke="#bd9dff" strokeLinecap="round" strokeWidth="2" x1="100" x2="70"  y1="55" y2="15"/>
                <line stroke="#bd9dff" strokeLinecap="round" strokeWidth="2" x1="140" x2="170" y1="55" y2="15"/>
                <line stroke="#bd9dff" strokeLinecap="round" strokeWidth="2" x1="85"  x2="40"  y1="65" y2="35"/>
                <line stroke="#bd9dff" strokeLinecap="round" strokeWidth="2" x1="155" x2="200" y1="65" y2="35"/>
              </g>
              <rect fill="#bd9dff" height="90" opacity="0.8" rx="2" width="4" x="118" y="60"/>
            </svg>
          </div>
          <h2 className="text-white text-2xl font-bold leading-relaxed tracking-tight">
            "Learn anything, anytime, with AI by your side"
          </h2>
          <div className="mt-8 w-12 h-1 bg-primary-dim rounded-full"/>
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(#bd9dff 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>
      </aside>

      {/* RIGHT — Form */}
      <main className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-surface">
        <div className="w-full max-w-[440px] flex flex-col">

          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dim rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary-fixed text-2xl">school</span>
            </div>
            <span className="text-2xl font-extrabold text-primary tracking-tighter">TutorAI</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-on-surface mb-2">Welcome back</h1>
            <p className="text-on-surface-variant font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-primary-fixed-dim transition-colors ml-1">Sign up</Link>
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-error bg-error-container/20 border border-error/30 rounded-lg px-4 py-3">{error}</p>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant">Email address</label>
              <input
                name="email" type="email" placeholder="you@email.com" required
                value={form.email} onChange={handleChange}
                className="w-full bg-surface-container-highest border-transparent rounded-lg py-4 px-5 text-on-surface placeholder:text-outline focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[0.6875rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required
                  value={form.password} onChange={handleChange}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg py-4 px-5 text-on-surface placeholder:text-outline focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all outline-none pr-12"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed font-bold rounded-lg shadow-xl shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all mt-4 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          <p className="mt-12 text-center text-[0.625rem] text-outline leading-relaxed max-w-[320px] mx-auto">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-on-surface">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-on-surface">Privacy Policy</a>.
          </p>
        </div>
      </main>

      {/* Background glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"/>
      <div className="fixed bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"/>
    </div>
  );
}
