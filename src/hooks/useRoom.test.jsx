import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoom } from './useRoom';
import { PHASES, ROLES, SAVE_KEY } from '../lib/constants';

const {
  mockPostSignal,
  mockSubscribeTopic,
  mockCreatePeerConnection,
  mockWireDataChannel,
  mockSendJson,
  hostMessageHandlers,
  guestMessageHandlers,
  hostChannelOpenHandlers,
} = vi.hoisted(() => ({
  mockPostSignal: vi.fn().mockResolvedValue(undefined),
  mockSubscribeTopic: vi.fn(() => vi.fn()),
  mockCreatePeerConnection: vi.fn(),
  mockWireDataChannel: vi.fn(),
  mockSendJson: vi.fn(() => true),
  hostMessageHandlers: new Map(),
  guestMessageHandlers: [],
  hostChannelOpenHandlers: new Map(),
}));

vi.mock('../lib/signaling', () => ({
  lobbyTopic: (code) => `poker-lobby-${code.toLowerCase()}`,
  signalTopic: (code, peerId) =>
    `poker-sig-${code.toLowerCase()}-${peerId.toLowerCase()}`,
  postSignal: (...args) => mockPostSignal(...args),
  subscribeTopic: (...args) => mockSubscribeTopic(...args),
}));

vi.mock('../lib/webrtc', () => ({
  createPeerConnection: (...args) => mockCreatePeerConnection(...args),
  wireDataChannel: (...args) => mockWireDataChannel(...args),
  sendJson: (...args) => mockSendJson(...args),
}));

function makeMockPc() {
  return {
    connectionState: 'new',
    signalingState: 'have-local-offer',
    currentRemoteDescription: null,
    createDataChannel: vi.fn(() => ({ readyState: 'connecting' })),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' }),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    ondatachannel: null,
  };
}

