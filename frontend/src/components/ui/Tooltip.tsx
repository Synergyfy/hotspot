import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * A small help icon that reveals an explanation on hover or keyboard focus.
 * Tooltips are plain CSS (group-hover/group-focus-within) so they work without JS.
 */
export function HelpTip({
  text,
  label = 'More information',
  className = '',
}: {
  text: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={label}
        className="rounded-full text-slate-300 transition-colors hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-[90] mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-left text-[11px] font-medium leading-snug text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -ml-1 h-2 w-2 -translate-y-1 rotate-45 bg-slate-900" />
      </span>
    </span>
  );
}
