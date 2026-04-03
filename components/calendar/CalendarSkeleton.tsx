'use client';

import { TimeGutter } from './TimeGutter';

/** Skeleton loader shown while the week's blocks are being fetched from Firestore */
export function CalendarSkeleton() {
  const columns = Array.from({ length: 7 });
  const skeletonBlocks = [
    { top: 120, height: 90, opacity: 0.6 },
    { top: 270, height: 60, opacity: 0.4 },
    { top: 390, height: 120, opacity: 0.5 },
    { top: 570, height: 75, opacity: 0.35 },
    { top: 720, height: 90, opacity: 0.45 },
  ];

  return (
    <div className="flex animate-pulse" style={{ height: 1440 }}>
      <TimeGutter />
      {columns.map((_, i) => (
        <div
          key={i}
          className="relative flex-1 border-l border-border/20"
          style={{ height: 1440 }}
        >
          {/* Hour lines */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border/15"
              style={{ top: h * 60 }}
            />
          ))}
          {/* Skeleton blocks — offset per column to look varied */}
          {skeletonBlocks.map((b, j) => (
            <div
              key={j}
              className="absolute mx-1 rounded-md bg-muted"
              style={{
                top: b.top + (i * 30) % 60,
                height: b.height,
                left: 4,
                right: 4,
                opacity: b.opacity,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
