'use client';

export function TimeGutter() {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-10 sm:w-14 flex-shrink-0 select-none">
      {hours.map((hour) => (
        <div
          key={hour}
          className="flex items-start justify-end pr-2"
          style={{ height: 60 }}
        >
          <span className="text-[9px] sm:text-[11px] text-muted-foreground leading-none -mt-[6px]">
            {String(hour).padStart(2, '0')}:00
          </span>
        </div>
      ))}
    </div>
  );
}
