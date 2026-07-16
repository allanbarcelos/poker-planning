import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  translations,
} from './translations';

const STORAGE_KEY = 'poker-planning-lang';
const SUPPORTED = LOCALES.map((l) => l.code);

const I18nContext = createContext(null);

/**
 * Detect preferred language: saved choice → browser languages → English default.
 * Matches base codes (pt-BR → pt, fr-FR → fr, en-US → en).
 */
export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    /* ignore */
  }

  const candidates =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages || []), navigator.language].filter(Boolean)
      : [];

  for (const tag of candidates) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (SUPPORTED.includes(base)) return base;
  }

  return DEFAULT_LOCALE;
}

function interpolate(template, params = {}) {
  if (!params || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] != null ? String(params[key]) : `{${key}}`
  );
}

/**
 * Resolve a message key or structured message { key, ...params }.
 * Falls back to English, then to the key itself.
 */
export function translate(locale, message, extraParams) {
  if (message == null || message === '') return '';

  let key;
  let params = extraParams || {};

  if (typeof message === 'string') {
    key = message;
  } else if (typeof message === 'object' && message.key) {
    key = message.key;
    params = { ...message, ...extraParams };
    delete params.key;
  } else {
    return String(message);
  }

  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  const fallback = translations[DEFAULT_LOCALE];
  const template = dict[key] ?? fallback[key] ?? key;
  return interpolate(template, params);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang =
      locale === 'pt' ? 'pt-BR' : locale === 'fr' ? 'fr' : 'en';
  }, [locale]);

  const t = useCallback(
    (message, params) => translate(locale, message, params),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      locales: LOCALES,
    }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
