# Poker Planning

[English](./README.md)

**Online:** [https://allanbarcelos.github.io/poker-planning/](https://allanbarcelos.github.io/poker-planning/)

Planning Poker (Scrum) multiplayer que roda no navegador com **React** + **WebRTC P2P**.

Quem abre a sala é o **Project Manager** (não vota). Os **devs** entram com o código, leem a tarefa, votam em silêncio e o PM revela o resultado, define a nota final e comenta.

Demo stack inspirada em [battleship-game](https://github.com/allanbarcelos/battleship-game): sem backend de aplicação — sinalização temporária via [ntfy.sh](https://ntfy.sh), tráfego da sessão em peer-to-peer.

## Fluxo

1. **PM** cria a sala e compartilha o código.
2. **Devs** entram com nome + código.
3. PM escreve a **descrição da tarefa** e envia para o time ler.
4. PM **abre a votação**.
5. Cada dev escolhe uma carta (`0 ½ 1 2 3 5 8 13 21 ? ☕`).
6. Quando todos votaram (ou PM força), **revela** votos + média/moda.
7. PM define a **nota final**, comenta e avança para a próxima tarefa.

## Stack

- React 19 + Vite
- Vanilla WebRTC (`RTCPeerConnection` + `RTCDataChannel`)
- Sinalização: ntfy.sh (SDP + ICE)
- Topologia: **estrela** (PM = host autoritativo; devs conectam só ao PM)

## Rodar localmente

```bash
cd poker-planning
npm install
npm run dev
```

Abra duas abas (ou dois browsers): em uma crie a sala como PM, na outra entre como Dev com o código.

```bash
npm run build   # saída em dist/
npm run preview
```

## Auto-reconexão

A sessão fica em `sessionStorage` (mesma aba do navegador):

| Papel | Ao recarregar (F5) |
|-------|--------------------|
| **PM** | Restaura fase, tarefa, votos, histórico; reabre o lobby ntfy e espera os devs |
| **Dev** | Reusa o mesmo `peerId`/nome, faz hello de novo e reentra na sala |

Se a conexão P2P cair no meio da rodada, o **dev** tenta reconectar com backoff (até 8 tentativas). O voto secreto local é reenviado ao PM quando a votação ainda estiver aberta.

Clicar em **Sair** limpa a sessão salva.

## Deploy no GitHub Pages

O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publica em cada push em `main`/`master`.

1. Crie o repositório no GitHub e faça o push deste projeto.
2. Em **Settings → Pages → Build and deployment**, escolha **GitHub Actions**.
3. Após o workflow verde, o app fica em:
   `https://<usuario>.github.io/<nome-do-repo>/`

O build usa `VITE_BASE=/<repo>/` para assets sob o path do project site.

## Papéis

| Papel | Pode |
|-------|------|
| **PM (host)** | Criar sala, enviar tarefa, abrir votação, revelar, nota final, comentário, próxima |
| **Dev (guest)** | Entrar, ler tarefa, votar (secreto até o reveal) |

## Arquitetura: WebRTC + ntfy

Não há **backend de aplicação**. Os navegadores falam entre si por **WebRTC DataChannels**. O [ntfy.sh](https://ntfy.sh) serve só como **barramento temporário de sinalização** para trocar ofertas/respostas SDP e candidatos ICE até o link P2P subir. Depois que o DataChannel abre, o ntfy deixa de ser necessário para aquele peer.

### Topologia (estrela)

```
                    +----------------------------------+
                    |          PM (host)               |
                    |  Estado autoritativo             |
                    |  1 RTCPeerConnection por dev     |
                    |  Difunde snapshots de state      |
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

- Devs **não** se conectam uns aos outros.
- Só o **PM** é dono do estado da sala (fase, tarefa, votos, histórico).
- Convidados enviam mensagens pequenas (`join`, `vote`, `leave`); o host aplica e **difunde** um snapshot `state` sanitizado em cada canal aberto.

### Por que ntfy?

O WebRTC precisa de um meio para dois browsers se encontrarem antes de existir um caminho direto. Tópicos ntfy funcionam como caixas de correio temporárias:

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

| Tópico | Quem escuta | Conteúdo |
|--------|-------------|----------|
| `poker-lobby-{roomCode}` | PM | `hello` do dev (peerId + nome) |
| `poker-sig-{roomCode}-{peerId}` | Par host↔dev | `offer` / `answer` / `ice` |

Mensagens são publicadas com HTTP `POST` e consumidas via **SSE** (`EventSource`). Os tópicos são públicos e sem autenticação — trate-os como **só setup**, não como canal seguro de conversa.

### Handshake de conexão (um dev entrando)

```
 PM cria a sala, SSE no tópico lobby
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
     RTC DataChannel aberto (P2P)
     ntfy não é mais necessário para este peer
              |
              v
 Dev  --join / vote / leave-->  PM  --snapshots de state-->  Dev
```

Passo a passo:

1. **PM cria a sala** → gera `roomCode`, abre SSE no tópico de **lobby**.
2. **Dev entra com o código** → gera um `peerId` estável, posta `hello` periódicos no lobby e abre SSE no tópico de **signal** dele.
3. **PM recebe o hello** → cria um `RTCPeerConnection` (STUN/TURN via endpoint de credenciais, com fallback para STUN público), cria um DataChannel `poker`, posta um **SDP offer** em `poker-sig-{room}-{peerId}`.
4. **Dev recebe o offer** → define a remote description, cria o **SDP answer** e posta de volta no mesmo tópico de signal.
5. Os dois lados trocam **candidatos ICE** nesse tópico até o browser achar um caminho (direto ou via TURN quando necessário).
6. Quando o **DataChannel abre**:
   - O dev envia `{ type: "join", name }` (e reenvia o voto pendente se reconectou no meio da votação).
   - O PM marca o participante como conectado e passa a enviar `{ type: "state", state }` sempre que o estado muda.
7. A assinatura de sinalização daquele peer pode ser encerrada; daí em diante o tráfego é **só JSON P2P** no DataChannel.

### O que viaja por onde

```
  Bootstrap WebRTC
         |
         v
  +---------------------------+
  |  ntfy (só sinalização)    |
  |  - hello                  |
  |  - SDP offer / answer     |
  |  - candidatos ICE         |
  +------------+--------------+
               |  DataChannel aberto
               v
  +---------------------------+
  |  DataChannel (sessão)     |
  |  - snapshots de state     |
  |  - join                   |
  |  - vote                   |
  |  - leave                  |
  +------------+--------------+
               |
               v
     Protocolo da app Planning Poker
```

| Caminho | Carrega |
|---------|---------|
| **ntfy (sinalização)** | SDP, ICE, hello — o necessário para bootstrap do WebRTC |
| **DataChannel (sessão)** | Protocolo da app: `state`, `join`, `vote`, `leave` |

Na **votação**, o broadcast do host **esconde o valor das cartas** (só `hasVoted`). No **reveal**, votos e estatísticas entram no snapshot.

### Reconexão

```
 DataChannel cai
        |
        v
  +------------------------------------------+
  |  Loop: até 8 tentativas, backoff exp.    |
  |                                          |
  |  Dev --POST hello (mesmo peerId)--> ntfy |
  |  ntfy --SSE hello----------------> PM    |
  |  PM  --POST novo offer-----------> ntfy  |
  |  ntfy --SSE offer----------------> Dev   |
  |  Dev --POST answer + ICE---------> ntfy  |
  |  ntfy --SSE answer + ICE---------> PM    |
  +------------------------------------------+
        |
        v
  DataChannel aberto de novo
        |
        v
  Dev --join (+ voto pendente se ainda em votação)--> PM
  PM  --state--------------------------------------> Dev
```

Se o DataChannel cair, o **dev** repete o handshake hello + signal com backoff exponencial (até 8 tentativas), mantendo o mesmo `peerId`. O PM trata um novo hello de um id conhecido como reconexão e reenvia um offer em uma conexão nova. Após F5, `sessionStorage` permite ao PM reabrir o lobby e aos devs reenviar hello sem inventar outra identidade.

## Estrutura

```
src/
  components/   # UI (Home, Room, Story, Voting, Reveal…)
  hooks/useRoom.js  # estado da sala + WebRTC
  lib/          # constants, signaling, webrtc, utils
  styles/
```

## Limitações

- Se o **PM fechar a aba por muito tempo** sem voltar, os devs ficam offline até ele reabrir (ele é o host autoritativo).
- Restauração vale na **mesma aba** (`sessionStorage`), não entre browsers.
- ntfy.sh é público: use códigos longos e não envie dados sensíveis na sinalização.
- Ideal para times pequenos (ex.: até ~12 devs).

## Licença

[MIT](./LICENSE)
