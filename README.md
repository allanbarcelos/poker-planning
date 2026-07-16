# Poker Planning

[Português (Brasil)](./README.pt.md)

**Live:** [https://allanbarcelos.github.io/poker-planning/](https://allanbarcelos.github.io/poker-planning/)

Multiplayer Planning Poker (Scrum) that runs in the browser with **React** + **WebRTC P2P**.

Whoever opens the room is the **Project Manager** (does not vote). **Devs** join with the room code, read the task, vote in silence, and the PM reveals the result, sets the final estimate, and comments.

Demo stack inspired by [battleship-game](https://github.com/allanbarcelos/battleship-game): no application backend — temporary signaling via [ntfy.sh](https://ntfy.sh), session traffic over peer-to-peer.

## Flow

1. **PM** creates the room and shares the code.
2. **Devs** join with name + code.
3. PM writes the **task description** and sends it for the team to read.
4. PM **opens voting**.
5. Each dev picks a card (`0 ½ 1 2 3 5 8 13 21 ? ☕`).
6. When everyone has voted (or the PM forces it), **reveal** votes + average/mode.
7. PM sets the **final estimate**, comments, and moves on to the next task.

## Stack

- React 19 + Vite
- Vanilla WebRTC (`RTCPeerConnection` + `RTCDataChannel`)
- Signaling: ntfy.sh (SDP + ICE)
- Topology: **star** (PM = authoritative host; devs connect only to the PM)

## Run locally

```bash
cd poker-planning
npm install
npm run dev
```

Open two tabs (or two browsers): create the room as PM in one, join as Dev with the code in the other.

```bash
npm run build   # output in dist/
npm run preview
```

## Auto-reconnect

Session state is stored in `sessionStorage` (same browser tab):

| Role | On reload (F5) |
|------|----------------|
| **PM** | Restores phase, task, votes, history; reopens the ntfy lobby and waits for devs |
| **Dev** | Reuses the same `peerId`/name, sends hello again, and re-enters the room |

If the P2P connection drops mid-round, the **dev** retries with backoff (up to 8 attempts). The local secret vote is resent to the PM when voting is still open.

Clicking **Leave** clears the saved session.

## Deploy on GitHub Pages

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publishes on every push to `main`/`master`.

1. Create the repository on GitHub and push this project.
2. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. After a green workflow run, the app is at:
   `https://<user>.github.io/<repo-name>/`

The build uses `VITE_BASE=/<repo>/` so assets resolve under the project site path.

## Roles

| Role | Can |
|------|-----|
| **PM (host)** | Create room, send task, open voting, reveal, final estimate, comment, next |
| **Dev (guest)** | Join, read task, vote (secret until reveal) |

## Architecture: WebRTC + ntfy

There is **no application backend**. Browsers talk to each other over **WebRTC DataChannels**. [ntfy.sh](https://ntfy.sh) is used only as a **short-lived signaling bus** so peers can exchange SDP offers/answers and ICE candidates until the P2P link is up. After the DataChannel opens, ntfy is no longer needed for that peer.

### Topology (star)

```
                    +----------------------------------+
                    |          PM (host)               |
                    |  Authoritative state             |
                    |  1 RTCPeerConnection per dev     |
                    |  Broadcasts state snapshots      |
                    +----------------+-----------------+
                                     ^
                 DataChannel         |         DataChannel
            +------------------------+------------------------+
            |                        |                        |
            |                        |                        |
       +----+----+              +----+----+              +----+----+
       |  Dev A  |              |  Dev B  |              |  Dev C  |
       +---------+              +---------+              +---------+
```

- Devs **do not** connect to each other.
- Only the **PM** owns room state (phase, story, votes, history).
- Guests send small messages (`join`, `vote`, `leave`); the host applies them and **broadcasts** a sanitized `state` snapshot to every open channel.

### Why ntfy?

WebRTC needs a way for two browsers to find each other before a direct path exists. ntfy topics act like temporary mailboxes:

```
  Dev                         ntfy.sh                         PM
   |                             |                             |
   |  POST hello  -------------> |  poker-lobby-{roomCode}     |
   |                             |  ---------------- SSE ----> |
   |                             |                             |
   |                             |  poker-sig-{room}-{peerId}  |
   |  <---------- SSE offer ---- | <---- POST offer / ICE ---- |
   |  POST answer / ICE -------> |  --------- SSE -----------> |
   |  <---------- SSE ICE ------ | <---- POST ICE ------------ |
   |                             |                             |
```

| Topic | Who listens | Payload |
|-------|-------------|---------|
| `poker-lobby-{roomCode}` | PM | Dev `hello` (peerId + name) |
| `poker-sig-{roomCode}-{peerId}` | That host↔dev pair | `offer` / `answer` / `ice` |

Messages are published with HTTP `POST` and consumed via **SSE** (`EventSource`). Topics are public and unauthenticated — treat them as **setup only**, not as a secure chat channel.

### Connection handshake (one dev joining)

```
 PM creates room, SSE on lobby topic
              |
              v
 Dev  --POST hello (lobby)-->  ntfy  --SSE hello-->  PM
              |                                       |
              |                          create RTCPeerConnection
              |                          + DataChannel "poker"
              |                                       |
 Dev  <--SSE offer-------------- ntfy  <--POST offer-- PM
              |
 Dev  --POST answer------------> ntfy  --SSE answer--> PM
              |
 Dev  --POST ICE---------------> ntfy  --SSE ICE----> PM
 Dev  <--SSE ICE---------------- ntfy  <--POST ICE---- PM
              |
              v
     RTC DataChannel open (P2P)
     ntfy no longer needed for this peer
              |
              v
 Dev  --join / vote / leave-->  PM  --state snapshots-->  Dev
```

Step by step:

1. **PM creates the room** → generates `roomCode`, opens SSE on the **lobby** topic.
2. **Dev joins with the code** → generates a stable `peerId`, posts periodic `hello` to the lobby, and opens SSE on its **signal** topic.
3. **PM receives hello** → creates an `RTCPeerConnection` (STUN/TURN via a small credentials endpoint, with public STUN fallback), creates a DataChannel named `poker`, posts an **SDP offer** to `poker-sig-{room}-{peerId}`.
4. **Dev receives offer** → sets remote description, creates **SDP answer**, posts it back on the same signal topic.
5. Both sides exchange **ICE candidates** on that topic until the browser finds a path (direct or via TURN when needed).
6. When the **DataChannel opens**:
   - Dev sends `{ type: "join", name }` (and resends a pending vote if reconnecting mid-voting).
   - PM marks the participant connected and starts sending `{ type: "state", state }` whenever room state changes.
7. Signaling subscriptions for that peer can be torn down; further traffic is **only P2P JSON** over the DataChannel.

### What travels where

```
  Bootstrap WebRTC
         |
         v
  +---------------------------+
  |  ntfy (signaling only)    |
  |  - hello                  |
  |  - SDP offer / answer     |
  |  - ICE candidates         |
  +------------+--------------+
               |  DataChannel open
               v
  +---------------------------+
  |  DataChannel (session)    |
  |  - state snapshots        |
  |  - join                   |
  |  - vote                   |
  |  - leave                  |
  +------------+--------------+
               |
               v
     Planning Poker app protocol
```

| Path | Carries |
|------|---------|
| **ntfy (signaling)** | SDP, ICE, hello — enough to bootstrap WebRTC |
| **DataChannel (session)** | App protocol: `state`, `join`, `vote`, `leave` |

During **voting**, the host’s broadcast **hides card values** (`hasVoted` only). On **reveal**, votes and stats are included in the snapshot.

### Reconnect

```
 DataChannel drops
        |
        v
  +------------------------------------------+
  |  Loop: up to 8 attempts, exp. backoff    |
  |                                          |
  |  Dev --POST hello (same peerId)--> ntfy  |
  |  ntfy --SSE hello----------------> PM    |
  |  PM  --POST new offer------------> ntfy  |
  |  ntfy --SSE offer----------------> Dev   |
  |  Dev --POST answer + ICE---------> ntfy  |
  |  ntfy --SSE answer + ICE---------> PM    |
  +------------------------------------------+
        |
        v
  DataChannel open again
        |
        v
  Dev --join (+ pending vote if still voting)--> PM
  PM  --state----------------------------------> Dev
```

If a DataChannel drops, the **dev** retries the full hello + signal handshake with exponential backoff (up to 8 attempts), keeping the same `peerId`. The PM treats a new hello from a known id as reconnect and re-offers a fresh peer connection. Session restore after F5 uses `sessionStorage` so the PM reopens the lobby and devs re-hello without inventing a new identity.

## Structure

```
src/
  components/   # UI (Home, Room, Story, Voting, Reveal…)
  hooks/useRoom.js  # room state + WebRTC
  lib/          # constants, signaling, webrtc, utils
  styles/
```

## Limitations

- If the **PM closes the tab for a long time** without returning, devs stay offline until they reopen (they are the authoritative host).
- Restore works on the **same tab** (`sessionStorage`), not across browsers.
- ntfy.sh is public: use long codes and do not put sensitive data in signaling.
- Best suited for small teams (e.g. up to ~12 devs).

## License

[MIT](./LICENSE)
