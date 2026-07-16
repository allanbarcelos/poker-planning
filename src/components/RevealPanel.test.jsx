import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RevealPanel from './RevealPanel';
import { makeParticipant, makeRoom, renderWithI18n } from '../test/test-utils';

function revealRoom(overrides = {}) {
  return makeRoom({
    phase: 'reveal',
    story: { title: 'Task', description: 'Desc' },
    stats: { average: 5, mode: '5', nearest: '5', count: 2 },
    participants: {
      'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
      'p-dev': makeParticipant({
        peerId: 'p-dev',
        name: 'Bruno',
        role: 'dev',
        vote: '5',
      }),
      'p-dev2': makeParticipant({
        peerId: 'p-dev2',
        name: 'Carla',
        role: 'dev',
        vote: '☕',
      }),
    },
    ...overrides,
  });
}

describe('RevealPanel', () => {
  it('shows stats and vote chips with coffee icon', () => {
    renderWithI18n(
      <RevealPanel
        room={revealRoom()}
        local={{ role: 'pm', peerId: 'p-pm', name: 'Ana' }}
        setFinalAndComment={vi.fn()}
        nextRound={vi.fn()}
      />
    );

    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(document.querySelectorAll('.bi-cup-hot').length).toBeGreaterThan(0);
  });

  it('lets PM save final score and start next round', async () => {
    const user = userEvent.setup();
    const setFinalAndComment = vi.fn();
    const nextRound = vi.fn();

    renderWithI18n(
      <RevealPanel
        room={revealRoom({ finalScore: '5' })}
        local={{ role: 'pm', peerId: 'p-pm', name: 'Ana' }}
        setFinalAndComment={setFinalAndComment}
        nextRound={nextRound}
      />
    );

    await user.type(
      screen.getByLabelText(/comment|comentário|commentaire/i),
      'Looks good'
    );
    await user.click(screen.getByRole('button', { name: /save|salvar|enregistrer/i }));
    expect(setFinalAndComment).toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /next|próxima|suivante/i })
    );
    expect(nextRound).toHaveBeenCalled();
  });

  it('shows waiting state for dev without PM comment', () => {
    renderWithI18n(
      <RevealPanel
        room={revealRoom({ pmComment: '' })}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        setFinalAndComment={vi.fn()}
        nextRound={vi.fn()}
      />
    );

    expect(screen.getByText(/waiting|aguardando|en attente/i)).toBeInTheDocument();
  });

  it('shows PM comment to devs', () => {
    renderWithI18n(
      <RevealPanel
        room={revealRoom({ pmComment: 'Ship it' })}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        setFinalAndComment={vi.fn()}
        nextRound={vi.fn()}
      />
    );

    expect(screen.getByText('Ship it')).toBeInTheDocument();
  });
});
