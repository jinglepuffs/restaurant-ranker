'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase';
import Header from '../../components/Header';

const SIGNUP_CODE = 'foodclub2026';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (signupCode !== SIGNUP_CODE) {
        setError('Invalid signup code. Ask your friend who runs this site!');
        setLoading(false);
        return;
      }
      if (!displayName.trim()) {
        setError('Please enter a display name.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-cream-300 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-warm-800 mb-2">
            {mode === 'signup' ? 'create an account' : 'welcome back'}
          </h1>
          <p className="text-sm text-warm-700 mb-6">
            {mode === 'signup'
              ? 'sign up to start ranking restaurants'
              : 'sign in to add and rate restaurants'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                <input
                  type="text"
                  placeholder="display name (e.g., Sarah)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 text-warm-900 focus:outline-none focus:border-warm-400"
                />
                <input
                  type="text"
                  placeholder="signup code"
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value)}
                  required
                  className="bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 text-warm-900 focus:outline-none focus:border-warm-400"
                />
              </>
            )}
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 text-warm-900 focus:outline-none focus:border-warm-400"
            />
            <input
              type="password"
              placeholder="password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 text-warm-900 focus:outline-none focus:border-warm-400"
            />

            {error && (
              <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-warm-500 text-white rounded-full py-2 font-medium hover:bg-warm-600 transition disabled:opacity-50"
            >
              {loading ? '...' : mode === 'signup' ? 'create account' : 'sign in'}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            className="w-full mt-4 text-sm text-warm-700 hover:text-warm-500"
          >
            {mode === 'signup' ? 'already have an account? sign in' : 'new here? create an account'}
          </button>
        </div>
      </main>
    </div>
  );
}
