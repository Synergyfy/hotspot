import { Check } from 'lucide-react';

export interface Step {
  label: string;
  done?: boolean;
  active?: boolean;
}

/** Compact progress strip used by the editor and publish flow. */
export function StepIndicator({ steps, className = '' }: { steps: Step[]; className?: string }) {
  return (
    <ol className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Progress">
      {steps.map((step, index) => {
        const tone = step.done
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : step.active
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-400';

        return (
          <li key={step.label} className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${tone}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${step.done ? 'bg-emerald-600 text-white' : step.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step.done ? <Check className="h-2.5 w-2.5" /> : index + 1}
              </span>
              {step.label}
            </span>
            {index < steps.length - 1 && <span className="h-px w-4 bg-slate-200" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
