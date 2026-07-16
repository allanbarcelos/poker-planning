import { useState } from 'react';
import { ROLES } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from './LanguageSelector';
import ParticipantList from './ParticipantList';
import StoryPanel from './StoryPanel';
import VotingPanel from './VotingPanel';
import RevealPanel from './RevealPanel';

export default function Room({
  room,
  local,
  status,
  connLabel,
  setStory,
  openVoting,
  revealVotes,
  setFinalAndComment,
  nextRound,
  castVote,
  leaveRoom,
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const isPm = local?.role === ROLES.PM;
  const phase = room?.phase || 'lobby';

  async function copyCode() {
    const code = room?.roomCode || local?.roomCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const phaseLabel = t(`phase.${phase}`) || phase;
  const connText = connLabel ? t(connLabel) : '—';
  const isOffline = connLabel === 'conn.offline';

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center gap-2 mb-0">
            <i className="bi bi-suit-spade-fill" aria-hidden="true" />
            <span>
              <span className="d-block lh-1">Poker Planning</span>
              <small className="fw-normal text-white-50" style={{ fontSize: '0.75rem' }}>
                {isPm
                  ? t('room.youArePm')
                  : t('room.devLabel', { name: local?.name })}
              </small>
            </span>
          </span>

          <div className="d-flex flex-wrap align-items-center gap-2 ms-lg-auto">
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={copyCode}
              title={t('room.copyCode')}
            >
              <i className="bi bi-hash me-1" aria-hidden="true" />
              <span className="text-white-50 me-1">{t('room.room')}</span>
              <strong className="room-code">
                {room?.roomCode || local?.roomCode}
              </strong>
              <span className="ms-2 small">
                {copied ? (
                  <>
                    <i className="bi bi-check2 me-1" aria-hidden="true" />
                    {t('room.copied')}
                  </>
                ) : (
                  <>
                    <i className="bi bi-clipboard me-1" aria-hidden="true" />
                    {t('room.copy')}
                  </>
                )}
              </span>
            </button>

            <span
              className={`badge ${isOffline ? 'text-bg-danger' : 'text-bg-success'}`}
            >
              <i
                className={`bi ${isOffline ? 'bi-wifi-off' : 'bi-wifi'} me-1`}
                aria-hidden="true"
              />
              {connText}
            </span>

            <span className="badge text-bg-secondary">
              <i className="bi bi-flag me-1" aria-hidden="true" />
              {phaseLabel}
            </span>

            <LanguageSelector className="text-white" />

            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={leaveRoom}
            >
              <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
              {t('room.leave')}
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-3 flex-grow-1">
        {status && (
          <div className="alert alert-info py-2 d-flex align-items-center" role="status">
            <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
            {t(status)}
          </div>
        )}

        {!room && local?.role === ROLES.DEV && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">{t('room.connectingPm')}</span>
            </div>
            <p className="mb-1">{t('room.connectingPm')}</p>
            <p className="text-muted small mb-0">{t('room.connectingPmHint')}</p>
          </div>
        )}

        {room && (
          <div className="row g-3">
            <div className="col-12 col-lg-3">
              <ParticipantList room={room} local={local} />
            </div>

            <div className="col-12 col-lg-9">
              <div className="d-flex flex-column gap-3">
                {(phase === 'lobby' ||
                  phase === 'story' ||
                  phase === 'voting' ||
                  phase === 'reveal') && (
                  <StoryPanel
                    room={room}
                    local={local}
                    setStory={setStory}
                    openVoting={openVoting}
                  />
                )}

                {phase === 'voting' && (
                  <VotingPanel
                    room={room}
                    local={local}
                    castVote={castVote}
                    revealVotes={revealVotes}
                  />
                )}

                {phase === 'reveal' && (
                  <RevealPanel
                    room={room}
                    local={local}
                    setFinalAndComment={setFinalAndComment}
                    nextRound={nextRound}
                  />
                )}

                {phase === 'lobby' && isPm && (
                  <div className="card">
                    <div className="card-body">
                      <h2 className="h5 card-title">
                        <i className="bi bi-lightbulb me-2" aria-hidden="true" />
                        {t('room.nextStep')}
                      </h2>
                      <p className="card-text mb-0">
                        {t('room.nextStepBody', { code: room.roomCode })}
                      </p>
                    </div>
                  </div>
                )}

                {phase === 'lobby' && !isPm && (
                  <div className="card">
                    <div className="card-body">
                      <h2 className="h5 card-title">
                        <i className="bi bi-hourglass-split me-2" aria-hidden="true" />
                        {t('room.waitingPm')}
                      </h2>
                      <p className="card-text text-muted mb-0">
                        {t('room.waitingPmBody')}
                      </p>
                    </div>
                  </div>
                )}

                {!!room.history?.length && (
                  <div className="card">
                    <div className="card-header d-flex align-items-center">
                      <i className="bi bi-clock-history me-2" aria-hidden="true" />
                      <h2 className="h6 mb-0">{t('room.history')}</h2>
                    </div>
                    <ul className="list-group list-group-flush">
                      {room.history.map((h) => (
                        <li key={h.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <strong>{h.title || t('room.untitled')}</strong>
                            <span className="badge text-bg-primary">
                              {h.finalScore === '☕' ? (
                                <i className="bi bi-cup-hot" aria-label="coffee" />
                              ) : (
                                h.finalScore ?? '—'
                              )}
                            </span>
                          </div>
                          {h.pmComment && (
                            <p className="text-muted small mb-0 mt-1">{h.pmComment}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
