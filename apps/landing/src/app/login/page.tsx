'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'check your email to confirm your account.',
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        // Redirect to home or to the page they were trying to access
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next') || '/';
        window.location.href = next;
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* logo */}
        <a href="/" className="flex items-center justify-center mb-10">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">a.</span>
          </div>
        </a>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
          {mode === 'login' ? 'welcome back' : 'create your account'}
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          {mode === 'login'
            ? 'sign in to your apphouse account'
            : 'start building apps with ai'}
        </p>

        {/* google button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          continue with google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-sm"
            />
          </div>

          {message && (
            <div
              className={`text-sm px-4 py-3 rounded-xl ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-all disabled:opacity-40"
          >
            {loading ? 'loading...' : mode === 'login' ? 'sign in' : 'create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'login' ? (
            <>
              don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setMessage(null); }}
                className="text-gray-900 font-medium hover:underline"
              >
                sign up
              </button>
            </>
          ) : (
            <>
              already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setMessage(null); }}
                className="text-gray-900 font-medium hover:underline"
              >
                sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
