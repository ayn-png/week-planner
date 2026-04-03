'use client';

import { useEffect, useState } from 'react';
import { currentTimeMinutes } from '@/lib/dateHelpers';

export function CurrentTimeIndicator() {
  const [minutes, setMinutes] = useState(currentTimeMinutes);

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setMinutes(currentTimeMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
      style={{ top: minutes }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
      <div className="h-[2px] flex-1 bg-red-500" />
    </div>
  );
}
