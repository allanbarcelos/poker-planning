import { ROLES } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';

export default function ParticipantList({ room, local }) {
  const { t } = useI18n();

  const list = Object.values(room?.participants || {}).sort((a, b) => {
    if (a.role === ROLES.PM) return -1;
    if (b.role === ROLES.PM) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const devs = list.filter((p) => p.role === ROLES.DEV);
  const votedCount = devs.filter((p) => p.hasVoted).length;

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 className="h6 mb-0">
          <i className="bi bi-people me-2" aria-hidden="true" />
          {t('participants.title')}
        </h2>
        {room?.phase === 'voting' && (
          <span className="badge text-bg-secondary">
            {t('participants.votedCount', {
              voted: votedCount,
              total: devs.length,
            })}
          </span>
        )}
      </div>
      <ul className="list-group list-group-flush">
        {list.map((p) => {
          const isMe = p.peerId === local?.peerId;
          return (
            <li
              key={p.peerId}
              className={`list-group-item d-flex justify-content-between align-items-center gap-2 ${
                !p.connected ? 'opacity-50' : ''
              }`}
            >
              <div className="d-flex align-items-center gap-2 min-w-0">
                <i
                  className={`bi ${
                    p.connected
                      ? 'bi-circle-fill text-success'
                      : 'bi-circle-fill text-danger'
                  }`}
                  style={{ fontSize: '0.55rem' }}
                  aria-hidden="true"
                />
                <span className="text-truncate">
                  {p.name}
                  {isMe ? t('participants.you') : ''}
                </span>
              </div>
              <div className="flex-shrink-0">
                {p.role === ROLES.PM ? (
                  <span className="badge text-bg-secondary">PM</span>
                ) : room?.phase === 'reveal' && p.vote != null ? (
                  <span className="badge text-bg-primary">
                    {p.vote === '☕' ? (
                      <i className="bi bi-cup-hot" aria-label="coffee" />
                    ) : (
                      p.vote
                    )}
                  </span>
                ) : room?.phase === 'voting' ? (
                  <span
                    className={`badge ${
                      p.hasVoted ? 'text-bg-success' : 'text-bg-warning'
                    }`}
                  >
                    {p.hasVoted ? (
                      <>
                        <i className="bi bi-check-lg me-1" aria-hidden="true" />
                        {t('participants.voted')}
                      </>
                    ) : (
                      <i className="bi bi-three-dots" aria-label="waiting" />
                    )}
                  </span>
                ) : (
                  <span className="badge text-bg-info">Dev</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!devs.length && (
        <div className="card-body py-2">
          <p className="text-muted small mb-0">{t('participants.waitingDevs')}</p>
        </div>
      )}
    </div>
  );
}
