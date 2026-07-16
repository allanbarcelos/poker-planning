import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardDeck from './CardDeck';
import { renderWithI18n } from '../test/test-utils';
import { DECK } from '../lib/constants';

describe('CardDeck', () => {
  it('renders all deck cards', () => {
    renderWithI18n(<CardDeck selected={null} onSelect={vi.fn()} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(DECK.length);
  });

  it('marks selected card and calls onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithI18n(<CardDeck selected="5" onSelect={onSelect} />);

    const five = screen.getByRole('option', { name: '5' });
    expect(five).toHaveAttribute('aria-selected', 'true');
    expect(five).toHaveClass('selected');

    await user.click(screen.getByRole('option', { name: '8' }));
    expect(onSelect).toHaveBeenCalledWith('8');
  });

  it('renders coffee as bootstrap icon', () => {
    renderWithI18n(<CardDeck selected={null} onSelect={vi.fn()} />);
    expect(document.querySelector('.bi-cup-hot')).toBeInTheDocument();
  });

  it('disables all cards when disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithI18n(
      <CardDeck selected={null} onSelect={onSelect} disabled />
    );

    for (const option of screen.getAllByRole('option')) {
      expect(option).toBeDisabled();
    }
    await user.click(screen.getAllByRole('option')[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights suggested card', () => {
    renderWithI18n(
      <CardDeck selected={null} onSelect={vi.fn()} highlight="13" />
    );
    expect(screen.getByRole('option', { name: '13' })).toHaveClass('highlight');
  });
});
