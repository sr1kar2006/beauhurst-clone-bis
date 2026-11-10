import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/chrome/AppHeader';
import { useAuth } from './authStore';
import { usePageTitle } from '../lib/title';
import { PROTOTYPE_NOTICE } from '../config';

/** Mock sign-in: any password is accepted. "Sign in as" lets the presenter switch users quickly. */
export default function SignInPage() {
  usePageTitle('Sign in');
  const users = useAuth((s) => s.users);
  const currentId = useAuth((s) => s.currentId);
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (currentId) return <Navigate to={from} replace />;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return setError('No user with that email in this organisation.');
    if (u.status === 'Deactivated') return setError('This account has been deactivated. Ask an administrator to reactivate it.');
    signIn(u.id); navigate(from, { replace: true });
  };
  return (
    <div className="max-w-[440px] mx-auto py-[50px]" data-sign-in>
      <div className="bg-white border border-card-border rounded-card p-[28px]">
        <BrandMark />
        <h1 className="text-[24px] font-light text-ink mt-[18px] mb-[4px]">Sign in</h1>
        <p className="text-[13px] text-text mb-[16px]">{PROTOTYPE_NOTICE} Any password works.</p>
        <form onSubmit={submit} className="space-y-[12px] text-[14px]">
          <label className="block text-ink">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="mt-[4px] block w-full h-[36px] border border-border rounded-btn px-3" data-email /></label>
          <label className="block text-ink">Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="mt-[4px] block w-full h-[36px] border border-border rounded-btn px-3" data-password /></label>
          {error && <p role="alert" className="text-[13px] text-[#C0392B]">{error}</p>}
          <button type="submit" className="w-full h-[36px] bg-primary text-white rounded-btn font-semibold hover:bg-primary-hover" data-sign-in-submit>Sign in</button>
        </form>
        <div className="mt-[20px] pt-[16px] border-t border-border">
          <label className="block text-[14px] text-ink">Demo: sign in as
            <select className="mt-[4px] block w-full h-[36px] border border-border rounded-btn px-2 bg-white" defaultValue="" data-sign-in-as
              onChange={(e) => { if (e.target.value) { signIn(e.target.value); navigate(from, { replace: true }); } }}>
              <option value="" disabled>Choose a user…</option>
              {users.filter((u) => u.status !== 'Deactivated').map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
