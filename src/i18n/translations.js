/** @typedef {'en' | 'pt' | 'fr'} Locale */

export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'fr', label: 'Français', short: 'FR' },
];

export const DEFAULT_LOCALE = 'en';

export const translations = {
  en: {
    // App
    'app.restoring': 'Restoring session…',
    'app.restoringHint': 'Reconnecting to the room saved in this browser.',

    // Home
    'home.tagline': 'Multiplayer Scrum estimation · Browser P2P',
    'home.tabCreate': 'Open room (PM)',
    'home.tabJoin': 'Join (Dev)',
    'home.yourName': 'Your name',
    'home.namePlaceholderPm': 'e.g. Ana (PM)',
    'home.namePlaceholderDev': 'e.g. Bruno',
    'home.roomCode': 'Room code',
    'home.roomCodePlaceholder': 'ABC12XYZ',
    'home.connecting': 'Connecting…',
    'home.createRoom': 'Create room as Project Manager',
    'home.joinRoom': 'Join room',
    'home.howItWorks': 'How it works',
    'home.step1': 'The PM opens the room and shares the code.',
    'home.step2': 'Devs join with the code and their name.',
    'home.step3': 'The PM writes the task and sends it for reading.',
    'home.step4': 'The PM opens voting; each dev picks a card.',
    'home.step5': 'When everyone has voted, the PM reveals, sets the score, and comments.',
    'home.footerNote':
      'No app server: connection via WebRTC (P2P) with ntfy.sh signaling.',

    // Room
    'room.youArePm': 'You are the Project Manager',
    'room.devLabel': 'Dev · {name}',
    'room.room': 'Room',
    'room.copyCode': 'Copy code',
    'room.copied': 'Copied!',
    'room.copy': 'Copy',
    'room.leave': 'Leave',
    'room.connectingPm': 'Connecting to the Project Manager…',
    'room.connectingPmHint':
      'Confirm the PM has the room open and the code is correct.',
    'room.nextStep': 'Next step',
    'room.nextStepBody':
      'Share code {code} with the team. When they are in the room, write the task description and send it for reading.',
    'room.waitingPm': 'Waiting for the PM',
    'room.waitingPmBody':
      'The Project Manager will send the task and open voting.',
    'room.history': 'Session history',
    'room.untitled': 'Untitled',

    // Phases
    'phase.lobby': 'Lobby',
    'phase.story': 'Reading the task',
    'phase.voting': 'Voting',
    'phase.reveal': 'Results',

    // Participants
    'participants.title': 'Participants',
    'participants.votedCount': '{voted}/{total} voted',
    'participants.you': ' (you)',
    'participants.voted': 'Voted',
    'participants.waitingDevs': 'Waiting for developers to join…',

    // Story
    'story.title': 'Task',
    'story.pmWrites': 'PM writes · team reads',
    'story.fieldTitle': 'Title',
    'story.titlePlaceholder': 'e.g. Login with Google OAuth',
    'story.fieldDescription': 'Description',
    'story.descPlaceholder': 'Acceptance criteria, risks, links…',
    'story.sendToTeam': 'Send for the team to read',
    'story.openVoting': 'Open voting',
    'story.readCarefully': 'Read carefully',
    'story.voteBasedOnThis': 'Vote based on this',
    'story.notSentYet': 'The PM has not sent the task description yet.',
    'story.noTitle': 'Untitled',
    'story.noDescription': 'No additional description.',

    // Voting
    'voting.inProgress': 'Voting in progress',
    'voting.votesCount': '{voted}/{total} votes',
    'voting.pmNoVote':
      'You are the Project Manager and do not vote. Wait for the devs or reveal when ready.',
    'voting.reveal': 'Reveal votes',
    'voting.revealAnyway': 'Reveal anyway',
    'voting.noDevs': 'No devs in the room — invite the team with the code.',
    'voting.yourEstimate': 'Your estimate',
    'voting.youVoted': 'You voted: {vote}',
    'voting.pickCard': 'Pick a card',
    'voting.secretHint':
      'Your vote is secret until the PM reveals. You can change your card while voting is open.',

    // Reveal
    'reveal.title': 'Round results',
    'reveal.finalScore': 'Final score: {score}',
    'reveal.average': 'Average',
    'reveal.mode': 'Mode',
    'reveal.suggestion': 'Suggestion',
    'reveal.votes': 'Votes',
    'reveal.noVotes': 'No votes recorded this round.',
    'reveal.finalDecision': 'Final score (your decision)',
    'reveal.pmComment': 'PM comment',
    'reveal.commentPlaceholder':
      'e.g. Settled on 5 — legacy SSO risk is on Bruno.',
    'reveal.save': 'Save score and comment',
    'reveal.nextTask': 'Next task',
    'reveal.waitingPm': 'Waiting for the PM to set the final score and comment…',

    // Cards
    'deck.ariaLabel': 'Estimation deck',

    // Language
    'lang.label': 'Language',
    'lang.en': 'English',
    'lang.pt': 'Português',
    'lang.fr': 'Français',

    // Status / connection (useRoom keys)
    'status.roomCreated': 'Room created — waiting for developers…',
    'status.sessionRestored': 'Session restored — waiting for devs to reconnect…',
    'status.userJoined': '{name} joined / reconnected',
    'status.devConnected': 'Dev connected',
    'status.reconnecting': 'Reconnecting… ({attempt}/{max})',
    'status.reconnectFailed': 'Could not reconnect. Leave and join again.',
    'status.reconnectingPm': 'Reconnecting to the PM…',
    'status.connectingRoom': 'Connecting to the room…',
    'status.reconnected': 'Reconnected',
    'status.connected': 'Connected',
    'status.disconnectedPm': 'Disconnected from the PM',
    'status.restoringSession': 'Restoring session…',
    'status.storySent': 'Task sent — team can read',
    'status.votingOpen': 'Voting open',
    'status.votesRevealed': 'Votes revealed',
    'status.readyNext': 'Ready for the next task',

    'conn.host': 'Host',
    'conn.offline': 'Offline',
    'conn.reconnecting': 'Reconnecting…',
    'conn.connecting': 'Connecting…',
    'conn.p2p': 'P2P',

    'error.invalidCode': 'Invalid room code',
  },

  pt: {
    'app.restoring': 'Restaurando sessão…',
    'app.restoringHint': 'Reconectando à sala salva neste navegador.',

    'home.tagline': 'Estimativa Scrum multiplayer · P2P no navegador',
    'home.tabCreate': 'Abrir sala (PM)',
    'home.tabJoin': 'Entrar (Dev)',
    'home.yourName': 'Seu nome',
    'home.namePlaceholderPm': 'Ex: Ana (PM)',
    'home.namePlaceholderDev': 'Ex: Bruno',
    'home.roomCode': 'Código da sala',
    'home.roomCodePlaceholder': 'ABC12XYZ',
    'home.connecting': 'Conectando…',
    'home.createRoom': 'Criar sala como Project Manager',
    'home.joinRoom': 'Entrar na sala',
    'home.howItWorks': 'Como funciona',
    'home.step1': 'O PM abre a sala e compartilha o código.',
    'home.step2': 'Os devs entram com o código e o nome.',
    'home.step3': 'O PM escreve a tarefa e envia para leitura.',
    'home.step4': 'O PM abre a votação; cada dev escolhe uma carta.',
    'home.step5': 'Quando todos votam, o PM revela, define a nota e comenta.',
    'home.footerNote':
      'Sem servidor de app: conexão via WebRTC (P2P) com sinalização ntfy.sh.',

    'room.youArePm': 'Você é o Project Manager',
    'room.devLabel': 'Dev · {name}',
    'room.room': 'Sala',
    'room.copyCode': 'Copiar código',
    'room.copied': 'Copiado!',
    'room.copy': 'Copiar',
    'room.leave': 'Sair',
    'room.connectingPm': 'Conectando ao Project Manager…',
    'room.connectingPmHint':
      'Confirme que o PM está com a sala aberta e o código está correto.',
    'room.nextStep': 'Próximo passo',
    'room.nextStepBody':
      'Compartilhe o código {code} com o time. Quando estiverem na sala, escreva a descrição da tarefa e envie para leitura.',
    'room.waitingPm': 'Aguardando o PM',
    'room.waitingPmBody':
      'O Project Manager vai enviar a tarefa e abrir a votação.',
    'room.history': 'Histórico da sessão',
    'room.untitled': 'Sem título',

    'phase.lobby': 'Lobby',
    'phase.story': 'Leitura da tarefa',
    'phase.voting': 'Votação',
    'phase.reveal': 'Resultado',

    'participants.title': 'Participantes',
    'participants.votedCount': '{voted}/{total} votaram',
    'participants.you': ' (você)',
    'participants.voted': 'Votou',
    'participants.waitingDevs': 'Aguardando desenvolvedores entrarem…',

    'story.title': 'Tarefa',
    'story.pmWrites': 'PM escreve · time lê',
    'story.fieldTitle': 'Título',
    'story.titlePlaceholder': 'Ex: Login com OAuth Google',
    'story.fieldDescription': 'Descrição',
    'story.descPlaceholder': 'Critérios de aceite, riscos, links…',
    'story.sendToTeam': 'Enviar para o time ler',
    'story.openVoting': 'Abrir votação',
    'story.readCarefully': 'Leia com atenção',
    'story.voteBasedOnThis': 'Vote com base nisto',
    'story.notSentYet': 'O PM ainda não enviou a descrição da tarefa.',
    'story.noTitle': 'Sem título',
    'story.noDescription': 'Sem descrição adicional.',

    'voting.inProgress': 'Votação em andamento',
    'voting.votesCount': '{voted}/{total} votos',
    'voting.pmNoVote':
      'Você é o Project Manager e não vota. Aguarde os devs ou revele quando quiser.',
    'voting.reveal': 'Revelar votos',
    'voting.revealAnyway': 'Revelar mesmo assim',
    'voting.noDevs': 'Nenhum dev na sala — convide o time com o código.',
    'voting.yourEstimate': 'Sua estimativa',
    'voting.youVoted': 'Você votou: {vote}',
    'voting.pickCard': 'Escolha uma carta',
    'voting.secretHint':
      'O voto é secreto até o PM revelar. Você pode trocar a carta enquanto a votação estiver aberta.',

    'reveal.title': 'Resultado da rodada',
    'reveal.finalScore': 'Nota final: {score}',
    'reveal.average': 'Média',
    'reveal.mode': 'Moda',
    'reveal.suggestion': 'Sugestão',
    'reveal.votes': 'Votos',
    'reveal.noVotes': 'Nenhum voto registrado nesta rodada.',
    'reveal.finalDecision': 'Nota final (sua decisão)',
    'reveal.pmComment': 'Comentário do PM',
    'reveal.commentPlaceholder':
      'Ex: Ficamos em 5 — risco de SSO legado fica no Bruno.',
    'reveal.save': 'Salvar nota e comentário',
    'reveal.nextTask': 'Próxima tarefa',
    'reveal.waitingPm': 'Aguardando o PM definir a nota final e comentar…',

    'deck.ariaLabel': 'Baralho de estimativa',

    'lang.label': 'Idioma',
    'lang.en': 'English',
    'lang.pt': 'Português',
    'lang.fr': 'Français',

    'status.roomCreated': 'Sala criada — aguardando desenvolvedores…',
    'status.sessionRestored': 'Sessão restaurada — aguardando devs reconectarem…',
    'status.userJoined': '{name} reconectou / entrou',
    'status.devConnected': 'Dev conectado',
    'status.reconnecting': 'Reconectando… ({attempt}/{max})',
    'status.reconnectFailed': 'Não foi possível reconectar. Use Sair e entre de novo.',
    'status.reconnectingPm': 'Reconectando ao PM…',
    'status.connectingRoom': 'Conectando à sala…',
    'status.reconnected': 'Reconectado',
    'status.connected': 'Conectado',
    'status.disconnectedPm': 'Desconectado do PM',
    'status.restoringSession': 'Restaurando sessão…',
    'status.storySent': 'Tarefa enviada — equipe pode ler',
    'status.votingOpen': 'Votação aberta',
    'status.votesRevealed': 'Votos revelados',
    'status.readyNext': 'Pronto para a próxima tarefa',

    'conn.host': 'Host',
    'conn.offline': 'Offline',
    'conn.reconnecting': 'Reconectando…',
    'conn.connecting': 'Conectando…',
    'conn.p2p': 'P2P',

    'error.invalidCode': 'Código da sala inválido',
  },

  fr: {
    'app.restoring': 'Restauration de la session…',
    'app.restoringHint':
      'Reconnexion à la salle enregistrée dans ce navigateur.',

    'home.tagline': 'Estimation Scrum multijoueur · P2P dans le navigateur',
    'home.tabCreate': 'Ouvrir une salle (PM)',
    'home.tabJoin': 'Rejoindre (Dev)',
    'home.yourName': 'Votre nom',
    'home.namePlaceholderPm': 'ex. : Ana (PM)',
    'home.namePlaceholderDev': 'ex. : Bruno',
    'home.roomCode': 'Code de la salle',
    'home.roomCodePlaceholder': 'ABC12XYZ',
    'home.connecting': 'Connexion…',
    'home.createRoom': 'Créer la salle en tant que Project Manager',
    'home.joinRoom': 'Rejoindre la salle',
    'home.howItWorks': 'Comment ça marche',
    'home.step1': 'Le PM ouvre la salle et partage le code.',
    'home.step2': 'Les devs rejoignent avec le code et leur nom.',
    'home.step3': 'Le PM rédige la tâche et l’envoie pour lecture.',
    'home.step4': 'Le PM ouvre le vote ; chaque dev choisit une carte.',
    'home.step5':
      'Quand tout le monde a voté, le PM révèle, fixe la note et commente.',
    'home.footerNote':
      'Pas de serveur d’application : connexion via WebRTC (P2P) avec signalisation ntfy.sh.',

    'room.youArePm': 'Vous êtes le Project Manager',
    'room.devLabel': 'Dev · {name}',
    'room.room': 'Salle',
    'room.copyCode': 'Copier le code',
    'room.copied': 'Copié !',
    'room.copy': 'Copier',
    'room.leave': 'Quitter',
    'room.connectingPm': 'Connexion au Project Manager…',
    'room.connectingPmHint':
      'Vérifiez que le PM a la salle ouverte et que le code est correct.',
    'room.nextStep': 'Prochaine étape',
    'room.nextStepBody':
      'Partagez le code {code} avec l’équipe. Quand ils sont dans la salle, rédigez la description de la tâche et envoyez-la pour lecture.',
    'room.waitingPm': 'En attente du PM',
    'room.waitingPmBody':
      'Le Project Manager enverra la tâche et ouvrira le vote.',
    'room.history': 'Historique de la session',
    'room.untitled': 'Sans titre',

    'phase.lobby': 'Lobby',
    'phase.story': 'Lecture de la tâche',
    'phase.voting': 'Vote',
    'phase.reveal': 'Résultats',

    'participants.title': 'Participants',
    'participants.votedCount': '{voted}/{total} ont voté',
    'participants.you': ' (vous)',
    'participants.voted': 'A voté',
    'participants.waitingDevs': 'En attente des développeurs…',

    'story.title': 'Tâche',
    'story.pmWrites': 'Le PM écrit · l’équipe lit',
    'story.fieldTitle': 'Titre',
    'story.titlePlaceholder': 'ex. : Connexion OAuth Google',
    'story.fieldDescription': 'Description',
    'story.descPlaceholder': 'Critères d’acceptation, risques, liens…',
    'story.sendToTeam': 'Envoyer à l’équipe pour lecture',
    'story.openVoting': 'Ouvrir le vote',
    'story.readCarefully': 'Lisez attentivement',
    'story.voteBasedOnThis': 'Votez sur cette base',
    'story.notSentYet': 'Le PM n’a pas encore envoyé la description de la tâche.',
    'story.noTitle': 'Sans titre',
    'story.noDescription': 'Pas de description supplémentaire.',

    'voting.inProgress': 'Vote en cours',
    'voting.votesCount': '{voted}/{total} votes',
    'voting.pmNoVote':
      'Vous êtes le Project Manager et ne votez pas. Attendez les devs ou révélez quand vous voulez.',
    'voting.reveal': 'Révéler les votes',
    'voting.revealAnyway': 'Révéler quand même',
    'voting.noDevs':
      'Aucun dev dans la salle — invitez l’équipe avec le code.',
    'voting.yourEstimate': 'Votre estimation',
    'voting.youVoted': 'Vous avez voté : {vote}',
    'voting.pickCard': 'Choisissez une carte',
    'voting.secretHint':
      'Le vote est secret jusqu’à la révélation par le PM. Vous pouvez changer de carte tant que le vote est ouvert.',

    'reveal.title': 'Résultat du tour',
    'reveal.finalScore': 'Note finale : {score}',
    'reveal.average': 'Moyenne',
    'reveal.mode': 'Mode',
    'reveal.suggestion': 'Suggestion',
    'reveal.votes': 'Votes',
    'reveal.noVotes': 'Aucun vote enregistré pour ce tour.',
    'reveal.finalDecision': 'Note finale (votre décision)',
    'reveal.pmComment': 'Commentaire du PM',
    'reveal.commentPlaceholder':
      'ex. : On reste sur 5 — le risque SSO legacy est pour Bruno.',
    'reveal.save': 'Enregistrer la note et le commentaire',
    'reveal.nextTask': 'Tâche suivante',
    'reveal.waitingPm':
      'En attente que le PM fixe la note finale et commente…',

    'deck.ariaLabel': 'Jeu d’estimation',

    'lang.label': 'Langue',
    'lang.en': 'English',
    'lang.pt': 'Português',
    'lang.fr': 'Français',

    'status.roomCreated': 'Salle créée — en attente des développeurs…',
    'status.sessionRestored':
      'Session restaurée — en attente de la reconnexion des devs…',
    'status.userJoined': '{name} a rejoint / s’est reconnecté',
    'status.devConnected': 'Dev connecté',
    'status.reconnecting': 'Reconnexion… ({attempt}/{max})',
    'status.reconnectFailed':
      'Impossible de se reconnecter. Quittez et rejoignez à nouveau.',
    'status.reconnectingPm': 'Reconnexion au PM…',
    'status.connectingRoom': 'Connexion à la salle…',
    'status.reconnected': 'Reconnecté',
    'status.connected': 'Connecté',
    'status.disconnectedPm': 'Déconnecté du PM',
    'status.restoringSession': 'Restauration de la session…',
    'status.storySent': 'Tâche envoyée — l’équipe peut lire',
    'status.votingOpen': 'Vote ouvert',
    'status.votesRevealed': 'Votes révélés',
    'status.readyNext': 'Prêt pour la tâche suivante',

    'conn.host': 'Hôte',
    'conn.offline': 'Hors ligne',
    'conn.reconnecting': 'Reconnexion…',
    'conn.connecting': 'Connexion…',
    'conn.p2p': 'P2P',

    'error.invalidCode': 'Code de salle invalide',
  },
};
