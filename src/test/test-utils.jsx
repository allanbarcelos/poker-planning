import { render } from '@testing-library/react';
import { I18nProvider } from '../i18n/I18nContext';

export function renderWithI18n(ui, options = {}) {
  return render(<I18nProvider>{ui}</I18nProvider>, options);
}

export function makeParticipant({
  peerId = 'p-dev1',
  name = 'Dev',
  role = 'dev',
  connected = true,
  hasVoted = false,
  vote = null,
} = {}) {
  return { peerId, name, role, connected, hasVoted, vote };
}

export function makeRoom({
  roomCode = 'ABCD1234',
  phase = 'lobby',
  pmPeerId = 'p-pm1',
  pmName = 'Ana',
  story = { title: '', description: '' },
  participants,
  votes = {},
  stats = null,
  finalScore = null,
  pmComment = '',
  history = [],
  _myVote,
} = {}) {
  const defaultParticipants = {
    [pmPeerId]: makeParticipant({
      peerId: pmPeerId,
      name: pmName,
      role: 'pm',
    }),
  };

  return {
    roomCode,
    phase,
    pmPeerId,
    pmName,
    story,
    participants: participants || defaultParticipants,
    votes,
    stats,
    finalScore,
    pmComment,
    history,
    ...(_myVote !== undefined ? { _myVote } : {}),
  };
}
