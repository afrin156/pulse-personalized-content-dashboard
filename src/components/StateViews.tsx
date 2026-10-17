import type { ReactNode } from 'react';

export function SectionHeading({
  id,
  title,
  subtitle,
  action,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 id={id} className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-prose text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-signal/40 bg-surface px-6 py-10 text-center">
      <h2 className="font-display text-xl font-semibold">Something went wrong</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${buttonClass} mt-5`}>
          Try again
        </button>
      )}
    </div>
  );
}

export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50';
