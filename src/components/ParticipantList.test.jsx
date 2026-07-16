import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import ParticipantList from './ParticipantList';
import { makeParticipant, makeRoom, renderWithI18n } from '../test/test-utils';

describe('ParticipantList', () => {
  it('lists PM and devs with badges', () => {
    const room = makeRoom({
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
      <ParticipantList
        room={room}
        local={{ peerId: 'p-pm', role: 'pm', name: 'Ana' }}
      />
    );

    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    expect(screen.getByText(/Bruno/)).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText(/\(you\)/i)).toBeInTheDocument();
  });

  it('shows vote progress during voting', () => {
    const room = makeRoom({
      phase: 'voting',
      participants: {
        'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
        'p-dev1': makeParticipant({
          peerId: 'p-dev1',
          name: 'B',
          role: 'dev',
          hasVoted: true,
        }),
        'p-dev2': makeParticipant({
          peerId: 'p-dev2',
          name: 'C',
          role: 'dev',
          hasVoted: false,
        }),
      },
    });

    renderWithI18n(
      <ParticipantList
        room={room}
        local={{ peerId: 'p-pm', role: 'pm', name: 'Ana' }}
      />
    );

    expect(screen.getByText(/1\/2|1 \/ 2/i)).toBeInTheDocument();
  });

  it('reveals votes in reveal phase including coffee icon', () => {
    const room = makeRoom({
      phase: 'reveal',
      participants: {
        'p-pm': makeParticipant({ peerId: 'p-pm', name: 'Ana', role: 'pm' }),
        'p-dev': makeParticipant({
          peerId: 'p-dev',
          name: 'Bruno',
          role: 'dev',
          vote: '☕',
        }),
      },
    });

    renderWithI18n(
      <ParticipantList
        room={room}
        local={{ peerId: 'p-pm', role: 'pm', name: 'Ana' }}
      />
    );

    expect(document.querySelector('.bi-cup-hot')).toBeInTheDocument();
  });

  it('shows waiting message when no devs', () => {
    renderWithI18n(
      <ParticipantList
        room={makeRoom()}
        local={{ peerId: 'p-pm', role: 'pm', name: 'Ana' }}
      />
    );
    expect(screen.getByText(/waiting|aguardando|en attente/i)).toBeInTheDocument();
  });
});
