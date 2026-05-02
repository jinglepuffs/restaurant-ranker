'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase';
import Header from '../../../components/Header';

export default function RestaurantDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  // Rating form
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [food, setFood] = useState('');
  const [vibe, setVibe] = useState('');
  const [service, setService] = useState('');

  // Visit form
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [whoCame, setWhoCame] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const fetchAll = async () => {
    const { data: r } = await supabase.from('restaurants').select('*').eq('id', id).single();
    const { data: rs } = await supabase.from('ratings').select('*').eq('restaurant_id', id);
    const { data: vs } = await supabase.from('visits').select('*').eq('restaurant_id', id).order('visit_date', { ascending: false });
    setRestaurant(r);
    setRatings(rs || []);
    setVisits(vs || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchAll();
    const channel = supabase.channel(`restaurant-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const submitRating = async (e) => {
    e.preventDefault();
    const raterName = user.user_metadata?.display_name || user.email.split('@')[0];
    const existing = ratings.find(r => r.rater_id === user.id);

    const payload = {
      restaurant_id: id,
      rater_id: user.id,
      rater_name: raterName,
      food_score: parseFloat(food),
      vibe_score: parseFloat(vibe),
      service_score: parseFloat(service),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('ratings').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('ratings').insert(payload);
    }
    setFood(''); setVibe(''); setService('');
    setShowRatingForm(false);
    fetchAll();
  };

  const submitVisit = async (e) => {
    e.preventDefault();
    const who = whoCame.split(',').map(s => s.trim()).filter(Boolean);
    await supabase.from('visits').insert({
      restaurant_id: id,
      visit_date: visitDate,
      who_came: who,
      quick_notes: visitNotes || null,
      logged_by: user.id,
    });
    setWhoCame(''); setVisitNotes('');
    setShowVisitForm(false);
    fetchAll();
  };

  const deleteRestaurant = async () => {
    if (!confirm('Delete this restaurant? All ratings and visits will be removed too.')) return;
    await supabase.from('restaurants').delete().eq('id', id);
    router.push('/');
  };

  if (loading) return <div className="min-h-screen"><Header /><p className="text-center py-12 text-warm-700">loading...</p></div>;
  if (!restaurant) return <div className="min-h-screen"><Header /><p className="text-center py-12 text-warm-700">restaurant not found</p></div>;

 const avgFood = ratings.length ? ratings.reduce((a, b) => a + Number(b.food_score), 0) / ratings.length : null;
 const avgVibe = ratings.length ? ratings.reduce((a, b) => a + Number(b.vibe_score), 0) / ratings.length : null;
 const avgService = ratings.length ? ratings.reduce((a, b) => a + Number(b.service_score), 0) / ratings.length : null;
 const total = avgFood !== null ? (avgFood * 3 + avgVibe + avgService) / 5 : null;
  const myRating = user && ratings.find(r => r.rater_id === user.id);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Back link */}
        <button onClick={() => router.push('/')} className="text-warm-700 hover:text-warm-500 text-sm mb-4">
          ← back to all
        </button>

        {/* Header */}
        <div className="bg-white border border-cream-300 rounded-2xl p-6 mb-4">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
            <div>
              <h1 className="text-3xl font-bold text-warm-900">{restaurant.name}</h1>
              <p className="text-warm-700 mt-1">
                {restaurant.price || ''} {restaurant.cuisine?.length ? `· ${restaurant.cuisine.join(', ')}` : ''}
                {restaurant.neighborhood ? ` · ${restaurant.neighborhood}` : ''}
              </p>
            </div>
            {total !== null && (
              <div className="bg-warm-400 text-white rounded-2xl px-4 py-2 text-center">
                <div className="text-2xl font-bold">{total.toFixed(1)}</div>
                <div className="text-xs opacity-90">/ 10</div>
              </div>
            )}
          </div>

          {restaurant.google_maps_url && (
            <a href={restaurant.google_maps_url} target="_blank" rel="noreferrer"
              className="inline-block bg-cream-200 text-warm-800 text-sm px-3 py-1.5 rounded-full hover:bg-cream-300 mt-2">
              📍 open in google maps
            </a>
          )}
          {user && (
            <button onClick={deleteRestaurant} className="ml-2 text-xs text-red-700 hover:underline">delete restaurant</button>
          )}
        </div>

        {/* Photos */}
        {restaurant.photos?.length > 0 && (
          <div className="bg-white border border-cream-300 rounded-2xl p-4 mb-4">
            <h2 className="text-warm-800 font-medium mb-3">📸 photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {restaurant.photos.map((url, i) => (
                <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                  className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90" />
              ))}
            </div>
          </div>
        )}

        {/* Dishes & notes */}
        {(restaurant.dishes_ordered || restaurant.notes) && (
          <div className="bg-white border border-cream-300 rounded-2xl p-4 mb-4 space-y-3">
            {restaurant.dishes_ordered && (
              <div>
                <h3 className="text-warm-800 font-medium mb-1">🍴 dishes ordered</h3>
                <p className="text-warm-700 whitespace-pre-wrap">{restaurant.dishes_ordered}</p>
              </div>
            )}
            {restaurant.notes && (
              <div>
                <h3 className="text-warm-800 font-medium mb-1">📝 notes</h3>
                <p className="text-warm-700 whitespace-pre-wrap">{restaurant.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Ratings */}
        <div className="bg-white border border-cream-300 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-warm-800 font-medium">⭐ ratings</h2>
            {user && (
              <button onClick={() => {
                if (myRating) { setFood(myRating.food_score); setVibe(myRating.vibe_score); setService(myRating.service_score); }
                setShowRatingForm(!showRatingForm);
              }} className="bg-warm-500 text-white text-sm px-3 py-1.5 rounded-full hover:bg-warm-600">
                {myRating ? 'update my rating' : '+ add my rating'}
              </button>
            )}
          </div>

          {showRatingForm && (
            <form onSubmit={submitRating} className="bg-cream-100 rounded-xl p-3 mb-3 grid grid-cols-3 gap-2 items-end">
              <label className="flex flex-col text-xs text-warm-700">food (/10)
                <input type="number" min="0" max="30" step="0.5" required value={food} onChange={(e) => setFood(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <label className="flex flex-col text-xs text-warm-700">vibe (/10)
                <input type="number" min="0" max="10" step="0.5" required value={vibe} onChange={(e) => setVibe(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <label className="flex flex-col text-xs text-warm-700">service (/10)
                <input type="number" min="0" max="10" step="0.5" required value={service} onChange={(e) => setService(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <button type="submit" className="col-span-3 bg-warm-500 text-white rounded-full py-1.5 text-sm hover:bg-warm-600">save</button>
            </form>
          )}

          {ratings.length === 0 ? (
            <p className="text-warm-700 text-sm">no ratings yet</p>
          ) : (
            <div className="space-y-2">
              {ratings.map(r => (
                <div key={r.id} className="flex justify-between items-center text-sm border-b border-dashed border-cream-300 pb-2 last:border-0">
                  <span className="font-medium text-warm-800">{r.rater_name}</span>
                  <span className="text-warm-700">
                    {r.food_score} × 3 + {r.vibe_score} + {r.service_score} =
                    <span className="font-medium text-warm-800 ml-1">{((Number(r.food_score) * 3 + Number(r.vibe_score) + Number(r.service_score)) / 5).toFixed(1)} / 10</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visits */}
        <div className="bg-white border border-cream-300 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-warm-800 font-medium">📅 visits ({visits.length})</h2>
            {user && (
              <button onClick={() => setShowVisitForm(!showVisitForm)}
                className="bg-warm-500 text-white text-sm px-3 py-1.5 rounded-full hover:bg-warm-600">
                + log visit
              </button>
            )}
          </div>

          {showVisitForm && (
            <form onSubmit={submitVisit} className="bg-cream-100 rounded-xl p-3 mb-3 flex flex-col gap-2">
              <label className="flex flex-col text-xs text-warm-700">date
                <input type="date" required value={visitDate} onChange={(e) => setVisitDate(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <label className="flex flex-col text-xs text-warm-700">who came (comma separated)
                <input value={whoCame} onChange={(e) => setWhoCame(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <label className="flex flex-col text-xs text-warm-700">notes
                <textarea rows={2} value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)}
                  className="bg-white border border-cream-300 rounded-lg px-2 py-1 mt-1" /></label>
              <button type="submit" className="bg-warm-500 text-white rounded-full py-1.5 text-sm hover:bg-warm-600">log it</button>
            </form>
          )}

          {visits.length === 0 ? (
            <p className="text-warm-700 text-sm">no visits logged yet</p>
          ) : (
            <div className="space-y-2">
              {visits.map(v => (
                <div key={v.id} className="text-sm border-b border-dashed border-cream-300 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-warm-800">{new Date(v.visit_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                    {v.who_came?.length > 0 && <span className="text-warm-700">with {v.who_came.join(', ')}</span>}
                  </div>
                  {v.quick_notes && <p className="text-warm-700 text-xs mt-1">{v.quick_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer">
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
