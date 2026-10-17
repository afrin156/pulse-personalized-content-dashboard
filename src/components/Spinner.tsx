export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent"
      />
      <span>{label}…</span>
    </span>
  );
}

export function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface sm:flex-row"
    >
      <div className="skeleton aspect-video w-full animate-shimmer sm:aspect-auto sm:min-h-[150px] sm:w-52" />
      <div className="flex-1 space-y-3 p-4">
        <div className="skeleton h-3 w-24 animate-shimmer rounded" />
        <div className="skeleton h-5 w-4/5 animate-shimmer rounded" />
        <div className="skeleton h-3 w-full animate-shimmer rounded" />
        <div className="skeleton h-3 w-2/3 animate-shimmer rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
