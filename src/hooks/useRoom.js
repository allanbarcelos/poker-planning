import { useCallback, useEffect, useRef, useState } from 'react';
import { PHASES, ROLES } from '../lib/constants';
import {
  createInitialRoomState,
  emptyStory,
  makeId,
  makePeerId,
  computeStats,
  sanitizeStateForBroadcast,
} from '../lib/utils';
import { lobbyTopic, signalTopic, postSignal, subscribeTopic } from '../lib/signaling';
import { createPeerConnection, wireDataChannel, sendJson } from '../lib/webrtc';
import {
  loadSaved,
  clearSession,
  persistPmSession,
  persistDevSession,
} from '../lib/session';

const MAX_RECONNECT = 8;
const HELLO_INTERVAL_MS = 3500;
const HELLO_WINDOW_MS = 45000;

/**
 * Multi-user poker planning room over WebRTC star topology.
 * PM (host) owns authoritative state and relays to all devs.
 * Supports session restore + auto-reconnect after reload / drop.
 */
export function useRoom() {
  const [screen, setScreen] = useState('home');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [local, setLocal] = useState(null);
  const [connLabel, setConnLabel] = useState('');
  const [restoring, setRestoring] = useState(() => Boolean(loadSaved()));

  const roomRef = useRef(null);
  const localRef = useRef(null);
  const peersRef = useRef(new Map());
  const guestChannelRef = useRef(null);
  const guestPcRef = useRef(null);
  const lobbyCleanupRef = useRef(null);
  const guestSigCleanupRef = useRef(null);
  const guestHelloTimerRef = useRef(null);
  const guestHelloStopRef = useRef(null);
  const guestReconnectTimerRef = useRef(null);
  const guestReconnectAttemptsRef = useRef(0);
  const guestConnectingRef = useRef(false);
  const intentionalLeaveRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const myVoteRef = useRef(null);

  // Stable callback refs so wire handlers always call latest logic
  const handleHostMessageRef = useRef(() => {});
  const handleGuestMessageRef = useRef(() => {});
  const hostConnectToGuestRef = useRef(async () => {});
  const scheduleGuestReconnectRef = useRef(() => {});
  const connectAsDevRef = useRef(async () => {});

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    localRef.current = local;
  }, [local]);

  /** Persist whenever PM room state changes */
  useEffect(() => {
    if (local?.role === ROLES.PM && room) {
      persistPmSession(local, room);
    }
  }, [local, room]);

  /** Persist guest identity + vote */
  useEffect(() => {
    if (local?.role === ROLES.DEV) {
      persistDevSession(local, myVoteRef.current);
    }
  }, [local, room?._myVote]);

  const broadcastState = useCallback((nextRoom, { includeVotes } = {}) => {
    const payload = {
      type: 'state',
      state: sanitizeStateForBroadcast(
        nextRoom,
        includeVotes ?? nextRoom.phase === PHASES.REVEAL
      ),
    };
    for (const { channel } of peersRef.current.values()) {
      sendJson(channel, payload);
    }
  }, []);

  const applyRoom = useCallback(
    (updater, { broadcast = true, includeVotes } = {}) => {
      setRoom((prev) => {
        const base = typeof updater === 'function' ? updater(prev) : updater;
        if (!base) return prev;
        roomRef.current = base;
        if (broadcast && localRef.current?.role === ROLES.PM) {
          broadcastState(base, { includeVotes });
        }
        return base;
      });
    },
    [broadcastState]
  );

  const teardownPeer = useCallback((peerId) => {
    const entry = peersRef.current.get(peerId);
    if (!entry) return;
    try {
      entry.cleanup?.();
    } catch {
      /* ignore */
    }
    try {
      entry.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      entry.pc?.close();
    } catch {
      /* ignore */
    }
    peersRef.current.delete(peerId);
  }, []);

  const clearGuestTimers = useCallback(() => {
    if (guestHelloTimerRef.current) {
      clearInterval(guestHelloTimerRef.current);
      guestHelloTimerRef.current = null;
    }
    if (guestHelloStopRef.current) {
      clearTimeout(guestHelloStopRef.current);
      guestHelloStopRef.current = null;
    }
    if (guestReconnectTimerRef.current) {
      clearTimeout(guestReconnectTimerRef.current);
      guestReconnectTimerRef.current = null;
    }
  }, []);

  const teardownGuestLink = useCallback(() => {
    if (guestSigCleanupRef.current) {
      guestSigCleanupRef.current();
      guestSigCleanupRef.current = null;
    }
    try {
      guestChannelRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      guestPcRef.current?.close();
    } catch {
      /* ignore */
    }
    guestChannelRef.current = null;
    guestPcRef.current = null;
    guestConnectingRef.current = false;
  }, []);

  const teardownAll = useCallback(() => {
    if (lobbyCleanupRef.current) {
      lobbyCleanupRef.current();
      lobbyCleanupRef.current = null;
    }
    clearGuestTimers();
    teardownGuestLink();
    for (const peerId of [...peersRef.current.keys()]) {
      teardownPeer(peerId);
    }
  }, [clearGuestTimers, teardownGuestLink, teardownPeer]);

  const markGuestOffline = useCallback(
    (peerId) => {
      applyRoom((prev) => {
        if (!prev?.participants?.[peerId]) return prev;
        return {
          ...prev,
          participants: {
            ...prev.participants,
            [peerId]: { ...prev.participants[peerId], connected: false },
          },
        };
      });
    },
    [applyRoom]
  );

  /* ── Host message handling ─────────────────────────────────── */

  handleHostMessageRef.current = (fromPeerId, msg) => {
    if (!msg?.type) return;
    const current = roomRef.current;
    if (!current) return;

    switch (msg.type) {
      case 'join': {
        const name = String(msg.name || 'Dev').slice(0, 40);
        applyRoom((prev) => {
          if (!prev) return prev;
          const participants = {
            ...prev.participants,
            [fromPeerId]: {
              peerId: fromPeerId,
              name,
              role: ROLES.DEV,
              connected: true,
              hasVoted: Boolean(prev.votes?.[fromPeerId]),
              vote: prev.votes?.[fromPeerId] ?? null,
            },
          };
          return { ...prev, participants };
        });
        setStatus({ key: 'status.userJoined', name });
        break;
      }

      case 'vote': {
        if (current.phase !== PHASES.VOTING) return;
        const value = String(msg.value ?? '');
        applyRoom((prev) => {
          if (!prev || prev.phase !== PHASES.VOTING) return prev;
          const p = prev.participants[fromPeerId];
          if (!p || p.role !== ROLES.DEV) return prev;
          const votes = { ...prev.votes, [fromPeerId]: value };
          const participants = {
            ...prev.participants,
            [fromPeerId]: { ...p, hasVoted: true, vote: value },
          };
          return { ...prev, votes, participants };
        });
        break;
      }

      case 'leave': {
        applyRoom((prev) => {
          if (!prev) return prev;
          const participants = { ...prev.participants };
          if (participants[fromPeerId]) {
            participants[fromPeerId] = {
              ...participants[fromPeerId],
              connected: false,
            };
          }
          return { ...prev, participants };
        });
        teardownPeer(fromPeerId);
        break;
      }

      default:
        break;
    }
  };

  handleGuestMessageRef.current = (msg) => {
    if (!msg?.type) return;
    if (msg.type === 'state' && msg.state) {
      setRoom((prev) => {
        const next = {
          ...msg.state,
          _myVote:
            msg.state.phase === PHASES.REVEAL
              ? msg.state.participants?.[localRef.current?.peerId]?.vote ??
                myVoteRef.current ??
                prev?._myVote
              : msg.state.phase === PHASES.VOTING
                ? myVoteRef.current ?? prev?._myVote ?? null
                : null,
        };
        roomRef.current = next;
        return next;
      });
      setStatus('');
      guestReconnectAttemptsRef.current = 0;

      // Re-send vote after reconnect if still in voting and we had one
      if (
        msg.state.phase === PHASES.VOTING &&
        myVoteRef.current &&
        guestChannelRef.current?.readyState === 'open'
      ) {
        sendJson(guestChannelRef.current, {
          type: 'vote',
          value: myVoteRef.current,
        });
      }
    }
  };

  const attachHostChannel = useCallback(
    (peerId, channel) => {
      wireDataChannel(channel, {
        onOpen: () => {
          const entry = peersRef.current.get(peerId);
          if (entry) entry.channel = channel;
          const snap = roomRef.current;
          if (snap) {
            sendJson(channel, {
              type: 'state',
              state: sanitizeStateForBroadcast(snap, snap.phase === PHASES.REVEAL),
            });
          }
          setStatus('status.devConnected');
        },
        onMessage: (msg) => handleHostMessageRef.current(peerId, msg),
        onClose: () => markGuestOffline(peerId),
      });
    },
    [markGuestOffline]
  );

  hostConnectToGuestRef.current = async (roomCode, guestPeerId) => {
    const existing = peersRef.current.get(guestPeerId);
    if (existing) {
      const alive =
        existing.channel?.readyState === 'open' ||
        existing.pc?.connectionState === 'connected' ||
        existing.pc?.connectionState === 'connecting';
      if (alive) return;
      teardownPeer(guestPeerId);
    }

    const topic = signalTopic(roomCode, guestPeerId);
    let remoteDescSet = false;
    const iceQueue = [];
    let sigCleanup = null;

    const pc = await createPeerConnection({
      onIceCandidate: (candidate) => {
        postSignal(topic, {
          type: 'ice',
          from: 'host',
          candidate,
        });
      },
      onConnectionStateChange: (state) => {
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          markGuestOffline(guestPeerId);
        }
      },
    });

    const channel = pc.createDataChannel('poker');
    attachHostChannel(guestPeerId, channel);

    const flushIce = async () => {
      remoteDescSet = true;
      for (const c of iceQueue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {
          /* ignore */
        }
      }
      iceQueue.length = 0;
    };

    sigCleanup = subscribeTopic(topic, {
      sinceSeconds: 60,
      filterFrom: 'host',
      onMessage: async (msg) => {
        if (msg.type === 'answer' && msg.sdp) {
          if (pc.signalingState === 'stable' && pc.currentRemoteDescription) return;
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: msg.sdp })
          );
          await flushIce();
        } else if (msg.type === 'ice' && msg.candidate) {
          if (remoteDescSet) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch {
              /* ignore */
            }
          } else {
            iceQueue.push(msg.candidate);
          }
        }
      },
    });

    peersRef.current.set(guestPeerId, {
      pc,
      channel,
      cleanup: () => sigCleanup?.(),
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await postSignal(topic, {
      type: 'offer',
      from: 'host',
      sdp: offer.sdp,
    });
  };

  const startPmLobby = useCallback(
    (roomCode) => {
      if (lobbyCleanupRef.current) {
        lobbyCleanupRef.current();
        lobbyCleanupRef.current = null;
      }
      lobbyCleanupRef.current = subscribeTopic(lobbyTopic(roomCode), {
        sinceSeconds: 120,
        filterFrom: 'host',
        onMessage: async (msg) => {
          if (msg.type === 'hello' && msg.peerId) {
            await hostConnectToGuestRef.current(roomCode, msg.peerId);
          }
        },
      });
    },
    []
  );

  const startAsPm = useCallback(
    async (name) => {
      setError('');
      intentionalLeaveRef.current = false;
      teardownAll();
      guestReconnectAttemptsRef.current = 0;
      myVoteRef.current = null;

      const roomCode = makeId(8);
      const peerId = makePeerId();
      const pmName = name.trim().slice(0, 40) || 'PM';
      const initial = createInitialRoomState({ roomCode, pmPeerId: peerId, pmName });

      const me = { role: ROLES.PM, peerId, name: pmName, roomCode };
      setLocal(me);
      localRef.current = me;
      setRoom(initial);
      roomRef.current = initial;
      setScreen('room');
      setStatus('status.roomCreated');
      setConnLabel('conn.host');
      setRestoring(false);

      persistPmSession(me, initial);
      startPmLobby(roomCode);
    },
    [startPmLobby, teardownAll]
  );

  const restoreAsPm = useCallback(
    (saved) => {
      intentionalLeaveRef.current = false;
      teardownAll();

      const me = {
        role: ROLES.PM,
        peerId: saved.peerId,
        name: saved.name,
        roomCode: saved.roomCode,
      };

      // Mark all devs offline until they re-hello
      const restoredRoom = {
        ...saved.room,
        participants: Object.fromEntries(
          Object.entries(saved.room.participants || {}).map(([id, p]) => [
            id,
            {
              ...p,
              connected: p.role === ROLES.PM,
            },
          ])
        ),
      };

      setLocal(me);
      localRef.current = me;
      setRoom(restoredRoom);
      roomRef.current = restoredRoom;
      setScreen('room');
      setStatus('status.sessionRestored');
      setConnLabel('conn.host');
      setRestoring(false);

      persistPmSession(me, restoredRoom);
      startPmLobby(saved.roomCode);
    },
    [startPmLobby, teardownAll]
  );

  /* ── Guest connection + reconnect ──────────────────────────── */

  scheduleGuestReconnectRef.current = () => {
    if (intentionalLeaveRef.current) return;
    if (localRef.current?.role !== ROLES.DEV) return;
    if (guestReconnectTimerRef.current) return;

    if (guestReconnectAttemptsRef.current >= MAX_RECONNECT) {
      setStatus('status.reconnectFailed');
      setConnLabel('conn.offline');
      return;
    }

    guestReconnectAttemptsRef.current += 1;
    const attempt = guestReconnectAttemptsRef.current;
    const delay = Math.min(1000 * 2 ** (attempt - 1), 16000);

    setStatus({
      key: 'status.reconnecting',
      attempt,
      max: MAX_RECONNECT,
    });
    setConnLabel('conn.reconnecting');

    guestReconnectTimerRef.current = setTimeout(async () => {
      guestReconnectTimerRef.current = null;
      const me = localRef.current;
      if (!me || me.role !== ROLES.DEV || intentionalLeaveRef.current) return;
      await connectAsDevRef.current({
        name: me.name,
        roomCode: me.roomCode,
        peerId: me.peerId,
        isReconnect: true,
      });
    }, delay);
  };

  connectAsDevRef.current = async ({ name, roomCode, peerId, isReconnect = false }) => {
    if (guestConnectingRef.current) return;
    guestConnectingRef.current = true;

    clearGuestTimers();
    teardownGuestLink();

    const code = roomCode.trim().toUpperCase();
    const devName = name.trim().slice(0, 40) || 'Dev';
    const id = peerId || makePeerId();

    const me = { role: ROLES.DEV, peerId: id, name: devName, roomCode: code };
    setLocal(me);
    localRef.current = me;
    setScreen('room');
    if (!isReconnect) {
      setRoom(null);
      roomRef.current = null;
    }
    setStatus(
      isReconnect ? 'status.reconnectingPm' : 'status.connectingRoom'
    );
    setConnLabel(isReconnect ? 'conn.reconnecting' : 'conn.connecting');
    setRestoring(false);

    persistDevSession(me, myVoteRef.current);

    const topic = signalTopic(code, id);
    let remoteDescSet = false;
    const iceQueue = [];

    try {
      const pc = await createPeerConnection({
        onIceCandidate: (candidate) => {
          postSignal(topic, {
            type: 'ice',
            from: 'guest',
            candidate,
          });
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setConnLabel('conn.p2p');
            guestReconnectAttemptsRef.current = 0;
          }
          if (
            (state === 'failed' || state === 'disconnected' || state === 'closed') &&
            !intentionalLeaveRef.current
          ) {
            setConnLabel('conn.offline');
            scheduleGuestReconnectRef.current();
          }
        },
      });
      guestPcRef.current = pc;

      pc.ondatachannel = ({ channel }) => {
        guestChannelRef.current = channel;
        wireDataChannel(channel, {
          onOpen: () => {
            setStatus(
              isReconnect ? 'status.reconnected' : 'status.connected'
            );
            setConnLabel('conn.p2p');
            guestReconnectAttemptsRef.current = 0;
            guestConnectingRef.current = false;

            if (guestSigCleanupRef.current) {
              guestSigCleanupRef.current();
              guestSigCleanupRef.current = null;
            }
            clearGuestTimers();

            sendJson(channel, {
              type: 'join',
              peerId: id,
              name: devName,
            });

            if (myVoteRef.current) {
              sendJson(channel, {
                type: 'vote',
                value: myVoteRef.current,
              });
            }
          },
          onMessage: (msg) => handleGuestMessageRef.current(msg),
          onClose: () => {
            if (intentionalLeaveRef.current) return;
            setStatus('status.disconnectedPm');
            setConnLabel('conn.offline');
            scheduleGuestReconnectRef.current();
          },
        });
      };

      const flushIce = async () => {
        remoteDescSet = true;
        for (const c of iceQueue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            /* ignore */
          }
        }
        iceQueue.length = 0;
      };

      guestSigCleanupRef.current = subscribeTopic(topic, {
        sinceSeconds: 600,
        filterFrom: 'guest',
        onMessage: async (msg) => {
          if (msg.type === 'offer' && msg.sdp) {
            // Fresh PC per attempt — accept offer once
            if (pc.currentRemoteDescription) return;
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: msg.sdp })
            );
            await flushIce();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await postSignal(topic, {
              type: 'answer',
              from: 'guest',
              sdp: answer.sdp,
            });
          } else if (msg.type === 'ice' && msg.candidate) {
            if (remoteDescSet) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
              } catch {
                /* ignore */
              }
            } else {
              iceQueue.push(msg.candidate);
            }
          }
        },
      });

      const hello = () =>
        postSignal(lobbyTopic(code), {
          type: 'hello',
          from: 'guest',
          peerId: id,
          name: devName,
        });
      hello();
      guestHelloTimerRef.current = setInterval(hello, HELLO_INTERVAL_MS);
      guestHelloStopRef.current = setTimeout(() => {
        if (guestHelloTimerRef.current) {
          clearInterval(guestHelloTimerRef.current);
          guestHelloTimerRef.current = null;
        }
        // If still not connected after hello window, schedule reconnect
        if (
          !intentionalLeaveRef.current &&
          guestChannelRef.current?.readyState !== 'open'
        ) {
          guestConnectingRef.current = false;
          scheduleGuestReconnectRef.current();
        }
      }, HELLO_WINDOW_MS);
    } catch {
      guestConnectingRef.current = false;
      scheduleGuestReconnectRef.current();
    }
  };

  const startAsDev = useCallback(async (name, code) => {
    setError('');
    intentionalLeaveRef.current = false;
    teardownAll();
    guestReconnectAttemptsRef.current = 0;
    myVoteRef.current = null;

    const roomCode = code.trim().toUpperCase();
    if (roomCode.length < 6) {
      setError('error.invalidCode');
      setRestoring(false);
      return;
    }

    await connectAsDevRef.current({
      name,
      roomCode,
      peerId: makePeerId(),
      isReconnect: false,
    });
  }, [teardownAll]);

  /* ── Bootstrap session restore ─────────────────────────────── */

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const saved = loadSaved();
    if (!saved?.role || !saved?.roomCode || !saved?.peerId) {
      setRestoring(false);
      return;
    }

    // Stale sessions older than 8h
    if (saved.savedAt && Date.now() - saved.savedAt > 8 * 60 * 60 * 1000) {
      clearSession();
      setRestoring(false);
      return;
    }

    intentionalLeaveRef.current = false;

    if (saved.role === ROLES.PM && saved.room) {
      restoreAsPm(saved);
      return;
    }

    if (saved.role === ROLES.DEV) {
      myVoteRef.current = saved.myVote || null;
      setStatus('status.restoringSession');
      connectAsDevRef.current({
        name: saved.name,
        roomCode: saved.roomCode,
        peerId: saved.peerId,
        isReconnect: true,
      });
      return;
    }

    setRestoring(false);
  }, [restoreAsPm]);

  /* ── PM actions ─────────────────────────────────────────────── */

  const setStory = useCallback(
    (title, description) => {
      if (localRef.current?.role !== ROLES.PM) return;
      applyRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          phase: PHASES.STORY,
          story: {
            title: String(title || '').slice(0, 120),
            description: String(description || '').slice(0, 2000),
          },
          votes: {},
          stats: null,
          finalScore: null,
          pmComment: '',
          participants: Object.fromEntries(
            Object.entries(prev.participants).map(([id, p]) => [
              id,
              { ...p, hasVoted: false, vote: null },
            ])
          ),
        };
      });
      setStatus('status.storySent');
    },
    [applyRoom]
  );

  const openVoting = useCallback(() => {
    if (localRef.current?.role !== ROLES.PM) return;
    applyRoom((prev) => {
      if (!prev) return prev;
      if (!prev.story?.title?.trim() && !prev.story?.description?.trim()) return prev;
      return {
        ...prev,
        phase: PHASES.VOTING,
        votes: {},
        stats: null,
        finalScore: null,
        pmComment: '',
        participants: Object.fromEntries(
          Object.entries(prev.participants).map(([id, p]) => [
            id,
            { ...p, hasVoted: false, vote: null },
          ])
        ),
      };
    });
    setStatus('status.votingOpen');
  }, [applyRoom]);

  const revealVotes = useCallback(() => {
    if (localRef.current?.role !== ROLES.PM) return;
    applyRoom(
      (prev) => {
        if (!prev || prev.phase !== PHASES.VOTING) return prev;
        const stats = computeStats(prev.votes);
        return {
          ...prev,
          phase: PHASES.REVEAL,
          stats,
          finalScore: stats.nearest || stats.mode || null,
          participants: Object.fromEntries(
            Object.entries(prev.participants).map(([id, p]) => [
              id,
              {
                ...p,
                vote: prev.votes[id] ?? p.vote ?? null,
                hasVoted: Boolean(prev.votes[id] || p.hasVoted),
              },
            ])
          ),
        };
      },
      { includeVotes: true }
    );
    setStatus('status.votesRevealed');
  }, [applyRoom]);

  const setFinalAndComment = useCallback(
    (finalScore, pmComment) => {
      if (localRef.current?.role !== ROLES.PM) return;
      applyRoom(
        (prev) => {
          if (!prev || prev.phase !== PHASES.REVEAL) return prev;
          return {
            ...prev,
            finalScore: finalScore || prev.finalScore,
            pmComment: String(pmComment || '').slice(0, 500),
          };
        },
        { includeVotes: true }
      );
    },
    [applyRoom]
  );

  const nextRound = useCallback(() => {
    if (localRef.current?.role !== ROLES.PM) return;
    applyRoom((prev) => {
      if (!prev) return prev;
      const historyEntry =
        prev.story?.title || prev.story?.description
          ? {
              id: makeId(6),
              title: prev.story.title,
              description: prev.story.description,
              votes: { ...prev.votes },
              stats: prev.stats,
              finalScore: prev.finalScore,
              pmComment: prev.pmComment,
              at: Date.now(),
            }
          : null;

      return {
        ...prev,
        phase: PHASES.LOBBY,
        story: emptyStory(),
        votes: {},
        stats: null,
        finalScore: null,
        pmComment: '',
        history: historyEntry ? [historyEntry, ...(prev.history || [])] : prev.history || [],
        participants: Object.fromEntries(
          Object.entries(prev.participants).map(([id, p]) => [
            id,
            { ...p, hasVoted: false, vote: null },
          ])
        ),
      };
    });
    setStatus('status.readyNext');
  }, [applyRoom]);

  /* ── Dev actions ────────────────────────────────────────────── */

  const castVote = useCallback((value) => {
    const me = localRef.current;
    if (!me || me.role !== ROLES.DEV) return;
    if (roomRef.current?.phase !== PHASES.VOTING) return;

    myVoteRef.current = value;
    persistDevSession(me, value);

    setRoom((prev) => {
      if (!prev) return prev;
      const participants = {
        ...prev.participants,
        [me.peerId]: {
          ...(prev.participants[me.peerId] || {
            peerId: me.peerId,
            name: me.name,
            role: ROLES.DEV,
            connected: true,
          }),
          hasVoted: true,
          vote: null,
        },
      };
      return {
        ...prev,
        participants,
        _myVote: value,
      };
    });

    sendJson(guestChannelRef.current, {
      type: 'vote',
      value,
    });
  }, []);

  const leaveRoom = useCallback(() => {
    intentionalLeaveRef.current = true;
    if (localRef.current?.role === ROLES.DEV) {
      sendJson(guestChannelRef.current, { type: 'leave' });
    }
    teardownAll();
    clearSession();
    myVoteRef.current = null;
    guestReconnectAttemptsRef.current = 0;
    setRoom(null);
    setLocal(null);
    setScreen('home');
    setStatus('');
    setError('');
    setConnLabel('');
    setRestoring(false);
  }, [teardownAll]);

  // Cleanup on unmount only — do not clear session (allows F5 restore)
  useEffect(() => () => teardownAll(), [teardownAll]);

  return {
    screen,
    status,
    error,
    room,
    local,
    connLabel,
    restoring,
    startAsPm,
    startAsDev,
    setStory,
    openVoting,
    revealVotes,
    setFinalAndComment,
    nextRound,
    castVote,
    leaveRoom,
  };
}
