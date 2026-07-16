import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from './LanguageSelector';

export default function Home({ startAsPm, startAsDev, error }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('create'); // create | join
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (mode === 'create') {
        await startAsPm(name);
      } else {
        await startAsDev(name, code);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="bg-primary text-white rounded d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 48, height: 48 }}
                    aria-hidden="true"
                  >
                    <i className="bi bi-suit-spade-fill fs-4" />
                  </div>
                  <div>
                    <h1 className="h4 mb-1">Poker Planning</h1>
                    <p className="text-muted small mb-0">{t('home.tagline')}</p>
                  </div>
                </div>
                <LanguageSelector />
              </div>

              <ul className="nav nav-tabs mb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    type="button"
                    className={`nav-link ${mode === 'create' ? 'active' : ''}`}
                    onClick={() => setMode('create')}
                    role="tab"
                    aria-selected={mode === 'create'}
                  >
                    <i className="bi bi-plus-circle me-1" aria-hidden="true" />
                    {t('home.tabCreate')}
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    type="button"
                    className={`nav-link ${mode === 'join' ? 'active' : ''}`}
                    onClick={() => setMode('join')}
                    role="tab"
                    aria-selected={mode === 'join'}
                  >
                    <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true" />
                    {t('home.tabJoin')}
                  </button>
                </li>
              </ul>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="home-name" className="form-label">
                    {t('home.yourName')}
                  </label>
                  <input
                    id="home-name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      mode === 'create'
                        ? t('home.namePlaceholderPm')
                        : t('home.namePlaceholderDev')
                    }
                    maxLength={40}
                    autoFocus
                    required
                  />
                </div>

                {mode === 'join' && (
                  <div className="mb-3">
                    <label htmlFor="home-code" className="form-label">
                      {t('home.roomCode')}
                    </label>
                    <input
                      id="home-code"
                      className="form-control room-code text-uppercase"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder={t('home.roomCodePlaceholder')}
                      maxLength={10}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
                    {t(error)}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      {t('home.connecting')}
                    </>
                  ) : mode === 'create' ? (
                    <>
                      <i className="bi bi-door-open me-1" aria-hidden="true" />
                      {t('home.createRoom')}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true" />
                      {t('home.joinRoom')}
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4" />

              <h2 className="h6">{t('home.howItWorks')}</h2>
              <ol className="small text-muted mb-2 ps-3">
                <li className="mb-1">{t('home.step1')}</li>
                <li className="mb-1">{t('home.step2')}</li>
                <li className="mb-1">{t('home.step3')}</li>
                <li className="mb-1">{t('home.step4')}</li>
                <li className="mb-1">{t('home.step5')}</li>
              </ol>
              <p className="text-muted small mb-0">{t('home.footerNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
