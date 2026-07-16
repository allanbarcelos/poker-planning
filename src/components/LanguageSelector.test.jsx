import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from './LanguageSelector';
import { renderWithI18n } from '../test/test-utils';

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.setItem('poker-planning-lang', 'en');
  });

  it('renders globe icon instead of emoji', () => {
    renderWithI18n(<LanguageSelector />);
    expect(document.querySelector('.bi-globe')).toBeInTheDocument();
    expect(screen.queryByText('🌐')).not.toBeInTheDocument();
  });

  it('lists locales and changes language', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSelector />);

    const select = screen.getByLabelText(/language|idioma|langue/i);
    expect(select).toHaveValue('en');

    await user.selectOptions(select, 'fr');
    expect(select).toHaveValue('fr');
    expect(localStorage.getItem('poker-planning-lang')).toBe('fr');
  });
});
