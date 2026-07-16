import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  makeId,
  makePeerId,
  computeStats,
  sanitizeStateForBroadcast,
  emptyStory,
  createInitialRoomState,
} from './utils';
import { PHASES } from './constants';

describe('makeId', () => {
  afterEach(() => {
    vi.spyOn(Math, 'random').mockRestore();
  });

  it('returns string of requested length', () => {
    expect(makeId(8)).toHaveLength(8);
    expect(makeId(4)).toHaveLength(4);
  });

  it('uses only allowed charset', () => {
    const id = makeId(40);
    expect(id).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('defaults to length 8', () => {
    expect(makeId()).toHaveLength(8);
  });
});

describe('makePeerId', () => {
  it('prefixes with p- and lowercases', () => {
    const id = makePeerId();
    expect(id).toMatch(/^p-[a-z0-9]{10}$/);
  });
});

describe('computeStats', () => {
  it('returns empty stats for empty or null votes', () => {
    expect(computeStats({})).toEqual({
      average: null,
      mode: null,
      nearest: null,
      distribution: {},
      count: 0,
    });
    expect(computeStats(null).count).toBe(0);
  });

  it('ignores null and empty votes', () => {
    expect(computeStats({ a: null, b: '', c: '5' }).count).toBe(1);
  });

  it('computes average, mode, nearest and distribution', () => {
    const stats = computeStats({
      a: '3',
      b: '5',
      c: '5',
      d: '8',
    });
    expect(stats.count).toBe(4);
    expect(stats.average).toBe(5.3);
    expect(stats.mode).toBe('5');
    expect(stats.nearest).toBe('5');
    expect(stats.distribution).toEqual({ '3': 1, '5': 2, '8': 1 });
  });

  it('handles half point cards', () => {
    const stats = computeStats({ a: '½', b: '1' });
    expect(stats.average).toBe(0.8);
    expect(stats.nearest).toBe('1');
  });

  it('skips non-numeric cards in average but keeps them in mode', () => {
    const stats = computeStats({ a: '?', b: '?', c: '☕' });
    expect(stats.average).toBeNull();
    expect(stats.nearest).toBeNull();
    expect(stats.mode).toBe('?');
    expect(stats.count).toBe(3);
  });

  it('mixes numeric and non-numeric', () => {
    const stats = computeStats({ a: '5', b: '?', c: '5' });
    expect(stats.average).toBe(5);
    expect(stats.mode).toBe('5');
    expect(stats.nearest).toBe('5');
  });
});

describe('sanitizeStateForBroadcast', () => {
  const base = createInitialRoomState({
    roomCode: 'ROOMCODE',
    pmPeerId: 'p-pm',
    pmName: 'Ana',
  });

  const withDev = {
    ...base,
    phase: PHASES.VOTING,
    participants: {
      ...base.participants,
      'p-dev': {
        peerId: 'p-dev',
        name: 'Bruno',
        role: 'dev',
        connected: true,
        hasVoted: true,
        vote: '8',
      },
    },
    votes: { 'p-dev': '8' },
    stats: { average: 8, mode: '8', nearest: '8', count: 1 },
  };

  it('hides votes during voting unless includeVotes', () => {
    const sanitized = sanitizeStateForBroadcast(withDev, false);
    expect(sanitized.participants['p-dev'].vote).toBeNull();
    expect(sanitized.participants['p-dev'].hasVoted).toBe(true);
    expect(sanitized.votes).toEqual({});
    expect(sanitized.stats).toBeNull();
  });

  it('includes votes in reveal phase', () => {
    const reveal = { ...withDev, phase: PHASES.REVEAL };
    const sanitized = sanitizeStateForBroadcast(reveal, false);
    expect(sanitized.participants['p-dev'].vote).toBe('8');
    expect(sanitized.votes).toEqual({ 'p-dev': '8' });
    expect(sanitized.stats).toEqual(withDev.stats);
  });

  it('includes votes when includeVotes is true', () => {
    const sanitized = sanitizeStateForBroadcast(withDev, true);
    expect(sanitized.votes).toEqual({ 'p-dev': '8' });
  });

  it('preserves room metadata', () => {
    const sanitized = sanitizeStateForBroadcast(withDev);
    expect(sanitized.roomCode).toBe('ROOMCODE');
    expect(sanitized.pmName).toBe('Ana');
    expect(sanitized.history).toEqual([]);
  });
});

describe('emptyStory', () => {
  it('returns empty title and description', () => {
    expect(emptyStory()).toEqual({ title: '', description: '' });
  });
});

describe('createInitialRoomState', () => {
  it('creates lobby room with PM participant', () => {
    const room = createInitialRoomState({
      roomCode: 'XYZ12345',
      pmPeerId: 'p-host',
      pmName: 'Carla',
    });

    expect(room.phase).toBe(PHASES.LOBBY);
    expect(room.roomCode).toBe('XYZ12345');
    expect(room.pmPeerId).toBe('p-host');
    expect(room.participants['p-host']).toMatchObject({
      name: 'Carla',
      role: 'pm',
      connected: true,
      hasVoted: false,
      vote: null,
    });
    expect(room.votes).toEqual({});
    expect(room.history).toEqual([]);
  });
});
