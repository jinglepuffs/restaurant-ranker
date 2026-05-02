'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';

export default function Header() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-cream-100 border-b border-cream-300 px-4 py-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-warm-800 hover:text-warm-500 transition">
          🍽️ Our Restaurant Ranker
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-warm-700 hover:text-warm-500">All</Link>
          <Link href="/map" className="text-warm-700 hover:text-warm-500">Map</Link>
          {user ? (
            <>
              <Link href="/add" className="bg-warm-500 text-white px-4 py-2 rounded-full hover:bg-warm-600 transition font-medium">
                + add place
              </Link>
              <button onClick={signOut} className="text-warm-700 hover:text-warm-500">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-warm-500 text-white px-4 py-2 rounded-full hover:bg-warm-600 transition font-medium">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
