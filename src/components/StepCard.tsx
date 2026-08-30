import { useEffect, useRef, type ReactNode } from 'react';

interface StepCardProps {
  emoji: string;
  heading: string;
  children: ReactNode;
  stepId: string;
}

export function StepCard({ emoji, heading, children, stepId }: StepCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [stepId]);

  return (
    <section className="animate-fade-in">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">{emoji}</span>
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-6 text-center text-2xl font-bold text-slate-800 focus:outline-none"
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
  error?: string;
  id: string;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  inputMode = 'text',
  error,
  id,
}: TextFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-emerald-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-2xl border-2 px-4 py-3.5 text-base text-slate-800 transition-colors placeholder:text-slate-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-emerald-400'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
