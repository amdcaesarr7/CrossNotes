import { Skeleton } from '@/components/ui/skeleton';

export function RouteSkeleton() {
  return (
    <main className="cn-body route-loading" aria-live="polite" aria-busy="true">
      <div className="skeleton-page">
        <Skeleton className="skeleton-pill" />
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-subtitle" />
        <div className="skeleton-card-stack">
          <Skeleton className="skeleton-card skeleton-card-tall" />
          <Skeleton className="skeleton-card" />
          <Skeleton className="skeleton-card" />
        </div>
      </div>
    </main>
  );
}

export function ContentSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-card-stack" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }, (_, index) => (
        <div className="clay-card skeleton-content-card" key={index}>
          <Skeleton className="skeleton-line skeleton-line-short" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line skeleton-line-medium" />
          <Skeleton className="skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}
