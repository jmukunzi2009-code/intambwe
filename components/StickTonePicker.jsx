export const TONE_OPTIONS = [
  { id: 'tone-gold', label: 'Canary Yellow', bg: '#FEF08A', border: '#EAB308' },
  { id: 'tone-green', label: 'Fresh Mint', bg: '#BBF7D0', border: '#4ADE80' },
  { id: 'tone-rose', label: 'Rose Pink', bg: '#FECDD3', border: '#FB7185' },
  { id: 'tone-blue', label: 'Sky Blue', bg: '#BAE6FD', border: '#38BDF8' },
  { id: 'tone-peach', label: 'Sunset Peach', bg: '#FED7AA', border: '#FB923C' },
  { id: 'tone-lavender', label: 'Soft Lavender', bg: '#E9D5FF', border: '#C084FC' },
  { id: 'tone-ivory', label: 'Warm Ivory', bg: '#FEF3C7', border: '#D6B86A' },
  { id: 'tone-ink', label: 'Midnight Blue', bg: '#1E3A5F', border: '#4A78A8' },
];

export function StickTonePicker({ value, onChange }) {
  return (
    <fieldset className="stick-tone-fieldset">
      <legend className="form-label">Choose a sticky note color</legend>
      <div className="stick-tone-picker">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = value === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onChange(tone.id)}
              className={`stick-tone-option${isSelected ? ' is-selected' : ''}`}
              style={{ '--tone-color': tone.bg, '--tone-border': tone.border }}
              aria-pressed={isSelected}
              aria-label={`${tone.label}${isSelected ? ', selected' : ''}`}
            >
              <span className="stick-tone-swatch" aria-hidden="true" />
              <span>{tone.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
