import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchIceServers,
  createPeerConnection,
  wireDataChannel,
  sendJson,
} from './webrtc';
import { TURN_CREDENTIALS_URL } from './constants';

describe('fetchIceServers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns JSON from TURN credentials URL', async () => {
    const servers = [{ urls: 'turn:example.com' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => servers,
      })
    );

    await expect(fetchIceServers()).resolves.toEqual(servers);
    expect(fetch).toHaveBeenCalledWith(TURN_CREDENTIALS_URL);
  });

  it('falls back to public STUN on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));
    const servers = await fetchIceServers();
    expect(servers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });

  it('falls back when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false })
    );
    const servers = await fetchIceServers();
    expect(servers[0].urls).toContain('stun:');
  });
});

describe('createPeerConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates RTCPeerConnection with ice servers and wires handlers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ urls: 'stun:test' }],
      })
    );

    const onIceCandidate = vi.fn();
    const onConnectionStateChange = vi.fn();
    let capturedConfig;

    class MockPC {
      constructor(config) {
        capturedConfig = config;
        this.onicecandidate = null;
        this.onconnectionstatechange = null;
        this.connectionState = 'new';
      }
    }

    vi.stubGlobal('RTCPeerConnection', MockPC);

    const pc = await createPeerConnection({
      onIceCandidate,
      onConnectionStateChange,
    });

    expect(capturedConfig.iceServers).toEqual([{ urls: 'stun:test' }]);

    pc.onicecandidate({
      candidate: { toJSON: () => ({ candidate: 'c1' }) },
    });
    expect(onIceCandidate).toHaveBeenCalledWith({ candidate: 'c1' });

    pc.connectionState = 'connected';
    pc.onconnectionstatechange();
    expect(onConnectionStateChange).toHaveBeenCalledWith('connected');
  });

  it('ignores null ice candidates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );
    const onIceCandidate = vi.fn();
    class MockPC {
      constructor() {
        this.onicecandidate = null;
      }
    }
    vi.stubGlobal('RTCPeerConnection', MockPC);
    const pc = await createPeerConnection({ onIceCandidate });
    pc.onicecandidate({ candidate: null });
    expect(onIceCandidate).not.toHaveBeenCalled();
  });
});

describe('wireDataChannel', () => {
  function makeChannel() {
    return {
      binaryType: '',
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };
  }

  it('sets binaryType and forwards events', () => {
    const channel = makeChannel();
    const handlers = {
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
    };

    wireDataChannel(channel, handlers);
    expect(channel.binaryType).toBe('arraybuffer');

    channel.onopen();
    channel.onclose();
    channel.onerror(new Error('x'));
    channel.onmessage({ data: JSON.stringify({ type: 'join' }) });

    expect(handlers.onOpen).toHaveBeenCalledWith(channel);
    expect(handlers.onClose).toHaveBeenCalledWith(channel);
    expect(handlers.onError).toHaveBeenCalled();
    expect(handlers.onMessage).toHaveBeenCalledWith({ type: 'join' });
  });

  it('ignores non-JSON messages', () => {
    const channel = makeChannel();
    const onMessage = vi.fn();
    wireDataChannel(channel, { onMessage });
    channel.onmessage({ data: 'not-json' });
    channel.onmessage({ data: new ArrayBuffer(0) });
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe('sendJson', () => {
  it('returns false when channel missing or not open', () => {
    expect(sendJson(null, { a: 1 })).toBe(false);
    expect(sendJson({ readyState: 'connecting', send: vi.fn() }, { a: 1 })).toBe(
      false
    );
  });

  it('sends stringified payload when open', () => {
    const channel = { readyState: 'open', send: vi.fn() };
    expect(sendJson(channel, { type: 'vote', value: '5' })).toBe(true);
    expect(channel.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'vote', value: '5' })
    );
  });

  it('returns false when send throws', () => {
    const channel = {
      readyState: 'open',
      send: vi.fn(() => {
        throw new Error('closed');
      }),
    };
    expect(sendJson(channel, { x: 1 })).toBe(false);
  });
});
