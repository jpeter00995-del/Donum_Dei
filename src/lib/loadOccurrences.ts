export type OccurrencePoint = {
  lat: number;
  lng: number;
  country?: string;
  year?: number | null;
};

export type PlantOccurrences = {
  slug: string;
  taxon_key: number;
  taxon_name: string;
  total_count_in_europe: number;
  points_sampled: number;
  points: OccurrencePoint[];
  bulgaria_points?: OccurrencePoint[];
  bulgaria_total_count?: number;
  bulgaria_accessed?: string;
  source: string;
  source_url: string;
  accessed: string;
};

// Build-time loader: lazy-load occurrence files (one per plant, optional).
const modules = import.meta.glob<{ default: PlantOccurrences }>(
  '../data/occurrences/*.json',
  { eager: true }
);

const bySlug: Map<string, PlantOccurrences> = new Map();
for (const [path, mod] of Object.entries(modules)) {
  const slug = path.split('/').pop()!.replace('.json', '');
  bySlug.set(slug, mod.default);
}

export function loadOccurrencesBySlug(slug: string): PlantOccurrences | null {
  return bySlug.get(slug) ?? null;
}
