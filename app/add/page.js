'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase';
import Header from '../../components/Header';

export default function AddOrEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Header />
        <p className="text-center py-12 text-warm-700">Loading...</p>
      </div>
    }>
      <AddOrEditRestaurant />
    </Suspense>
  );
}

function AddOrEditRestaurant() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [price, setPrice] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dishes, setDishes] = useState('');
  const [notes, setNotes] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEditMode);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    supabase.from('restaurants').select('*').eq('id', editId).single().then(({ data, error }) => {
      if (error || !data) {
        setError('Restaurant not found');
        setInitialLoad(false);
        return;
      }
      setName(data.name || '');
      setCuisine((data.cuisine || []).join(', '));
      setPrice(data.price || '');
      setNeighborhood(data.neighborhood || '');
      setGoogleMaps(data.google_maps_url || '');
      setLatitude(data.latitude?.toString() || '');
      setLongitude(data.longitude?.toString() || '');
      setDishes(data.dishes_ordered || '');
      setNotes(data.notes || '');
      setExistingPhotos(data.photos || []);
      setInitialLoad(false);
    });
  }, [isEditMode, editId]);

  const handlePhotoSelect = (e) => {
    const remaining = 10 - existingPhotos.length - photoFiles.length;
    const files = Array.from(e.target.files).slice(0, remaining);
    setPhotoFiles([...photoFiles, ...files]);
  };

  const removeExistingPhoto = (url) => {
    setExistingPhotos(existingPhotos.filter(p => p !== url));
  };

  const removeNewPhoto = (idx) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const newPhotoUrls = [];
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
      newPhotoUrls.push(publicUrl);
    }

    const cuisineArr = cuisine.split(',').map(c => c.trim()).filter(Boolean);
    const allPhotos = [...existingPhotos, ...newPhotoUrls];

    const payload = {
      name,
      cuisine: cuisineArr,
      price: price || null,
      neighborhood: neighborhood || null,
      google_maps_url: googleMaps || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      dishes_ordered: dishes || null,
      notes: notes || null,
      photos: allPhotos,
    };

    let dbError;
    if (isEditMode) {
      const { error } = await supabase.from('restaurants').update(payload).eq('id', editId);
      dbError = error;
    } else {
      const { error } = await supabase.from('restaurants').insert({ ...payload, created_by: user.id });
      dbError = error;
    }

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
    } else {
      router.push(isEditMode ? `/restaurant/${editId}` : '/');
    }
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen">
        <Header />
        <p className="text-center py-12 text-warm-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-warm-800 mb-6">
          {isEditMode ? 'Edit Restaurant ✏️' : 'Add a Restaurant 🍽️'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white border border-cream-300 rounded-2xl p-6 flex flex-col gap-4">
          <Field label="Name *">
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="Cuisine (comma separated, e.g. italian, pizza)">
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="Price">
            <select value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400">
              <option value="">—</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </Field>

          <Field label="Neighborhood">
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="Google Maps Link">
            <input value={googleMaps} onChange={(e) => setGoogleMaps(e.target.value)} placeholder="https://maps.app.goo.gl/..."
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude (for map pin)">
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="1.3521"
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
            </Field>
            <Field label="Longitude (for map pin)">
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="103.8198"
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
            </Field>
          </div>
          <p className="text-xs text-warm-700 -mt-2">Tip: right-click on Google Maps → click the coordinates to copy them</p>

          <Field label="Dishes Ordered">
            <textarea value={dishes} onChange={(e) => setDishes(e.target.value)} rows={2}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-2 focus:outline-none focus:border-warm-400" />
          </Field>

          {existingPhotos.length > 0 && (
            <div>
              <label className="text-sm font-medium text-warm-800">Existing Photos</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                    <button type="button" onClick={() => removeExistingPhoto(url)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center hover:bg-red-600">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Field label={`${isEditMode ? 'Add More Photos' : 'Photos'} (up to 10 total) — ${existingPhotos.length + photoFiles.length} total, ${photoFiles.length} new`}>
            <input type="file" multiple accept="image/*" onChange={handlePhotoSelect}
              className="w-full text-sm text-warm-700" />
          </Field>

          {photoFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photoFiles.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-20 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeNewPhoto(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            {isEditMode && (
              <button type="button" onClick={() => router.push(`/restaurant/${editId}`)}
                className="flex-1 bg-cream-200 text-warm-800 rounded-full py-2 font-medium hover:bg-cream-300 transition">
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading}
              className="flex-1 bg-warm-500 text-white rounded-full py-2 font-medium hover:bg-warm-600 transition disabled:opacity-50">
              {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Restaurant')}
            </button>
          </div>
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
