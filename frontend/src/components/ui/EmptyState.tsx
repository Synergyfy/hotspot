import type { ComponentType, ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = '',
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <div className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">{description}</div>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
