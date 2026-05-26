import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Locale } from '@/lib/types';

interface MapPlant {
  slug: string;
  nameDe: string;
  nameEn: string;
  latin: string;
  lat: number;
  lng: number;
  pointCount: number;
  bgCount?: number;
}

interface Props {
  plants: MapPlant[];
  locale: Locale;
}

const labels = {
  de: {
    title: 'Alle Pflanzen auf der Karte',
    subtitle: 'Repräsentativer GBIF-Punkt pro Pflanze in Europa. Klick auf Marker für Details.',
    view_details: 'Details ansehen',
    points: 'Datenpunkte',
  },
  en: {
    title: 'All plants on the map',
    subtitle: 'Representative GBIF point per plant in Europe. Click marker for details.',
    view_details: 'View details',
    points: 'data points',
  },
};

export default function OverviewMap({ plants, locale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const l = labels[locale];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([50, 10], 4);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    for (const p of plants) {
      const inBg = (p.bgCount ?? 0) > 0;
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: inBg ? 7 : 5,
        color: inBg ? '#c2410c' : '#047857',
        weight: 2,
        fillColor: inBg ? '#fb923c' : '#10b981',
        fillOpacity: 0.85,
      }).addTo(map);

      const displayName = locale === 'de' ? p.nameDe : p.nameEn;
      const bgLine = inBg
        ? `<div style="margin-top: 4px; font-size: 12px; color: #c2410c;">🇧🇬 ${p.bgCount} ${locale === 'de' ? 'Punkte in Bulgarien' : 'points in Bulgaria'}</div>`
        : '';
      const popup = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 15px; color: #0f172a;">${displayName}</div>
          <div style="font-style: italic; color: #64748b; font-size: 13px; margin-top: 2px;">${p.latin}</div>
          <div style="margin-top: 6px; font-size: 12px; color: #64748b;">${p.pointCount} ${l.points}</div>
          ${bgLine}
          <a href="/${locale}/plant/${p.slug}" style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: #047857; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">${l.view_details}</a>
        </div>
      `;
      marker.bindPopup(popup);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [plants, locale]);

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full h-[600px] rounded-lg border border-slate-200 overflow-hidden"
        aria-label="Overview map of all plants in Europe"
      />
    </div>
  );
}
