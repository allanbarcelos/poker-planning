import { useMemo } from 'react';
import { ROLES } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';
import CardDeck from './CardDeck';

export default function VotingPanel({ room, local, castVote, revealVotes }) {
  const { t } = useI18n();
  const isPm = local?.role === ROLES.PM;
  const myVote = room?._myVote ?? null;

  const { allVoted, votedCount, devCount } = useMemo(() => {
    const devs = Object.values(room?.participants || {}).filter(
      (p) => p.role === ROLES.DEV
    );
    const voted = devs.filter((p) => p.hasVoted);
    return {
      devCount: devs.length,
      votedCount: voted.length,
      allVoted: devs.length > 0 && voted.length === devs.length,
    };
  }, [room]);

  if (isPm) {
    const pct = devCount ? Math.round((votedCount / devCount) * 100) : 0;
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <h2 className="h6 mb-0">
            <i className="bi bi-bar-chart me-2" aria-hidden="true" />
            {t('voting.inProgress')}
          </h2>
          <span className="badge text-bg-secondary">
            {t('voting.votesCount', { voted: votedCount, total: devCount })}
          </span>
        </div>
        <div className="card-body">
          <p className="text-muted">{t('voting.pmNoVote')}</p>
          <div
            className="progress mb-3"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <button
            type="button"
            className="btn btn-success"
            onClick={revealVotes}
            disabled={votedCount === 0}
          >
            <i className="bi bi-eye me-1" aria-hidden="true" />
            {allVoted ? t('voting.reveal') : t('voting.revealAnyway')}
          </button>
          {!devCount && (
            <div className="alert alert-warning mt-3 mb-0 py-2" role="alert">
              <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
              {t('voting.noDevs')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 className="h6 mb-0">
          <i className="bi bi-hand-index me-2" aria-hidden="true" />
          {t('voting.yourEstimate')}
        </h2>
        {myVote ? (
          <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
            <i className="bi bi-check-lg" aria-hidden="true" />
            {myVote === '☕' ? (
              <>
                {t('voting.youVoted', { vote: '' }).trim()}
                <i className="bi bi-cup-hot" aria-label="coffee" />
              </>
            ) : (
              t('voting.youVoted', { vote: myVote })
            )}
          </span>
        ) : (
          <span className="badge text-bg-secondary">{t('voting.pickCard')}</span>
        )}
      </div>
      <div className="card-body">
        <p className="text-muted">{t('voting.secretHint')}</p>
        <CardDeck selected={myVote} onSelect={castVote} />
      </div>
    </div>
  );
}
