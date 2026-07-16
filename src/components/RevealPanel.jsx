import { useEffect, useState } from 'react';
import { ROLES } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';
import CardDeck from './CardDeck';

function VoteValue({ value }) {
  if (value === '☕') {
    return <i className="bi bi-cup-hot" aria-label="coffee break" />;
  }
  return value;
}

export default function RevealPanel({
  room,
  local,
  setFinalAndComment,
  nextRound,
}) {
  const { t } = useI18n();
  const isPm = local?.role === ROLES.PM;
  const stats = room?.stats;
  const [finalScore, setFinalScore] = useState(room?.finalScore || '');
  const [comment, setComment] = useState(room?.pmComment || '');

  useEffect(() => {
    setFinalScore(room?.finalScore || '');
    setComment(room?.pmComment || '');
  }, [room?.finalScore, room?.pmComment]);

  const votes = Object.entries(room?.participants || {})
    .filter(([, p]) => p.role === ROLES.DEV && p.vote != null)
    .map(([, p]) => ({ name: p.name, vote: p.vote }));

  function save(e) {
    e.preventDefault();
    setFinalAndComment(finalScore, comment);
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 className="h6 mb-0">
          <i className="bi bi-eye me-2" aria-hidden="true" />
          {t('reveal.title')}
        </h2>
        {room?.finalScore && (
          <span className="badge text-bg-primary d-inline-flex align-items-center gap-1">
            {room.finalScore === '☕' ? (
              <>
                {t('reveal.finalScore', { score: '' }).trim()}
                <i className="bi bi-cup-hot" aria-label="coffee" />
              </>
            ) : (
              t('reveal.finalScore', { score: room.finalScore })
            )}
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3">
            <div className="border rounded p-3 text-center h-100">
              <div className="text-muted small">{t('reveal.average')}</div>
              <div className="fs-4 fw-bold">{stats?.average ?? '—'}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded p-3 text-center h-100">
              <div className="text-muted small">{t('reveal.mode')}</div>
              <div className="fs-4 fw-bold">
                <VoteValue value={stats?.mode ?? '—'} />
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded p-3 text-center h-100">
              <div className="text-muted small">{t('reveal.suggestion')}</div>
              <div className="fs-4 fw-bold">
                <VoteValue value={stats?.nearest ?? '—'} />
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded p-3 text-center h-100">
              <div className="text-muted small">{t('reveal.votes')}</div>
              <div className="fs-4 fw-bold">{stats?.count ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {votes.length === 0 ? (
            <p className="text-muted mb-0">{t('reveal.noVotes')}</p>
          ) : (
            votes.map((v) => (
              <div
                key={v.name + v.vote}
                className="d-inline-flex align-items-center gap-2 border rounded-pill ps-3 pe-1 py-1"
              >
                <span className="small">{v.name}</span>
                <span className="vote-chip-card">
                  <VoteValue value={v.vote} />
                </span>
              </div>
            ))
          )}
        </div>

        {isPm ? (
          <form onSubmit={save}>
            <div className="mb-3">
              <label className="form-label">{t('reveal.finalDecision')}</label>
              <CardDeck
                selected={finalScore}
                onSelect={setFinalScore}
                highlight={stats?.nearest}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="pm-comment" className="form-label">
                {t('reveal.pmComment')}
              </label>
              <textarea
                id="pm-comment"
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('reveal.commentPlaceholder')}
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                {t('reveal.save')}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={nextRound}>
                <i className="bi bi-arrow-right-circle me-1" aria-hidden="true" />
                {t('reveal.nextTask')}
              </button>
            </div>
          </form>
        ) : (
          <div className="border rounded p-3 bg-light">
            {room?.pmComment ? (
              <>
                <h3 className="h6">{t('reveal.pmComment')}</h3>
                <p className="mb-0">{room.pmComment}</p>
              </>
            ) : (
              <p className="text-muted mb-0">
                <i className="bi bi-hourglass-split me-1" aria-hidden="true" />
                {t('reveal.waitingPm')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
