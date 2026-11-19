import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { User } from '../types/gatepass';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<User | null>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('LINGESH');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await onLogin(username, password);
      if (!user) {
        setError('Invalid username/email or password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E7F0] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-md border border-[#B8BFD4] bg-white shadow-lg overflow-hidden">
        {/* Left Industrial Identity Panel */}
        <div className="lg:col-span-5 bg-[#2B3352] text-white p-7 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-[#A9B4D8]">
              TJD Industries Pvt. Ltd.
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-balance">
              DXC Machines - Dispatch Request Portal
            </h1>
            <p className="mt-3 text-sm text-[#CFD6ED] leading-relaxed">
              Centralized dispatch request management, material movement control, dispatch tracking, and A4 Gate Pass invoicing.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/15 pt-5 text-xs text-[#CFD6ED]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#93C5FD] shrink-0 mt-0.5" />
              <span>Role-based access control across Store, Supervision, and Security Gate workflows.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#93C5FD] shrink-0 mt-0.5" />
              <span>Immutable dispatch history with unique sequential G.P. numbering.</span>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:col-span-7 p-7 sm:p-8 bg-[#F9FAFC] flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1C2130]">Portal Sign In</h2>
            <p className="text-xs text-[#5A627A] mt-1">
              Sign in with your employee username or corporate email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-[#2E354A] mb-1"
              >
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@tjdindustries.in"
                  className="w-full rounded border border-[#B8BFD4] bg-white pl-9 pr-3 py-2 text-sm text-[#1C2130] focus:border-[#2B3352] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-[#2E354A] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-[#B8BFD4] bg-white pl-9 pr-3 py-2 text-sm text-[#1C2130] focus:border-[#2B3352] focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#B91C1C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#2B3352] py-2.5 px-4 text-sm font-bold text-white hover:bg-[#1E243B] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
