'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Sparkles, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { parseAIResponse } from '@/lib/ai/generator';
import { minutesToTime } from '@/lib/dateHelpers';
import type { Category, PlannerBlock } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';
import { wouldOverlap } from '@/lib/overlapDetection';

interface AIWeekGeneratorProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  existingBlocks: PlannerBlock[];
  onGenerated: (blocks: PlannerBlock[]) => void;
}

const EXAMPLE_PROMPTS = [
  'coding bootcamp, gym 3x/week, and study sessions',
  'startup founder: deep work mornings, meetings afternoons',
  'balanced week with work, gym, reading, and hobbies',
  'student: lectures, study, gym, and social time',
];

export function AIWeekGenerator({
  open,
  onClose,
  categories,
  existingBlocks,
  onGenerated,
}: AIWeekGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PlannerBlock[] | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Please describe your week goals.');
      return;
    }
    setLoading(true);
    setError('');
    setPreview(null);
    setCollapsedDays(new Set());

    try {
      const res = await fetch('/api/ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          categories: categories.map((c) => c.label),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');

      const blocks = parseAIResponse(data.schedule, categories);

      const filtered = replaceExisting
        ? blocks
        : blocks.filter((b) => !wouldOverlap(b, existingBlocks));

      setPreview(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!preview) return;
    onGenerated(preview);
    setPrompt('');
    setPreview(null);
    setError('');
    setCollapsedDays(new Set());
    onClose();
  }

  function toggleDay(day: string) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  // Group preview blocks by day in week order
  const blocksByDay = preview
    ? DAY_LABELS.map((day) => ({
        day,
        blocks: preview
          .filter((b) => b.day === day)
          .sort((a, b) => a.startTime - b.startTime),
      })).filter((d) => d.blocks.length > 0)
    : [];

  const statsByCategory = preview
    ? categories
        .map((cat) => ({
          ...cat,
          count: preview.filter((b) => b.category === cat.id).length,
          minutes: preview
            .filter((b) => b.category === cat.id)
            .reduce((sum, b) => sum + (b.endTime - b.startTime), 0),
        }))
        .filter((c) => c.count > 0)
    : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Week Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Prompt */}
          <div className="space-y-1.5">
            <Label>Describe your week goals</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="e.g. I want to code 6h/day, gym 3x/week, study evenings..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleGenerate()}
            />
            <p className="text-xs text-muted-foreground">Ctrl+Enter to generate</p>
          </div>

          {/* Example prompts */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Try an example:</Label>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex) => (
                <Tooltip key={ex}>
                  <TooltipTrigger>
                    <button
                      onClick={() => setPrompt(ex)}
                      className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted transition-colors text-left"
                    >
                      {ex.length > 40 ? ex.slice(0, 40) + '…' : ex}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{ex}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Options */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-border"
            />
            <span>Replace existing blocks (clear conflicts)</span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview — full week day-by-day */}
          {preview && (
            <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
              {/* Summary stats */}
              <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold">{preview.length} blocks generated</p>
                <div className="flex flex-wrap gap-1.5">
                  {statsByCategory.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                      style={{ backgroundColor: cat.color + '22', color: cat.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.label}: {Math.round(cat.minutes / 60)}h
                    </div>
                  ))}
                </div>
              </div>

              {/* Day-by-day block list */}
              <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
                {blocksByDay.map(({ day, blocks: dayBlocks }) => (
                  <div key={day}>
                    {/* Day header — collapsible */}
                    <button
                      onClick={() => toggleDay(day)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {collapsedDays.has(day)
                          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        <span className="text-xs font-semibold">{day}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{dayBlocks.length} block{dayBlocks.length !== 1 ? 's' : ''}</span>
                    </button>

                    {/* Block rows */}
                    {!collapsedDays.has(day) && (
                      <div className="px-3 pb-2 space-y-1">
                        {dayBlocks.map((block) => {
                          const cat = categories.find((c) => c.id === block.category);
                          return (
                            <div key={block.id} className="flex items-center gap-2 text-xs">
                              <span
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: block.color }}
                              />
                              <span className="text-muted-foreground tabular-nums w-24 flex-shrink-0">
                                {minutesToTime(block.startTime)}–{minutesToTime(block.endTime)}
                              </span>
                              <span className="truncate">{block.title}</span>
                              {cat && (
                                <span
                                  className="ml-auto flex-shrink-0 rounded px-1 py-0.5 text-[10px]"
                                  style={{ backgroundColor: cat.color + '22', color: cat.color }}
                                >
                                  {cat.label}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {replaceExisting && (
                <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border/30">
                  ⚠ Existing blocks will be replaced
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {preview ? (
            <Button onClick={handleApply}>
              Apply to Calendar
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1.5" /> Generate</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
