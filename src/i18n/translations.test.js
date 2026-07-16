import { describe, it, expect } from 'vitest';
import {
  LOCALES,
  DEFAULT_LOCALE,
  translations,
} from './translations';

describe('translations', () => {
  it('lists supported locales', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['en', 'pt', 'fr']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('keeps the same keys across locales', () => {
    const enKeys = Object.keys(translations.en).sort();
    for (const code of ['pt', 'fr']) {
      expect(Object.keys(translations[code]).sort()).toEqual(enKeys);
    }
  });

  it('has non-empty strings for every key', () => {
    for (const [locale, dict] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, `${locale}:${key}`).toBeTypeOf('string');
        expect(value.length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('uses consistent placeholder names across locales', () => {
    const placeholderRe = /\{(\w+)\}/g;
    for (const key of Object.keys(translations.en)) {
      const enParams = [
        ...translations.en[key].matchAll(placeholderRe),
      ].map((m) => m[1]).sort();
      for (const code of ['pt', 'fr']) {
        const params = [
          ...translations[code][key].matchAll(placeholderRe),
        ].map((m) => m[1]).sort();
        expect(params, `${code}:${key}`).toEqual(enParams);
      }
    }
  });
});
