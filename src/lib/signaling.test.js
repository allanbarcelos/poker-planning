import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  lobbyTopic,
  signalTopic,
  postSignal,
  subscribeTopic,
} from './signaling';
import { NTFY_BASE } from './constants';

describe('lobbyTopic / signalTopic', () => {
  it('builds lowercase lobby topic', () => {
    expect(lobbyTopic('AbC12XYZ')).toBe('poker-lobby-abc12xyz');
  });

  it('builds lowercase signal topic', () => {
    expect(signalTopic('ROOM1', 'P-ABC')).toBe('poker-sig-room1-p-abc');
  });
});

describe('postSignal', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs JSON payload to ntfy topic', async () => {
    await postSignal('my-topic', { type: 'hello', from: 'guest' });

    expect(fetch).toHaveBeenCalledWith(`${NTFY_BASE}/my-topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'hello', from: 'guest' }),
    });
  });

  it('swallows fetch errors', async () => {
    fetch.mockRejectedValueOnce(new Error('network'));
    await expect(
      postSignal('t', { type: 'x' })
    ).resolves.toBeUndefined();
  });
});

describe('subscribeTopic', () => {
  let lastEs;

  class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;

    constructor(url) {
      this.url = url;
      this.listeners = {};
      this.onerror = null;
      this.readyState = MockEventSource.OPEN;
      lastEs = this;
    }

    addEventListener(type, fn) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(fn);
    }

    close() {
      this.readyState = MockEventSource.CLOSED;
    }

    emit(type, data) {
      for (const fn of this.listeners[type] || []) {
        fn({ data });
      }
    }
  }

  beforeEach(() => {
    lastEs = null;
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens SSE with since query', () => {
    const cleanup = subscribeTopic('topic-a', {
      sinceSeconds: 30,
      onMessage: () => {},
    });
    expect(lastEs.url).toMatch(
      new RegExp(`${NTFY_BASE}/topic-a/sse\\?since=\\d+`)
    );
    cleanup();
    expect(lastEs.readyState).toBe(MockEventSource.CLOSED);
  });

  it('parses nested JSON and calls onMessage', async () => {
    const onMessage = vi.fn();
    subscribeTopic('t', { onMessage });

    lastEs.emit(
      'message',
      JSON.stringify({
        message: JSON.stringify({ type: 'hello', from: 'guest', peerId: 'p1' }),
      })
    );

    await vi.waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith({
        type: 'hello',
        from: 'guest',
        peerId: 'p1',
      });
    });
  });

  it('filters messages from filterFrom', async () => {
    const onMessage = vi.fn();
    subscribeTopic('t', { onMessage, filterFrom: 'host' });

    lastEs.emit(
      'message',
      JSON.stringify({
        message: JSON.stringify({ type: 'ice', from: 'host' }),
      })
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('ignores malformed payloads', async () => {
    const onMessage = vi.fn();
    subscribeTopic('t', { onMessage });
    lastEs.emit('message', 'not-json');
    await new Promise((r) => setTimeout(r, 20));
    expect(onMessage).not.toHaveBeenCalled();
  });
});
