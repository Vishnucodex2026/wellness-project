import { useEffect, useRef } from 'react';

interface RatingScaleProps {
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  label: string;
  name: string;
}

export function RatingScale({
  value,
  onChange,
  min = 1,
  max = 10,
  minLabel = 'Low',
  maxLabel = 'High',
  label,
  name,
}: RatingScaleProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value != null && groupRef.current) {
      const live = groupRef.current.querySelector('[data-live]');
      if (live) live.textContent = `Selected ${value} of ${max}`;
    }
  }, [value, max]);

  const buttons = [];
  for (let i = min; i <= max; i++) {
    const isSelected = value === i;
    buttons.push(
      <button
        key={i}
        type="button"
        aria-pressed={isSelected}
        aria-label={`${i} out of ${max}`}
        onClick={() => onChange(i)}
        className={`h-14 w-full rounded-2xl border-2 text-lg font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
          isSelected
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg scale-105'
            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <fieldset className="w-full">
      <legend className="sr-only">{label}</legend>
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      <div ref={groupRef} className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {buttons}
      </div>
      <div className="sr-only" aria-live="polite" data-live></div>
    </fieldset>
  );
}
