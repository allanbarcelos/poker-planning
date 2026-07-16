import { DECK } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';

function CardFace({ value }) {
  if (value === '☕') {
    return <i className="bi bi-cup-hot" aria-label="coffee break" />;
  }
  return <span>{value}</span>;
}

export default function CardDeck({
  selected,
  onSelect,
  disabled = false,
  highlight = null,
}) {
  const { t } = useI18n();

  return (
    <div className="deck" role="listbox" aria-label={t('deck.ariaLabel')}>
      {DECK.map((card) => {
        const isSelected = selected === card;
        const isHighlight = highlight === card;
        return (
          <button
            key={card}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={[
              'deck-card',
              isSelected ? 'selected' : '',
              isHighlight ? 'highlight' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={disabled}
            onClick={() => onSelect?.(card)}
          >
            <CardFace value={card} />
          </button>
        );
      })}
    </div>
  );
}
