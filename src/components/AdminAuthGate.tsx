'use client';

import React, { useState } from 'react';
import { Lock, LogOut, ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function AdminAuthGate({
  initialAuthenticated,
  passwordConfigured,
  children,
}: {
  initialAuthenticated: boolean;
  passwordConfigured: boolean;
  children?: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Incorrect password. Access denied.');
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
        setPassword('');
      }
    } catch {
      setError('Network error while verifying admin credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLock() {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setAuthenticated(false);
    setPassword('');
  }

  if (authenticated) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs">
          <div className="inline-flex items-center gap-2 font-semibold text-emerald-950">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span>Authenticated via server-verified session</span>
          </div>
          <button
            type="button"
            onClick={handleLock}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock Session</span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  return (
    <section className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Unlock PromptBill Admin</h2>
          <p className="text-xs text-slate-600">
            Verified server-side against <code className="font-mono">ADMIN_PASSWORD</code> in Vercel environment variables.
          </p>
        </div>
      </div>

      {!passwordConfigured ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">ADMIN_PASSWORD is not set in environment variables</p>
            <p>
              Login is locked by default (fail-closed). Set <code className="font-mono">ADMIN_PASSWORD</code> in Vercel Project Settings -&gt; Environment Variables and redeploy.
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleUnlock} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-semibold text-slate-800">
          <span>Admin Password</span>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter ADMIN_PASSWORD"
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 pr-11 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !passwordConfigured}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? 'Verifying...' : 'Open Approval Dashboard'}
        </button>
      </form>
    </section>
  );
}
