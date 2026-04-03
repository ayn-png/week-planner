'use client';

import type { WeeklyExtras } from '@/types/planner';

type NoteKey = keyof WeeklyExtras['notes'];

const NOTE_FIELDS: { key: NoteKey; label: string; placeholder: string }[] = [
  { key: 'mantra',   label: 'Weekly Mantra',  placeholder: 'e.g. Progress over perfection' },
  { key: 'grateful', label: 'Grateful for',   placeholder: 'What are you grateful for?' },
  { key: 'nightOut', label: 'Night out',       placeholder: 'Plans for going out?' },
  { key: 'reachOut', label: 'Reach out to',   placeholder: 'Who do you want to contact?' },
];

interface NotesPanelProps {
  notes: WeeklyExtras['notes'];
  onChange: (notes: WeeklyExtras['notes']) => void;
}

export function NotesPanel({ notes, onChange }: NotesPanelProps) {
  function update(key: NoteKey, value: string) {
    onChange({ ...notes, [key]: value });
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">📝</span>
        <h3 className="font-semibold text-sm">Notes</h3>
      </div>

      {/* Note fields */}
      <div className="space-y-2.5">
        {NOTE_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-muted-foreground mt-1.5 text-xs flex-shrink-0">•</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}:</p>
              <input
                type="text"
                value={notes[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none border-b border-border/30 focus:border-border/60 pb-0.5 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
