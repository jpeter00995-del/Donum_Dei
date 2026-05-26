import { describe, it, expect } from 'vitest';
import { t, otherLocale } from './i18n';

describe('t (UI string lookup)', () => {
  it('returns DE string by default', () => {
    expect(t('de', 'filter.use')).toBe('Verwendung');
  });
  it('returns EN string when locale is en', () => {
    expect(t('en', 'filter.use')).toBe('Use');
  });
  it('falls back to key if string missing', () => {
    expect(t('de', 'nonexistent.key')).toBe('nonexistent.key');
  });
  it('interpolates params', () => {
    expect(t('de', 'filter.counter', { count: 3, total: 7 })).toBe('3 von 7 Pflanzen');
  });
});

describe('otherLocale', () => {
  it('swaps de to en', () => {
    expect(otherLocale('de')).toBe('en');
  });
  it('swaps en to de', () => {
    expect(otherLocale('en')).toBe('de');
  });
});
