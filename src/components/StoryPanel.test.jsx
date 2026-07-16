import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryPanel from './StoryPanel';
import { makeRoom, renderWithI18n } from '../test/test-utils';

describe('StoryPanel', () => {
  it('lets PM publish story and open voting', async () => {
    const user = userEvent.setup();
    const setStory = vi.fn();
    const openVoting = vi.fn();
    const room = makeRoom({
      phase: 'story',
      story: { title: 'Login', description: 'As a user…' },
    });

    renderWithI18n(
      <StoryPanel
        room={room}
        local={{ role: 'pm', peerId: 'p-pm', name: 'Ana' }}
        setStory={setStory}
        openVoting={openVoting}
      />
    );

    await user.clear(screen.getByLabelText(/title|título|titre/i));
    await user.type(screen.getByLabelText(/title|título|titre/i), 'Checkout');
    await user.click(screen.getByRole('button', { name: /send|enviar|envoyer/i }));
    expect(setStory).toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /open voting|abrir votação|ouvrir/i })
    );
    expect(openVoting).toHaveBeenCalled();
  });

  it('shows read-only story for devs', () => {
    const room = makeRoom({
      phase: 'story',
      story: { title: 'Auth', description: 'OAuth flow' },
    });

    renderWithI18n(
      <StoryPanel
        room={room}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        setStory={vi.fn()}
        openVoting={vi.fn()}
      />
    );

    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText('OAuth flow')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows empty state when no story', () => {
    renderWithI18n(
      <StoryPanel
        room={makeRoom({ phase: 'story' })}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        setStory={vi.fn()}
        openVoting={vi.fn()}
      />
    );
    expect(screen.getByText(/not sent|ainda não|pas encore/i)).toBeInTheDocument();
  });
});
