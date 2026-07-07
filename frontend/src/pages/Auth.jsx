import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? `${apiBaseUrl}/api/login` : `${apiBaseUrl}/api/register`;
    const payload = mode === 'login' ? { email: form.email, password: form.password } : form;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Authentication failed');
      return;
    }
    localStorage.setItem('token', data.token);
    window.dispatchEvent(new Event('auth-state-changed'));
    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.2),_transparent_30%),#020617] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Competitive Study Planner</p>
          <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in or create an account to unlock your study hub.</p>
        </div>
        <div className="mb-4 flex rounded-full border border-slate-800 bg-slate-950 p-1">
          <button onClick={() => setMode('login')} className={`flex-1 rounded-full px-3 py-2 text-sm ${mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`flex-1 rounded-full px-3 py-2 text-sm ${mode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>Register</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
          )}
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none" />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-slate-950">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
      </div>
    </div>
  );
}
