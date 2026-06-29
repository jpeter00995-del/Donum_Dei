// === Donum Dei — Tests für Latin→Slug-Matching ===
import { describe, it, expect } from 'vitest';
import { normalizeLatin, buildLatinIndex, matchSlug } from './plantMatch';

describe('normalizeLatin', () => {
  it('lowercased Gattung + Art', () => {
    expect(normalizeLatin('Actaea racemosa')).toBe('actaea racemosa');
    expect(normalizeLatin('ACTAEA RACEMOSA')).toBe('actaea racemosa');
  });

  it('schneidet Autor-Kürzel ab', () => {
    expect(normalizeLatin('Actaea racemosa L.')).toBe('actaea racemosa');
    expect(normalizeLatin('Actaea racemosa (L.) Nutt.')).toBe('actaea racemosa');
  });

  it('entfernt Hybrid-Zeichen (× und ascii x)', () => {
    expect(normalizeLatin('Actaea × hybrida')).toBe('actaea hybrida');
    expect(normalizeLatin('Salix x rubens')).toBe('salix rubens');
  });

  it('kürzt Subspecies/Varietät auf Gattung + Art', () => {
    expect(normalizeLatin('Taraxacum officinale subsp. vulgare')).toBe('taraxacum officinale');
    expect(normalizeLatin('Thymus vulgaris var. citriodorus')).toBe('thymus vulgaris');
  });

  it('entfernt Diakritika', () => {
    expect(normalizeLatin('Achilléa millefólium')).toBe('achillea millefolium');
  });

  it('leerer/ungültiger Input → leerer String', () => {
    expect(normalizeLatin('')).toBe('');
    expect(normalizeLatin('   ')).toBe('');
  });
});

describe('buildLatinIndex + matchSlug', () => {
  const plants = [
    { slug: 'actaea-racemosa', names: { latin: 'Actaea racemosa' } },
    { slug: 'achillea-millefolium', names: { latin: 'Achillea millefolium' } },
    { slug: 'taraxacum-officinale', names: { latin: 'Taraxacum officinale' } },
  ];
  const index = buildLatinIndex(plants);

  it('exakter Treffer', () => {
    expect(matchSlug('Achillea millefolium', index)).toBe('achillea-millefolium');
  });

  it('Treffer trotz Autor-Kürzel aus Pl@ntNet', () => {
    expect(matchSlug('Actaea racemosa L.', index)).toBe('actaea-racemosa');
  });

  it('Treffer trotz Subspecies-Suffix', () => {
    expect(matchSlug('Taraxacum officinale subsp. vulgare', index)).toBe('taraxacum-officinale');
  });

  it('kein Treffer → null', () => {
    expect(matchSlug('Urtica dioica', index)).toBeNull();
    expect(matchSlug('', index)).toBeNull();
  });

  it('ignoriert Einträge ohne lateinischen Namen', () => {
    const idx = buildLatinIndex([{ slug: 'x', names: { latin: null } }]);
    expect(Object.keys(idx)).toHaveLength(0);
  });
});
