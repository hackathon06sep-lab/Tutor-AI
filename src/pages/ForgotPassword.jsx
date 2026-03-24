import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setMessage(data.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface font-['Plus_Jakarta_Sans'] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-high/50 p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Enter your account email and we will send you a reset link.
        </p>

        {message && (
          <p className="mb-4 rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/10 px-4 py-3 text-sm text-[#4ade80]">{message}</p>
        )}
        {error && (
          <p className="mb-4 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="you@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-dim py-3 font-bold text-on-primary-fixed disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 text-sm text-on-surface-variant">
          <Link to="/signin" className="text-primary hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
