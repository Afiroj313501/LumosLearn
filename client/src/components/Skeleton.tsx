import './Skeleton.css';

export const SkeletonLine = ({ width = '100%', height = '14px' }: { width?: string; height?: string }) => (
  <div className="skeleton-block" style={{ width, height }} />
);

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <SkeletonLine width="80px" height="11px" />
    <SkeletonLine width="70%" height="18px" />
    <SkeletonLine width="100%" height="13px" />
    <SkeletonLine width="90%" height="13px" />
    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
      <SkeletonLine width="60px" height="11px" />
      <SkeletonLine width="60px" height="11px" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="skeleton-row">
    <SkeletonLine width="140px" height="14px" />
    <SkeletonLine width="200px" height="12px" />
    <SkeletonLine width="60px" height="12px" />
  </div>
);

export const SkeletonCardGrid = ({ count = 3 }: { count?: number }) => (
  <div className="course-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);