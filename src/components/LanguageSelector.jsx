import { useI18n } from '../i18n/I18nContext';

export default function LanguageSelector({ className = '', size = 'sm' }) {
  const { locale, setLocale, locales, t } = useI18n();
  const selectId = 'lang-select';

  return (
    <div className={`d-inline-flex align-items-center gap-1 ${className}`.trim()}>
      <label htmlFor={selectId} className="mb-0 text-secondary">
        <span className="visually-hidden">{t('lang.label')}</span>
        <i className="bi bi-globe" aria-hidden="true" />
      </label>
      <select
        id={selectId}
        className={`form-select form-select-${size}`}
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t('lang.label')}
        style={{ width: 'auto', minWidth: '5.5rem' }}
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
