import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { I18nProvider } from './i18n/I18nContext';

const mockUseRoom = vi.fn();

vi.mock('./hooks/useRoom', () => ({
  useRoom: () => mockUseRoom(),
}));

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.setItem('poker-planning-lang', 'en');
    mockUseRoom.mockReset();
  });

  it('shows restoring spinner when restoring session', () => {
    mockUseRoom.mockReturnValue({
      screen: 'home',
      restoring: true,
    });

    renderApp();
    expect(screen.getAllByText(/restoring session/i).length).toBeGreaterThan(0);
    expect(document.querySelector('.spinner-border')).toBeInTheDocument();
  });

  it('renders Home on home screen', () => {
    mockUseRoom.mockReturnValue({
      screen: 'home',
      restoring: false,
      startAsPm: vi.fn(),
      startAsDev: vi.fn(),
      error: '',
    });

    renderApp();
    expect(screen.getByText('Poker Planning')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create room as project manager/i })
    ).toBeInTheDocument();
  });

  it('renders Room on room screen', () => {
    mockUseRoom.mockReturnValue({
      screen: 'room',
      restoring: false,
      room: {
        roomCode: 'ROOM1234',
        phase: 'lobby',
        pmPeerId: 'p-pm',
        pmName: 'Ana',
        story: { title: '', description: '' },
        participants: {
          'p-pm': {
            peerId: 'p-pm',
            name: 'Ana',
            role: 'pm',
            connected: true,
            hasVoted: false,
            vote: null,
          },
        },
        votes: {},
        stats: null,
        finalScore: null,
        pmComment: '',
        history: [],
      },
      local: { role: 'pm', peerId: 'p-pm', name: 'Ana', roomCode: 'ROOM1234' },
      status: '',
      connLabel: 'conn.host',
      setStory: vi.fn(),
      openVoting: vi.fn(),
      revealVotes: vi.fn(),
      setFinalAndComment: vi.fn(),
      nextRound: vi.fn(),
      castVote: vi.fn(),
      leaveRoom: vi.fn(),
    });

    renderApp();
    expect(screen.getByText('ROOM1234')).toBeInTheDocument();
    expect(screen.getByText(/project manager/i)).toBeInTheDocument();
  });
});
