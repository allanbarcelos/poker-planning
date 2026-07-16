import { CARD_VALUES, DECK } from './constants';

export function makeId(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function makePeerId() {
  return `p-${makeId(10).toLowerCase()}`;
}

export function computeStats(votesMap) {
  const entries = Object.entries(votesMap || {}).filter(([, v]) => v != null && v !== '');
  if (!entries.length) {
    return { average: null, mode: null, nearest: null, distribution: {}, count: 0 };
  }

  const distribution = {};
  for (const [, value] of entries) {
    distribution[value] = (distribution[value] || 0) + 1;
  }

  const numeric = entries
    .map(([, v]) => CARD_VALUES[v])
    .filter((n) => typeof n === 'number');

  let average = null;
  let nearest = null;
  if (numeric.length) {
    average = Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10;
    const deckNumeric = DECK.filter((c) => CARD_VALUES[c] != null).map((c) => ({
      card: c,
      value: CARD_VALUES[c],
    }));
    nearest = deckNumeric.reduce((best, cur) =>
      Math.abs(cur.value - average) < Math.abs(best.value - average) ? cur : best
    ).card;
  }

  let mode = null;
  let modeCount = 0;
  for (const [card, count] of Object.entries(distribution)) {
    if (count > modeCount) {
      mode = card;
      modeCount = count;
    }
  }

  return {
    average,
    mode,
    nearest,
    distribution,
    count: entries.length,
  };
}

export function sanitizeStateForBroadcast(state, includeVotes = false) {
  const participants = {};
  for (const [id, p] of Object.entries(state.participants || {})) {
    participants[id] = {
      peerId: p.peerId,
      name: p.name,
      role: p.role,
      connected: p.connected,
      hasVoted: Boolean(p.hasVoted),
      vote: includeVotes || state.phase === 'reveal' ? p.vote ?? null : null,
    };
  }

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    pmPeerId: state.pmPeerId,
    pmName: state.pmName,
    story: state.story,
    participants,
    votes: includeVotes || state.phase === 'reveal' ? { ...(state.votes || {}) } : {},
    stats: includeVotes || state.phase === 'reveal' ? state.stats : null,
    finalScore: state.finalScore,
    pmComment: state.pmComment,
    history: state.history || [],
  };
}

export function emptyStory() {
  return { title: '', description: '' };
}

export function createInitialRoomState({ roomCode, pmPeerId, pmName }) {
  return {
    roomCode,
    phase: 'lobby',
    pmPeerId,
    pmName,
    story: emptyStory(),
    participants: {
      [pmPeerId]: {
        peerId: pmPeerId,
        name: pmName,
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
  };
}
