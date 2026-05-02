'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase';
import Header from '../../components/Header';

export default function AddRestaurant() {
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [price, setPrice] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dishes, setDishes] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
    });
  }, []);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - photoFiles.length);
    setPhotoFiles([...photoFiles, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const photoUrls = [];
    for (const file of photoFiles) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('restaurant-photos').upload(fileName, file);
      if (uploadErr) {
        setError('Photo upload failed: ' + uploadErr.message);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-photos').getPublicUrl(fileName);
      photoUrls.push(publicUrl);
    }

    const cuisineArr = cuisine.split(',').map(c => c.trim()).filter(Boolean);

    const { error: insertErr } = await supabase.from('restaurants').insert({
      name,
      cuisine: cuisineArr,
      price: price || null,
      neighborhood: neighborhood || null,
      google_maps_url: googleMaps || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      dishes_ordered: dishes || null,
      notes: notes || null,
      photos: photoUrls,
      created_by: user.id,
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-warm-800 mb-6">add a restaurant 🍽️</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-cream-300 rounded-2xl p-6 flex flex-col gap-4">
          <Field label="name *">
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="cuisine (comma separated, e.g. italian, pizza)">
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="price">
            <select value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400">
              <option value="">—</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </Field>

          <Field label="neighborhood">
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="google maps link">
            <input value={googleMaps} onChange={(e) => setGoogleMaps(e.target.value)} placeholder="https://maps.app.goo.gl/..."
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="latitude (for map pin)">
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="1.3521"
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
            </Field>
            <Field label="longitude (for map pin)">
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="103.8198"
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
            </Field>
          </div>
          <p className="text-xs text-warm-700 -mt-2">tip: right-click on google maps → click the coordinates to copy them</p>

          <Field label="dishes ordered">
            <textarea value={dishes} onChange={(e) => setDishes(e.target.value)} rows={2}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label={`photos (up to 10) — ${photoFiles.length} selected`}>
            <input type="file" multiple accept="image/*" onChange={handlePhotoSelect}
              className="w-full text-sm text-warm-700" />
          </Field>

          {error && <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="bg-warm-500 text-white rounded-full py-2 font-medium hover:bg-warm-600 transition disabled:opacity-50">
            {loading ? 'adding...' : 'add restaurant'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-warm-800">{label}</span>
      {children}
    </label>
  );
}
