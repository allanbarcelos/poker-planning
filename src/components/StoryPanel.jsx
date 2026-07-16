import { useEffect, useState } from 'react';
import { ROLES } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';

export default function StoryPanel({ room, local, setStory, openVoting }) {
  const { t } = useI18n();
  const isPm = local?.role === ROLES.PM;
  const [title, setTitle] = useState(room?.story?.title || '');
  const [description, setDescription] = useState(room?.story?.description || '');

  useEffect(() => {
    setTitle(room?.story?.title || '');
    setDescription(room?.story?.description || '');
  }, [room?.phase, room?.story?.title, room?.story?.description]);

  const hasStory =
    Boolean(room?.story?.title?.trim()) ||
    Boolean(room?.story?.description?.trim());

  function publish(e) {
    e.preventDefault();
    if (!title.trim() && !description.trim()) return;
    setStory(title, description);
  }

  if (isPm && (room?.phase === 'lobby' || room?.phase === 'story')) {
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <h2 className="h6 mb-0">
            <i className="bi bi-file-text me-2" aria-hidden="true" />
            {t('story.title')}
          </h2>
          <span className="badge text-bg-light border">{t('story.pmWrites')}</span>
        </div>
        <div className="card-body">
          <form onSubmit={publish}>
            <div className="mb-3">
              <label htmlFor="story-title" className="form-label">
                {t('story.fieldTitle')}
              </label>
              <input
                id="story-title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('story.titlePlaceholder')}
                maxLength={120}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="story-desc" className="form-label">
                {t('story.fieldDescription')}
              </label>
              <textarea
                id="story-desc"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('story.descPlaceholder')}
                rows={6}
                maxLength={2000}
              />
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-send me-1" aria-hidden="true" />
                {t('story.sendToTeam')}
              </button>
              {hasStory && room?.phase === 'story' && (
                <button type="button" className="btn btn-success" onClick={openVoting}>
                  <i className="bi bi-hand-index me-1" aria-hidden="true" />
                  {t('story.openVoting')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 className="h6 mb-0">
          <i className="bi bi-file-text me-2" aria-hidden="true" />
          {t('story.title')}
        </h2>
        {room?.phase === 'story' && (
          <span className="badge text-bg-secondary">{t('story.readCarefully')}</span>
        )}
        {room?.phase === 'voting' && (
          <span className="badge text-bg-primary">{t('story.voteBasedOnThis')}</span>
        )}
      </div>
      <div className="card-body">
        {!hasStory ? (
          <p className="text-muted mb-0">{t('story.notSentYet')}</p>
        ) : (
          <article>
            <h3 className="h5">{room.story.title || t('story.noTitle')}</h3>
            <p className="story-desc bg-light border rounded p-3 mb-0">
              {room.story.description || t('story.noDescription')}
            </p>
          </article>
        )}

        {isPm && room?.phase === 'story' && hasStory && (
          <div className="mt-3">
            <button type="button" className="btn btn-success" onClick={openVoting}>
              <i className="bi bi-hand-index me-1" aria-hidden="true" />
              {t('story.openVoting')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
