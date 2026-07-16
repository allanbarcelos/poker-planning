import { NTFY_BASE } from './constants';

/**
 * ntfy.sh helpers
 * Used only during WebRTC setup (SDP + ICE). Closed after DataChannel opens.
 */

export function lobbyTopic(roomCode) {
  return `poker-lobby-${roomCode.toLowerCase()}`;
}

export function signalTopic(roomCode, peerId) {
  return `poker-sig-${roomCode.toLowerCase()}-${peerId.toLowerCase()}`;
}

export async function postSignal(topic, payload) {
  try {
    await fetch(`${NTFY_BASE}/${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort; WebRTC may still recover via other candidates
  }
}

/**
 * Subscribe to an ntfy SSE topic.
 * @returns cleanup function
 */
export function subscribeTopic(topic, { sinceSeconds = 60, onMessage, filterFrom }) {
  const sinceTs = Math.floor(Date.now() / 1000) - sinceSeconds;
  const es = new EventSource(`${NTFY_BASE}/${topic}/sse?since=${sinceTs}`);
  let chain = Promise.resolve();

  es.addEventListener('message', (e) => {
    let payload;
    try {
      const wrapper = JSON.parse(e.data);
      payload = JSON.parse(wrapper.message);
    } catch {
      return;
    }
    if (!payload) return;
    if (filterFrom && payload.from === filterFrom) return;

    chain = chain
      .then(() => onMessage(payload))
      .catch(() => {});
  });

  es.onerror = () => {
    // EventSource reconnects automatically; ignore transient errors
  };

  return () => {
    try {
      es.close();
    } catch {
      /* ignore */
    }
  };
}
