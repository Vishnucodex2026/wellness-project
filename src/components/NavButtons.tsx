import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled = false,
  isLast = false,
}: NavButtonsProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
            nextDisabled
              ? 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-xl'
          }`}
        >
          {nextLabel}
          {isLast ? <span aria-hidden="true">✓</span> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Step {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
