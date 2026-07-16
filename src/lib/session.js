import { SAVE_KEY } from './constants';

export function loadSaved() {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  try {
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** Persist PM room snapshot (authoritative state). */
export function persistPmSession(local, room) {
  if (!local || local.role !== 'pm' || !room) return;
  saveSession({
    version: 1,
    role: 'pm',
    peerId: local.peerId,
    name: local.name,
    roomCode: local.roomCode,
    room: {
      ...room,
      // never persist transient UI-only fields
      _myVote: undefined,
    },
    savedAt: Date.now(),
  });
}

/** Persist guest identity + optional private vote. */
export function persistDevSession(local, myVote = null) {
  if (!local || local.role !== 'dev') return;
  saveSession({
    version: 1,
    role: 'dev',
    peerId: local.peerId,
    name: local.name,
    roomCode: local.roomCode,
    myVote: myVote ?? null,
    savedAt: Date.now(),
  });
}
