import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Login failed');
      login(data.token, data.user);
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
                <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
              </div>
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed font-bold rounded-lg shadow-xl shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all mt-4 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-outline-variant/20"/>
              <span className="flex-shrink mx-4 text-[0.6875rem] uppercase tracking-[0.1em] text-outline font-medium">or continue with</span>
              <div className="flex-grow border-t border-outline-variant/20"/>
            </div>

            <button type="button"
                    className="w-full py-4 bg-transparent border border-outline-variant/30 text-on-surface font-semibold rounded-lg flex items-center justify-center gap-3 hover:bg-surface-container-high transition-colors active:scale-[0.98]">
              <GoogleIcon />
              Google
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
