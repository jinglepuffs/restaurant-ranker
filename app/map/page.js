'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '../../lib/supabase';
import Header from '../../components/Header';

const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
  loading: () => <p className="text-center py-12 text-warm-700">loading map...</p>,
});

export default function MapPage() {
  const [restaurants, setRestaurants] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('restaurants').select('*').then(({ data }) => {
      setRestaurants((data || []).filter(r => r.latitude && r.longitude));
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-warm-800 mb-4">map view 📍</h1>
        {restaurants.length === 0 ? (
          <p className="text-warm-700 bg-white border border-cream-300 rounded-2xl p-6 text-center">
            no restaurants with map coordinates yet. add latitude & longitude when creating restaurants to see them here!
          </p>
        ) : (
          <div className="bg-white border border-cream-300 rounded-2xl p-4">
            <MapView restaurants={restaurants} />
          </div>
        )}
      </main>
    </div>
  );
}
