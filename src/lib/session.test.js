import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSaved,
  saveSession,
  clearSession,
  persistPmSession,
  persistDevSession,
} from './session';
import { SAVE_KEY } from './constants';

describe('session', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('saveSession / loadSaved / clearSession', () => {
    it('returns null when nothing saved', () => {
      expect(loadSaved()).toBeNull();
    });

    it('round-trips JSON data', () => {
      saveSession({ role: 'pm', roomCode: 'ABC' });
      expect(loadSaved()).toEqual({ role: 'pm', roomCode: 'ABC' });
    });

    it('clears session', () => {
      saveSession({ a: 1 });
      clearSession();
      expect(loadSaved()).toBeNull();
      expect(sessionStorage.getItem(SAVE_KEY)).toBeNull();
    });

    it('returns null on invalid JSON', () => {
      sessionStorage.setItem(SAVE_KEY, '{not-json');
      expect(loadSaved()).toBeNull();
    });
  });

  describe('persistPmSession', () => {
    it('does nothing without local or room', () => {
      persistPmSession(null, { roomCode: 'X' });
      persistPmSession({ role: 'pm' }, null);
      persistPmSession({ role: 'dev', peerId: 'p', name: 'D', roomCode: 'X' }, {});
      expect(loadSaved()).toBeNull();
    });

    it('saves PM snapshot without _myVote', () => {
      const local = {
        role: 'pm',
        peerId: 'p-pm',
        name: 'Ana',
        roomCode: 'ROOMCODE',
      };
      const room = {
        roomCode: 'ROOMCODE',
        phase: 'lobby',
        _myVote: '5',
      };

      persistPmSession(local, room);
      const saved = loadSaved();

      expect(saved.role).toBe('pm');
      expect(saved.peerId).toBe('p-pm');
      expect(saved.roomCode).toBe('ROOMCODE');
      expect(saved.room._myVote).toBeUndefined();
      expect(saved.version).toBe(1);
      expect(typeof saved.savedAt).toBe('number');
    });
  });

  describe('persistDevSession', () => {
    it('does nothing for non-dev', () => {
      persistDevSession({ role: 'pm', peerId: 'p', name: 'A', roomCode: 'X' });
      expect(loadSaved()).toBeNull();
    });

    it('saves guest identity and vote', () => {
      const local = {
        role: 'dev',
        peerId: 'p-dev',
        name: 'Bruno',
        roomCode: 'ROOMCODE',
      };
      persistDevSession(local, '13');
      const saved = loadSaved();

      expect(saved).toMatchObject({
        version: 1,
        role: 'dev',
        peerId: 'p-dev',
        name: 'Bruno',
        roomCode: 'ROOMCODE',
        myVote: '13',
      });
    });

    it('defaults myVote to null', () => {
      persistDevSession({
        role: 'dev',
        peerId: 'p',
        name: 'B',
        roomCode: 'CODE1234',
      });
      expect(loadSaved().myVote).toBeNull();
    });
  });
});
