import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ServiceLocation {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ServiceLocationsMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['service-locations-public'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('service_locations')
        .select('id, name, description, latitude, longitude')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ServiceLocation[];
    },
  });

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const bounds = L.latLngBounds(locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]));

    locations.forEach((loc) => {
      const popupHtml = `
        <div style="font-size: 0.875rem; line-height: 1.4; min-width: 180px;">
          <strong style="display:block; margin-bottom: 0.25rem;">${escapeHtml(loc.name)}</strong>
          ${loc.description ? `<p style="margin: 0 0 0.5rem; color: hsl(var(--muted-foreground));">${escapeHtml(loc.description)}</p>` : ''}
          <a
            href="https://www.google.com/maps?q=${loc.latitude},${loc.longitude}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-flex; align-items:center; gap:0.25rem; font-weight:500; text-decoration:none; color:hsl(var(--primary));"
          >
            Open in Google Maps
          </a>
        </div>
      `;

      L.marker([loc.latitude, loc.longitude]).addTo(map).bindPopup(popupHtml);
    });

    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 13);
    } else {
      map.fitBounds(bounds, { padding: [32, 32] });
    }

    return () => {
      map.remove();
    };
  }, [locations]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: locations.map((loc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Place',
          name: loc.name,
          description: loc.description || undefined,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: loc.latitude,
            longitude: loc.longitude,
          },
        },
      })),
    }),
    [locations]
  );

  if (isLoading) {
    return (
      <section aria-label="Service areas map" className="mt-12">
        <h2 className="text-3xl font-bold text-forest-800 text-center mb-6">Our Service Areas</h2>
        <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
      </section>
    );
  }

  if (locations.length === 0) return null;

  return (
    <section aria-label="Service areas map" className="mt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-3xl font-bold text-forest-800 text-center mb-2">Our Service Areas</h2>
      <p className="text-center text-forest-600 mb-6">
        Click on any marker to learn more and get directions via Google Maps.
      </p>
      <div className="rounded-xl overflow-hidden shadow-lg border border-border" style={{ height: 400 }}>
        <div
          ref={mapRef}
          aria-label="Interactive map showing service areas"
          className="h-full w-full"
        />
      </div>
      <noscript>
        <div>
          <h3>Our Service Areas</h3>
          <ul>
            {locations.map((loc) => (
              <li key={loc.id}>
                <a href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}>
                  {loc.name}{loc.description ? ` — ${loc.description}` : ''}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </noscript>
    </section>
  );
};

export default ServiceLocationsMap;
