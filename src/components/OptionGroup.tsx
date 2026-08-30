interface OptionButtonProps {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
  description?: string;
}

export function OptionButton({ label, emoji, selected, onClick, description }: OptionButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
      }`}
    >
      {emoji && <span className="text-2xl" aria-hidden="true">{emoji}</span>}
      <span className="flex-1">
        <span className="block font-semibold text-slate-800">{label}</span>
        {description && <span className="block text-sm text-slate-500">{description}</span>}
      </span>
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
            <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0z" />
          </svg>
        )}
      </span>
    </button>
  );
}

interface OptionGroupProps {
  options: { value: string; label: string; emoji?: string }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
  label: string;
  columns?: 1 | 2;
}

export function OptionGroup({ options, value, onChange, name, label, columns = 1 }: OptionGroupProps) {
  return (
    <fieldset className="w-full">
      <legend className="sr-only">{label}</legend>
      <div role="radiogroup" aria-label={label} className={`grid gap-3 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            emoji={opt.emoji}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </fieldset>
  );
}
