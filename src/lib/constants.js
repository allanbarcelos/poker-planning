/** Fibonacci-style planning poker deck */
export const DECK = ['0', '½', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

/** Numeric values for averaging (non-numeric cards ignored) */
export const CARD_VALUES = {
  '0': 0,
  '½': 0.5,
  '1': 1,
  '2': 2,
  '3': 3,
  '5': 5,
  '8': 8,
  '13': 13,
  '21': 21,
};

export const PHASES = {
  LOBBY: 'lobby',
  STORY: 'story',
  VOTING: 'voting',
  REVEAL: 'reveal',
};

export const ROLES = {
  PM: 'pm',
  DEV: 'dev',
};

export const NTFY_BASE = 'https://ntfy.sh';
export const TURN_CREDENTIALS_URL =
  'https://rough-grass-f40b.allan-d68.workers.dev';

export const SAVE_KEY = 'poker-planning-v1';
