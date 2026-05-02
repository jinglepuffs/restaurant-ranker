'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';
import Header from '../components/Header';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: rest } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
    const { data: ratings } = await supabase.from('ratings').select('*');
    const { data: visits } = await supabase.from('visits').select('*');

    const enriched = (rest || []).map((r) => {
      const rs = (ratings || []).filter((rt) => rt.restaurant_id === r.id);
      const vs = (visits || []).filter((v) => v.restaurant_id === r.id);
      const avgFood = rs.length ? rs.reduce((a, b) => a + Number(b.food_score), 0) / rs.length : null;
      const avgVibe = rs.length ? rs.reduce((a, b) => a + Number(b.vibe_score), 0) / rs.length : null;
      const avgService = rs.length ? rs.reduce((a, b) => a + Number(b.service_score), 0) / rs.length : null;
      const total = avgFood !== null ? (avgFood * 3 + avgVibe + avgService) / 5 : null;
      const lastVisit = vs.length ? vs.map(v => v.visit_date).sort().reverse()[0] : null;
      return { ...r, avgFood, avgVibe, avgService, total, ratingCount: rs.length, visitCount: vs.length, lastVisit };
    });

    enriched.sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
    setRestaurants(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('restaurants-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cuisines = ['all', ...new Set(restaurants.flatMap(r => r.cuisine || []))];

  const filtered = restaurants.filter((r) => {
    const matchSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.dishes_ordered?.toLowerCase().includes(search.toLowerCase()) ||
      r.neighborhood?.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = cuisineFilter === 'all' || (r.cuisine || []).includes(cuisineFilter);
    return matchSearch && matchCuisine;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-warm-800 mb-1">Our Rankings</h1>
          <p className="text-warm-700">
            {restaurants.length} {restaurants.length === 1 ? 'spot' : 'spots'} ranked
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <input
            type="text"
            placeholder="Search restaurants, dishes, neighborhoods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-white border border-cream-300 rounded-full px-4 py-2 text-sm text-warm-800 focus:outline-none focus:border-warm-400"
          />
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setCuisineFilter(c)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                cuisineFilter === c
                  ? 'bg-warm-400 text-white'
                  : 'bg-white border border-cream-300 text-warm-700 hover:border-warm-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-warm-700 py-12">loading delicious things...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-warm-700 text-lg mb-2">no restaurants yet 🍽️</p>
            <p className="text-warm-700 text-sm">sign in and add your first spot!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, idx) => (
              <Link key={r.id} href={`/restaurant/${r.id}`} className="bg-white border border-cream-300 rounded-2xl overflow-hidden hover:border-warm-400 transition">
                <div className="h-32 relative" style={{ background: r.photos?.[0] ? `url(${r.photos[0]}) center/cover` : '#F5C4A3' }}>
                  <span className="absolute top-2 left-2 bg-cream-100/95 text-warm-800 text-xs font-medium px-2 py-1 rounded-full">
                    #{idx + 1}
                  </span>
                  <span className="absolute top-2 right-2 bg-white text-warm-800 text-xs font-medium px-2 py-1 rounded-full border border-cream-300">
                    {r.total !== null ? `${r.total.toFixed(1)} / 10` : 'Unrated'}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-warm-900 mb-0.5">{r.name}</h3>
                  <p className="text-xs text-warm-700 mb-2">
                    {r.price || ''} {r.cuisine?.length ? `· ${r.cuisine.join(', ')}` : ''} {r.neighborhood ? `· ${r.neighborhood}` : ''}
                  </p>
                  {r.total !== null && (
                    <div className="flex flex-col gap-1 text-xs text-warm-700">
                      <ScoreBar label="food" value={r.avgFood} max={30} />
                      <ScoreBar label="vibe" value={r.avgVibe} max={10} />
                      <ScoreBar label="svc" value={r.avgService} max={10} />
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-cream-300 text-xs text-warm-700">
                    <span className="bg-cream-200 px-2 py-0.5 rounded-full">
                      {r.visitCount} {r.visitCount === 1 ? 'visit' : 'visits'}
                    </span>
                    <span>{r.ratingCount} {r.ratingCount === 1 ? 'rating' : 'ratings'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-10">{label}</span>
      <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
        <div className="h-full bg-warm-400 rounded-full" style={{ width: `${pct}%` }}></div>
      </div>
      <span className="font-medium text-warm-800 min-w-[28px] text-right">{value?.toFixed(1)}</span>
    </div>
  );
}
