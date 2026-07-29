import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';

export function AuthPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('applicant@example.com');
  const [password, setPassword] = useState('creek-demo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/workspace');
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/workspace');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
      <PageHeader
        title={mode === 'login' ? 'Applicant sign in' : 'Create applicant account'}
        lede="Private preparation workspace. Drafts stay yours — never board deliberation, never borough records custody."
      />
      <DisclaimerBanner />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-ink/70">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink/70">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-ink/15 bg-foam/80 px-3 py-2 text-sm outline-none ring-creek/30 focus:ring-2"
          />
        </label>
        {error && <p className="text-sm text-cedar-deep">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-foam hover:bg-ink-soft"
        >
          {mode === 'login' ? 'Sign in' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <button type="button" className="underline" onClick={() => setMode('register')}>
              Register
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button type="button" className="underline" onClick={() => setMode('login')}>
              Sign in
            </button>
          </>
        )}
      </p>
      <p className="mt-4 text-xs text-ink/45">
        Demo: applicant@example.com / creek-demo ·{' '}
        <Link to="/workspace" className="underline">
          Workspace
        </Link>
      </p>
    </div>
  );
}
