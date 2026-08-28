import './Skeletons.css';

/** A shimmering placeholder block. width/height accept valid CSS values. */
export function Skeleton({ width = '100%', height = 16, round = 8, style = {} }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: round, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, width = '100%', height = 14, gap = 10 }) {
  return (
    <span className="skeleton-text" style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={height}
          round={6}
        />
      ))}
    </span>
  );
}

/** Stat cards row (like the dashboard 4-card grid). */
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="skeleton-stats">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <Skeleton width="40%" height={12} round={6} />
          <Skeleton width="55%" height={32} round={8} />
          <Skeleton width="45%" height={12} round={6} />
        </div>
      ))}
    </div>
  );
}

/** Data table with a header row + n body rows. */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="skeleton-table-card">
      <table className="skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton width="80%" height={14} round={6} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><Skeleton width={c === 0 ? '70%' : '90%'} height={14} round={6} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ranked-list style card with an avatar + two lines of text per row. */
export function SkeletonList({ items = 5, avatar = true }) {
  return (
    <div className="skeleton-card skeleton-list-card">
      <Skeleton width="45%" height={18} round={8} />
      {Array.from({ length: items }).map((_, i) => (
        <div className="skeleton-list-row" key={i}>
          {avatar && <Skeleton width={28} height={28} round={8} />}
          <div className="skeleton-list-body">
            <Skeleton width="80%" height={14} round={6} />
            <Skeleton width="50%" height={12} round={6} />
          </div>
          <Skeleton width={40} height={14} round={6} />
        </div>
      ))}
    </div>
  );
}
