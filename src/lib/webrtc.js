import { TURN_CREDENTIALS_URL } from './constants';

export async function fetchIceServers() {
  try {
    const res = await fetch(TURN_CREDENTIALS_URL);
    if (!res.ok) throw new Error('turn-fetch-failed');
    return await res.json();
  } catch {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
  }
}

export async function createPeerConnection(handlers = {}) {
  const iceServers = await fetchIceServers();
  const pc = new RTCPeerConnection({ iceServers });

  pc.onicecandidate = ({ candidate }) => {
    if (candidate && handlers.onIceCandidate) {
      handlers.onIceCandidate(candidate.toJSON());
    }
  };

  pc.onconnectionstatechange = () => {
    handlers.onConnectionStateChange?.(pc.connectionState);
  };

  return pc;
}

export function wireDataChannel(channel, handlers = {}) {
  channel.binaryType = 'arraybuffer';

  channel.onopen = () => handlers.onOpen?.(channel);
  channel.onclose = () => handlers.onClose?.(channel);
  channel.onerror = (err) => handlers.onError?.(err);

  channel.onmessage = ({ data }) => {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : null;
      if (msg) handlers.onMessage?.(msg);
    } catch {
      /* ignore malformed */
    }
  };

  return channel;
}

export function sendJson(channel, payload) {
  if (!channel || channel.readyState !== 'open') return false;
  try {
    channel.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
