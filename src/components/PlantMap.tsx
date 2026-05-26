import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Locale } from '@/lib/types';

interface MapPoint {
  lat: number;
  lng: number;
}

interface Props {
  points: MapPoint[];
  bulgariaPoints?: MapPoint[];
  plantName: string;
  locale: Locale;
}

const labels = {
  de: {
    no_data: 'Keine Verbreitungsdaten verfügbar.',
    europe_points: 'Datenpunkte in Europa',
    bulgaria_points: 'davon in Bulgarien',
    source: 'Quelle: GBIF',
  },
  en: {
    no_data: 'No distribution data available.',
    europe_points: 'data points in Europe',
    bulgaria_points: 'of which in Bulgaria',
    source: 'Source: GBIF',
  },
};

export default function PlantMap({ points, bulgariaPoints = [], plantName, locale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const l = labels[locale];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (points.length === 0 && bulgariaPoints.length === 0) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Europe points (green, smaller)
    for (const p of points) {
      L.circleMarker([p.lat, p.lng], {
        radius: 3,
        color: '#047857',
        weight: 1,
        fillColor: '#10b981',
        fillOpacity: 0.6,
      }).addTo(map);
    }
    // Bulgaria points (orange, larger, drawn on top)
    for (const p of bulgariaPoints) {
      L.circleMarker([p.lat, p.lng], {
        radius: 5,
        color: '#c2410c',
        weight: 1.5,
        fillColor: '#fb923c',
        fillOpacity: 0.85,
      }).addTo(map);
    }

    const allPoints = [...points, ...bulgariaPoints];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 7 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, bulgariaPoints]);

  if (points.length === 0 && bulgariaPoints.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-sm text-slate-600">
        {labels[locale].no_data}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full h-96 rounded-lg border border-slate-200 overflow-hidden"
        aria-label={`Map showing GBIF distribution of ${plantName} in Europe`}
      />
      <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 align-middle"></span>
          {points.length} {l.europe_points}
        </span>
        {bulgariaPoints.length > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1 align-middle"></span>
            {bulgariaPoints.length} {l.bulgaria_points}
          </span>
        )}
        <span>
          ·{' '}
          <a
            href={`https://www.gbif.org/occurrence/search?q=${encodeURIComponent(plantName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {l.source}
          </a>
        </span>
      </p>
    </div>
  );
}
