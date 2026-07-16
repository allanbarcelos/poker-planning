import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  I18nProvider,
  useI18n,
  detectLocale,
  translate,
} from './I18nContext';

function Probe() {
  const { locale, setLocale, t, locales } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="tagline">{t('home.tagline')}</span>
      <span data-testid="named">{t('room.devLabel', { name: 'Ada' })}</span>
      <span data-testid="count">{locales.length}</span>
      <button type="button" onClick={() => setLocale('pt')}>
        pt
      </button>
      <button type="button" onClick={() => setLocale('xx')}>
        bad
      </button>
    </div>
  );
}

describe('detectLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefers saved locale', () => {
    localStorage.setItem('poker-planning-lang', 'fr');
    expect(detectLocale()).toBe('fr');
  });

  it('ignores unsupported saved locale', () => {
    localStorage.setItem('poker-planning-lang', 'de');
    vi.stubGlobal('navigator', {
      languages: ['en-US'],
      language: 'en-US',
    });
    expect(detectLocale()).toBe('en');
    vi.unstubAllGlobals();
  });

  it('matches browser language base code', () => {
    vi.stubGlobal('navigator', {
      languages: ['pt-BR', 'en'],
      language: 'pt-BR',
    });
    expect(detectLocale()).toBe('pt');
    vi.unstubAllGlobals();
  });

  it('falls back to English', () => {
    vi.stubGlobal('navigator', {
      languages: ['de-DE'],
      language: 'de-DE',
    });
    expect(detectLocale()).toBe('en');
    vi.unstubAllGlobals();
  });
});

describe('translate', () => {
  it('returns empty for null/empty', () => {
    expect(translate('en', null)).toBe('');
    expect(translate('en', '')).toBe('');
  });

  it('interpolates params', () => {
    expect(translate('en', 'room.devLabel', { name: 'Ada' })).toBe('Dev · Ada');
  });

  it('accepts structured message objects', () => {
    expect(
      translate('en', { key: 'status.userJoined', name: 'Bob' })
    ).toContain('Bob');
  });

  it('falls back to English then key', () => {
    expect(translate('pt', 'home.tabCreate')).toBeTruthy();
    expect(translate('en', 'missing.key.xyz')).toBe('missing.key.xyz');
  });

  it('stringifies unknown message shapes', () => {
    expect(translate('en', 42)).toBe('42');
  });

  it('keeps placeholder when param missing', () => {
    expect(translate('en', 'room.devLabel', {})).toBe('Dev · {name}');
  });
});

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('poker-planning-lang', 'en');
  });

  it('throws outside provider', () => {
    function Bad() {
      useI18n();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      /useI18n must be used within I18nProvider/
    );
  });

  it('provides locale, t and setLocale', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('named')).toHaveTextContent('Dev · Ada');
    expect(screen.getByTestId('count')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: 'pt' }));
    expect(screen.getByTestId('locale')).toHaveTextContent('pt');
    expect(localStorage.getItem('poker-planning-lang')).toBe('pt');
    expect(document.documentElement.lang).toBe('pt-BR');

    await user.click(screen.getByRole('button', { name: 'bad' }));
    expect(screen.getByTestId('locale')).toHaveTextContent('pt');
  });
});
