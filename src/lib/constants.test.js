import { describe, it, expect } from 'vitest';
import {
  DECK,
  CARD_VALUES,
  PHASES,
  ROLES,
  SAVE_KEY,
  NTFY_BASE,
} from './constants';

describe('constants', () => {
  it('exposes planning poker deck including coffee break', () => {
    expect(DECK).toEqual(['0', '½', '1', '2', '3', '5', '8', '13', '21', '?', '☕']);
  });

  it('maps numeric cards for averaging', () => {
    expect(CARD_VALUES['0']).toBe(0);
    expect(CARD_VALUES['½']).toBe(0.5);
    expect(CARD_VALUES['21']).toBe(21);
    expect(CARD_VALUES['?']).toBeUndefined();
    expect(CARD_VALUES['☕']).toBeUndefined();
  });

  it('defines phases and roles', () => {
    expect(PHASES).toEqual({
      LOBBY: 'lobby',
      STORY: 'story',
      VOTING: 'voting',
      REVEAL: 'reveal',
    });
    expect(ROLES).toEqual({ PM: 'pm', DEV: 'dev' });
  });

  it('has session and signaling constants', () => {
    expect(SAVE_KEY).toBe('poker-planning-v1');
    expect(NTFY_BASE).toMatch(/^https:\/\//);
  });
});
