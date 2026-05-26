// === 1. IMPORTS ===
import { useState } from 'react';
import type { Plant, Locale, IndoorRoom, IndoorPurpose } from '@/lib/types';
import IndoorCards from './IndoorCards';

// === 2. PROPS ===
interface Props {
  plants: Plant[];
  locale: Locale;
}

// === 3. FILTER-LABEL-TABELLEN ===
const ROOMS_DE: Record<IndoorRoom, string> = {
  kitchen: 'Küche',
  living_room: 'Wohnz.',
  bathroom: 'Bad',
  bedroom: 'Schlafz.',
  balcony: 'Balkon',
};

const ROOMS_EN: Record<IndoorRoom, string> = {
  kitchen: 'Kitchen',
  living_room: 'Living',
  bathroom: 'Bath',
  bedroom: 'Bedroom',
  balcony: 'Balcony',
};

const PURPOSES_DE: Record<IndoorPurpose, string> = {
  medicinal: 'Heilen',
  edible: 'Küche',
  air_purifying: 'Luftreinigung',
  pest_repelling: 'Mücken',
  humidifying: 'Befeuchter',
  night_oxygen: 'Nacht-O₂',
  ornamental: 'Deko',
};

const PURPOSES_EN: Record<IndoorPurpose, string> = {
  medicinal: 'Medicinal',
  edible: 'Culinary',
  air_purifying: 'Air-purify',
  pest_repelling: 'Mosquito',
  humidifying: 'Humidify',
  night_oxygen: 'Night-O₂',
  ornamental: 'Decorative',
};

// === 4. KOMPONENTE ===
export default function IndoorFilterBar({ plants, locale }: Props) {
  // === 4a. STATE ===
  const [room, setRoom] = useState<IndoorRoom | null>(null);
  const [petSafeOnly, setPetSafeOnly] = useState(false);
  const [activePurposes, setActivePurposes] = useState<Set<IndoorPurpose>>(new Set());

  const ROOMS = locale === 'de' ? ROOMS_DE : ROOMS_EN;
  const PURPOSES = locale === 'de' ? PURPOSES_DE : PURPOSES_EN;

  // === 4b. ZWECK-TOGGLE ===
  const togglePurpose = (p: IndoorPurpose) => {
    setActivePurposes(s => {
      const next = new Set(s);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  // === 4c. FILTER-LOGIK ===
  const filtered = plants.filter(p => {
    const ig = p.indoor_growing!;
    if (room && !ig.rooms.includes(room)) return false;
    if (petSafeOnly && !ig.pet_safe) return false;
    if (activePurposes.size > 0 && !ig.purpose.some(pur => activePurposes.has(pur))) return false;
    return true;
  });

  return (
    <div>
      {/* === Filter-Panel === */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Raum-Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-semibold text-sm mr-2">
            {locale === 'de' ? 'Raum:' : 'Room:'}
          </span>
          {(Object.entries(ROOMS) as [IndoorRoom, string][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setRoom(r => (r === k ? null : k))}
              className={`px-3 py-1 text-sm rounded-full border transition ${
                room === k
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Zweck-Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-semibold text-sm mr-2">
            {locale === 'de' ? 'Zweck:' : 'Purpose:'}
          </span>
          {(Object.entries(PURPOSES) as [IndoorPurpose, string][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => togglePurpose(k)}
              className={`px-3 py-1 text-sm rounded-full border transition ${
                activePurposes.has(k)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Haustier-sicher Checkbox */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={petSafeOnly}
            onChange={e => setPetSafeOnly(e.target.checked)}
          />
          🐾 {locale === 'de' ? 'Nur haustier-sicher' : 'Pet-safe only'}
        </label>
      </div>

      {/* === Ergebnis-Zähler === */}
      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} {locale === 'de' ? 'von' : 'of'} {plants.length}{' '}
        {locale === 'de' ? 'Pflanzen' : 'plants'}
      </p>

      {/* === Karten-Grid === */}
      <IndoorCards plants={filtered} locale={locale} />
    </div>
  );
}
