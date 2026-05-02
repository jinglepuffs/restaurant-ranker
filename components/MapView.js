'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView({ restaurants }) {
  const center = restaurants.length
    ? [
        restaurants.reduce((a, r) => a + Number(r.latitude), 0) / restaurants.length,
        restaurants.reduce((a, r) => a + Number(r.longitude), 0) / restaurants.length,
      ]
    : [1.3521, 103.8198];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants.map(r => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={icon}>
          <Popup>
            <strong>{r.name}</strong><br />
            {r.cuisine?.join(', ')}<br />
            <Link href={`/restaurant/${r.id}`} className="text-warm-500 underline">view details</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
