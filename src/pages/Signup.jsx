import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function Signup() {
  const [form,         setForm]         = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res  = await apiFetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Registration failed');
      login(data.user);
      navigate('/chat');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row font-['Plus_Jakarta_Sans'] bg-surface text-on-surface">

      {/* LEFT — Illustration */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
               style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d0d18 100%)' }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary blur-[120px] rounded-full"/>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container blur-[120px] rounded-full"/>
        </div>

        {/* Brain SVG */}
        <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center mb-12">
          <svg className="w-full h-full" style={{ filter: 'drop-shadow(0 0 25px rgba(189,157,255,0.3))' }}
               viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M100,30 C60,30 35,55 35,90 C35,120 55,145 80,155 L100,175 L120,155 C145,145 165,120 165,90 C165,55 140,30 100,30 Z"
                  fill="none" stroke="#bd9dff" strokeDasharray="4 2" strokeWidth="0.5"/>
            <path d="M70,60 Q100,40 130,60"  fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="1.5"/>
            <path d="M60,90 Q100,70 140,90"  fill="none" stroke="#a88cfb" strokeLinecap="round" strokeWidth="1.5"/>
            <path d="M70,120 Q100,100 130,120" fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="1.5"/>
            <path d="M100,60 V130"            fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="1.5"/>
            {[{cx:70,cy:60},{cx:130,cy:60},{cx:70,cy:120},{cx:130,cy:120}].map((p,i)=>(
              <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#bd9dff"/>
            ))}
            {[{cx:60,cy:90},{cx:140,cy:90}].map((p,i)=>(
              <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#a88cfb"/>
            ))}
            <circle cx="100" cy="45"  r="2" fill="#ff97b2"/>
            <circle cx="100" cy="140" r="2" fill="#ff97b2"/>
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <p className="text-[1.75rem] font-bold leading-tight tracking-tight text-on-surface mb-8">
            Join thousands of students learning smarter with AI
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {['PK','AM','SR'].map(init => (
                <div key={init}
                     className="w-10 h-10 rounded-full bg-secondary-container ring-2 ring-surface flex items-center justify-center text-xs font-bold text-on-secondary-container">
                  {init}
                </div>
              ))}
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-surface-container-high ring-2 ring-surface text-[0.6875rem] font-bold text-primary">
                +2k
              </div>
            </div>
            <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant font-semibold">
              2,000+ students active now
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT — Form */}
      <section className="w-full md:w-1/2 bg-surface flex flex-col p-8 md:p-16 lg:p-24 justify-center">
        <div className="max-w-md w-full mx-auto">

          {/* Brand */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-primary-dim rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-surface text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-primary">TutorAI</span>
          </div>

          <div className="mb-10">
            <h1 className="text-[2.5rem] font-bold text-on-surface leading-tight tracking-tighter mb-2">Create your account</h1>
            <p className="text-on-surface-variant font-medium">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary hover:text-primary-fixed-dim transition-colors underline underline-offset-4 decoration-primary/30 ml-1">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-error bg-error-container/20 border border-error/30 rounded-lg px-4 py-3">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              { name: 'name',  label: 'Full name', type: 'text',  placeholder: 'Alex Sterling' },
              { name: 'email', label: 'Email',     type: 'email', placeholder: 'alex@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name} className="space-y-1.5">
                <label htmlFor={name} className="text-[0.6875rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant px-1">
                  {label}
                </label>
                <input
                  id={name} name={name} type={type} placeholder={placeholder} required
                  value={form[name]} onChange={handleChange}
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                />
              </div>
            ))}

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[0.6875rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant px-1">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                  value={form.password} onChange={handleChange}
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40 transition-all outline-none pr-12"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(189,157,255,0.2)] hover:shadow-[0_6px_25px_rgba(189,157,255,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-[0.6875rem] text-on-surface-variant leading-relaxed max-w-[280px] mx-auto">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-outline hover:text-primary transition-colors">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-outline hover:text-primary transition-colors">Privacy Policy</a>.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
