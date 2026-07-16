import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VotingPanel from './VotingPanel';
import { makeParticipant, makeRoom, renderWithI18n } from '../test/test-utils';

describe('VotingPanel', () => {
  it('shows PM progress and reveal control', async () => {
    const user = userEvent.setup();
    const revealVotes = vi.fn();
    const room = makeRoom({
      phase: 'voting',
      participants: {
        'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
        'p-dev': makeParticipant({
          peerId: 'p-dev',
          name: 'Bruno',
          role: 'dev',
          hasVoted: true,
        }),
      },
    });

    renderWithI18n(
      <VotingPanel
        room={room}
        local={{ role: 'pm', peerId: 'p-pm', name: 'Ana' }}
        castVote={vi.fn()}
        revealVotes={revealVotes}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reveal|revelar|révéler/i }));
    expect(revealVotes).toHaveBeenCalled();
  });

  it('lets dev cast a vote from the deck', async () => {
    const user = userEvent.setup();
    const castVote = vi.fn();
    const room = makeRoom({
      phase: 'voting',
      participants: {
        'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
        'p-dev': makeParticipant({
          peerId: 'p-dev',
          name: 'Bruno',
          role: 'dev',
        }),
      },
    });

    renderWithI18n(
      <VotingPanel
        room={room}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        castVote={castVote}
        revealVotes={vi.fn()}
      />
    );

    await user.click(screen.getByRole('option', { name: '8' }));
    expect(castVote).toHaveBeenCalledWith('8');
  });

  it('shows selected vote badge for dev', () => {
    const room = makeRoom({
      phase: 'voting',
      _myVote: '5',
      participants: {
        'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
        'p-dev': makeParticipant({
          peerId: 'p-dev',
          name: 'Bruno',
          role: 'dev',
          hasVoted: true,
        }),
      },
    });

    renderWithI18n(
      <VotingPanel
        room={room}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno' }}
        castVote={vi.fn()}
        revealVotes={vi.fn()}
      />
    );

    expect(screen.getByText(/voted|votou|voté/i)).toBeInTheDocument();
  });
});
