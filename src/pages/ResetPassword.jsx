import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing. Please use the reset link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setMessage(data.message || 'Password reset successful.');
      setTimeout(() => navigate('/signin'), 1200);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface font-['Plus_Jakarta_Sans'] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-high/50 p-8">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Set a new password for your TutorAI account.
        </p>

        {message && (
          <p className="mb-4 rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/10 px-4 py-3 text-sm text-[#4ade80]">{message}</p>
        )}
        {error && (
          <p className="mb-4 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="password" className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">New password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-surface-container-highest px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-dim py-3 font-bold text-on-primary-fixed disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-sm text-on-surface-variant">
          <Link to="/signin" className="text-primary hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
