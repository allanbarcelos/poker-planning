import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Room from './Room';
import { makeParticipant, makeRoom, renderWithI18n } from '../test/test-utils';

const baseProps = {
  status: '',
  connLabel: 'conn.host',
  setStory: vi.fn(),
  openVoting: vi.fn(),
  revealVotes: vi.fn(),
  setFinalAndComment: vi.fn(),
  nextRound: vi.fn(),
  castVote: vi.fn(),
  leaveRoom: vi.fn(),
};

describe('Room', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navbar with room code and PM role', () => {
    const room = makeRoom({ roomCode: 'TESTCODE' });
    renderWithI18n(
      <Room
        {...baseProps}
        room={room}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'TESTCODE' }}
      />
    );

    expect(screen.getByText('Poker Planning')).toBeInTheDocument();
    expect(screen.getByText('TESTCODE')).toBeInTheDocument();
    expect(screen.getByText(/project manager/i)).toBeInTheDocument();
    expect(document.querySelector('.bi-suit-spade-fill')).toBeInTheDocument();
  });

  it('copies room code to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    });

    const room = makeRoom({ roomCode: 'COPYME12' });
    renderWithI18n(
      <Room
        {...baseProps}
        room={room}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'COPYME12' }}
      />
    );

    await user.click(screen.getByTitle(/copy code/i));
    expect(writeText).toHaveBeenCalledWith('COPYME12');
    vi.unstubAllGlobals();
  });

  it('calls leaveRoom', async () => {
    const user = userEvent.setup();
    const leaveRoom = vi.fn();
    renderWithI18n(
      <Room
        {...baseProps}
        leaveRoom={leaveRoom}
        room={makeRoom()}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'ABCD1234' }}
      />
    );

    await user.click(screen.getByRole('button', { name: /leave|sair|quitter/i }));
    expect(leaveRoom).toHaveBeenCalled();
  });

  it('shows connecting state for dev without room', () => {
    renderWithI18n(
      <Room
        {...baseProps}
        room={null}
        local={{ role: 'dev', peerId: 'p-dev', name: 'Bruno', roomCode: 'ABCD1234' }}
        connLabel="conn.connecting"
      />
    );

    expect(
      screen.getAllByText(/connecting to the project manager/i).length
    ).toBeGreaterThan(0);
    expect(document.querySelector('.spinner-border')).toBeInTheDocument();
  });

  it('shows history entries', () => {
    const room = makeRoom({
      history: [
        {
          id: 'h1',
          title: 'Past task',
          finalScore: '8',
          pmComment: 'Done',
        },
      ],
    });

    renderWithI18n(
      <Room
        {...baseProps}
        room={room}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'ABCD1234' }}
      />
    );

    expect(screen.getByText('Past task')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows status banner when status provided', () => {
    renderWithI18n(
      <Room
        {...baseProps}
        status="status.roomCreated"
        room={makeRoom()}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'ABCD1234' }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders voting panel in voting phase', () => {
    const room = makeRoom({
      phase: 'voting',
      story: { title: 'Estimate me', description: 'Body' },
      participants: {
        'p-pm1': makeParticipant({ peerId: 'p-pm1', name: 'Ana', role: 'pm' }),
        'p-dev': makeParticipant({ peerId: 'p-dev', name: 'Bruno', role: 'dev' }),
      },
    });

    renderWithI18n(
      <Room
        {...baseProps}
        room={room}
        local={{ role: 'pm', peerId: 'p-pm1', name: 'Ana', roomCode: 'ABCD1234' }}
      />
    );

    expect(screen.getByText(/estimate me/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