describe('useRoom', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    hostMessageHandlers.clear();
    guestMessageHandlers.length = 0;
    hostChannelOpenHandlers.clear();
    mockPostSignal.mockClear();
    mockSubscribeTopic.mockClear();
    mockCreatePeerConnection.mockReset();
    mockWireDataChannel.mockReset();
    mockSendJson.mockClear().mockReturnValue(true);

    mockCreatePeerConnection.mockImplementation(async () => makeMockPc());

    mockWireDataChannel.mockImplementation((channel, handlers = {}) => {
      if (handlers.onMessage) {
        // Host channels use peer-specific handlers via attachHostChannel
        // Guest uses onMessage on datachannel open path
        if (!channel.__peerId) {
          guestMessageHandlers.push(handlers.onMessage);
        }
      }
      if (handlers.onOpen && channel.__peerId) {
        hostChannelOpenHandlers.set(channel.__peerId, handlers.onOpen);
      }
      if (handlers.onMessage && channel.__peerId) {
        hostMessageHandlers.set(channel.__peerId, handlers.onMessage);
      }
      // Capture all host handlers when peerId assigned later via wrapper
      channel.__handlers = handlers;
      return channel;
    });

    // Re-implement wire to capture host handlers from attachHostChannel
    mockWireDataChannel.mockImplementation((channel, handlers = {}) => {
      channel.__handlers = handlers;
      if (channel.__role === 'guest') {
        guestMessageHandlers.push(handlers.onMessage);
      }
      return channel;
    });

    mockCreatePeerConnection.mockImplementation(async () => {
      const pc = makeMockPc();
      pc.createDataChannel = vi.fn(() => {
        const ch = { readyState: 'connecting', __role: 'host' };
        return ch;
      });
      return pc;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts on home without saved session', () => {
    const { result } = renderHook(() => useRoom());
    expect(result.current.screen).toBe('home');
    expect(result.current.restoring).toBe(false);
    expect(result.current.room).toBeNull();
  });

  it('startAsPm creates room and subscribes to lobby', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsPm('Ana');
    });

    expect(result.current.screen).toBe('room');
    expect(result.current.local.role).toBe(ROLES.PM);
    expect(result.current.local.name).toBe('Ana');
    expect(result.current.room.phase).toBe(PHASES.LOBBY);
    expect(result.current.room.roomCode).toHaveLength(8);
    expect(result.current.connLabel).toBe('conn.host');
    expect(mockSubscribeTopic).toHaveBeenCalled();
    expect(sessionStorage.getItem(SAVE_KEY)).toBeTruthy();
  });

  it('startAsDev rejects short codes', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsDev('Bruno', 'ABC');
    });

    expect(result.current.error).toBe('error.invalidCode');
    expect(result.current.screen).toBe('home');
  });

  it('startAsDev connects with valid code', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsDev('Bruno', 'abcd1234');
    });

    expect(result.current.screen).toBe('room');
    expect(result.current.local.role).toBe(ROLES.DEV);
    expect(result.current.local.roomCode).toBe('ABCD1234');
    expect(result.current.local.name).toBe('Bruno');
    expect(mockCreatePeerConnection).toHaveBeenCalled();
    expect(mockPostSignal).toHaveBeenCalled();
  });

  it('PM setStory / openVoting / revealVotes / setFinal / nextRound flow', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsPm('Ana');
    });

    // Inject a fake peer channel so broadcast does not throw
    act(() => {
      result.current.setStory('Login', 'As a user I can log in');
    });

    expect(result.current.room.phase).toBe(PHASES.STORY);
    expect(result.current.room.story.title).toBe('Login');

    act(() => {
      result.current.openVoting();
    });
    expect(result.current.room.phase).toBe(PHASES.VOTING);

    // Simulate a vote in state (as host would receive from guest)
    act(() => {
      // manually patch via reveal after injecting votes through host message path
      // Use setFinal flow after reveal with seeded votes
    });

    // Seed votes by calling host message handler through internal state update:
    // apply vote by re-using reveal with empty votes first, then nextRound history
    act(() => {
      // openVoting already set voting; inject votes into room via cast is dev-only
      // Host path: update room by revealVotes after we patch room through setStory-like apply
    });

    // Directly set votes by using host message simulation:
    // We need access to handleHostMessage - instead seed via leave and re-apply.
    // Simpler: call reveal with no votes, then nextRound, then setStory again.
    act(() => {
      result.current.revealVotes();
    });
    expect(result.current.room.phase).toBe(PHASES.REVEAL);

    act(() => {
      result.current.setFinalAndComment('5', 'Agreed');
    });
    expect(result.current.room.finalScore).toBe('5');
    expect(result.current.room.pmComment).toBe('Agreed');

    act(() => {
      result.current.nextRound();
    });
    expect(result.current.room.phase).toBe(PHASES.LOBBY);
    expect(result.current.room.history).toHaveLength(1);
    expect(result.current.room.history[0].title).toBe('Login');
    expect(result.current.room.history[0].finalScore).toBe('5');
  });

  it('leaveRoom clears session and returns home', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsPm('Ana');
    });
    expect(sessionStorage.getItem(SAVE_KEY)).toBeTruthy();

    act(() => {
      result.current.leaveRoom();
    });

    expect(result.current.screen).toBe('home');
    expect(result.current.room).toBeNull();
    expect(result.current.local).toBeNull();
    expect(sessionStorage.getItem(SAVE_KEY)).toBeNull();
  });

  it('restores PM session from storage', async () => {
    const saved = {
      version: 1,
      role: 'pm',
      peerId: 'p-savedpm',
      name: 'Ana',
      roomCode: 'SAVED123',
      savedAt: Date.now(),
      room: {
        roomCode: 'SAVED123',
        phase: 'story',
        pmPeerId: 'p-savedpm',
        pmName: 'Ana',
        story: { title: 'Saved story', description: 'Body' },
        participants: {
          'p-savedpm': {
            peerId: 'p-savedpm',
            name: 'Ana',
            role: 'pm',
            connected: true,
            hasVoted: false,
            vote: null,
          },
          'p-dev': {
            peerId: 'p-dev',
            name: 'Bruno',
            role: 'dev',
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
    };
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(saved));

    const { result } = renderHook(() => useRoom());

    await waitFor(() => {
      expect(result.current.restoring).toBe(false);
    });

    expect(result.current.screen).toBe('room');
    expect(result.current.local.role).toBe(ROLES.PM);
    expect(result.current.room.roomCode).toBe('SAVED123');
    expect(result.current.room.participants['p-dev'].connected).toBe(false);
  });

  it('discards stale sessions older than 8h', async () => {
    sessionStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        role: 'pm',
        peerId: 'p',
        name: 'A',
        roomCode: 'OLD12345',
        savedAt: Date.now() - 9 * 60 * 60 * 1000,
        room: { roomCode: 'OLD12345', participants: {}, phase: 'lobby' },
      })
    );

    const { result } = renderHook(() => useRoom());

    await waitFor(() => {
      expect(result.current.restoring).toBe(false);
    });

    expect(result.current.screen).toBe('home');
    expect(sessionStorage.getItem(SAVE_KEY)).toBeNull();
  });

  it('openVoting is no-op without story content', async () => {
    const { result } = renderHook(() => useRoom());
    await act(async () => {
      await result.current.startAsPm('Ana');
    });

    act(() => {
      result.current.openVoting();
    });
    expect(result.current.room.phase).toBe(PHASES.LOBBY);
  });

  it('castVote is ignored for PM', async () => {
    const { result } = renderHook(() => useRoom());
    await act(async () => {
      await result.current.startAsPm('Ana');
    });
    act(() => {
      result.current.setStory('T', 'D');
      result.current.openVoting();
      result.current.castVote('5');
    });
    expect(result.current.room._myVote).toBeUndefined();
  });

  it('guest castVote sends vote over data channel', async () => {
    const { result } = renderHook(() => useRoom());

    await act(async () => {
      await result.current.startAsDev('Bruno', 'ROOMCODE');
    });

    // Simulate room state in voting from host
    act(() => {
      // push state through guest handler if available
      const handlers = mockWireDataChannel.mock.calls
        .map((c) => c[1])
        .filter(Boolean);
      // Manually set room for castVote gate by simulating guest state message
      // via the last guest onMessage if wire was called from ondatachannel
    });

    // Force local room voting phase by reassigning through guest path:
    // connectAsDev sets room null until state message. Inject state:
    await act(async () => {
      // Find subscribe callbacks and ensure connection path creates ondatachannel
      const pc = await mockCreatePeerConnection.mock.results[
        mockCreatePeerConnection.mock.results.length - 1
      ]?.value;
      if (pc?.ondatachannel) {
        const channel = {
          readyState: 'open',
          __role: 'guest',
          send: vi.fn(),
        };
        pc.ondatachannel({ channel });
        // open channel
        const wireCall = mockWireDataChannel.mock.calls.find(
          (c) => c[0] === channel
        );
        wireCall?.[1]?.onOpen?.(channel);
        wireCall?.[1]?.onMessage?.({
          type: 'state',
          state: {
            roomCode: 'ROOMCODE',
            phase: PHASES.VOTING,
            pmPeerId: 'p-pm',
            pmName: 'Ana',
            story: { title: 'T', description: 'D' },
            participants: {
              [result.current.local.peerId]: {
                peerId: result.current.local.peerId,
                name: 'Bruno',
                role: 'dev',
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
        });
      }
    });

    await waitFor(() => {
      expect(result.current.room?.phase).toBe(PHASES.VOTING);
    });

    mockSendJson.mockClear();
    act(() => {
      result.current.castVote('8');
    });

    expect(result.current.room._myVote).toBe('8');
    expect(mockSendJson).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'vote', value: '8' })
    );
  });
});
