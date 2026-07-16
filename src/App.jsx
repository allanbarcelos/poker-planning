import { useRoom } from './hooks/useRoom';
import { useI18n } from './i18n/I18nContext';
import Home from './components/Home';
import Room from './components/Room';

export default function App() {
  const roomApi = useRoom();
  const { t } = useI18n();

  if (roomApi.restoring && roomApi.screen === 'home') {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">{t('app.restoring')}</span>
        </div>
        <p className="mb-1">{t('app.restoring')}</p>
        <p className="text-muted small mb-0">{t('app.restoringHint')}</p>
      </div>
    );
  }

  if (roomApi.screen === 'home') {
    return <Home {...roomApi} />;
  }

  return <Room {...roomApi} />;
}
