'use client';

import { useEffect, useState } from 'react';
import { currentTimeMinutes } from '@/lib/dateHelpers';

export function CurrentTimeIndicator() {
  const [minutes, setMinutes] = useState(currentTimeMinutes);

  useEffect(() => {
    // Align to the next minute boundary, then tick every 60 seconds exactly
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let interval: ReturnType<typeof setInterval> | null = null;

    const timeout = setTimeout(() => {
      setMinutes(currentTimeMinutes());
      interval = setInterval(() => {
        setMinutes(currentTimeMinutes());
      }, 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval !== null) clearInterval(interval);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
      style={{ top: minutes }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
      <div className="h-[2px] flex-1 bg-red-500" />
    </div>
  );
}
