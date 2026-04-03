'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlannerBlock, Category } from '@/types/planner';
import { usePlannerStore } from '@/store/plannerStore';
import { Target, Zap } from 'lucide-react';
import { minutesToTime, timeToMinutes, isPastSlot } from '@/lib/dateHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BlockEditModalProps {
  block: PlannerBlock | null;
  categories: Category[];
  weekDays?: Date[];
  onSave: (block: PlannerBlock) => { success: boolean; error?: string };
  onDelete: (id: string) => void;
  onClose: () => void;
}

const NOTES_MAX = 500;

export function BlockEditModal({
  block,
  categories,
  weekDays,
  onSave,
  onDelete,
  onClose,
}: BlockEditModalProps) {
  const { goals } = usePlannerStore();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [goalId, setGoalId] = useState<string>('none');
  const [energyLevel, setEnergyLevel] = useState<'High' | 'Medium' | 'Low' | 'none'>('none');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setCategoryId(block.category);
      setStartTimeStr(minutesToTime(block.startTime));
      setEndTimeStr(minutesToTime(block.endTime));
      setNotes(block.notes ?? '');
      setIsFocus(block.isFocus ?? false);
      setGoalId(block.goalId ?? 'none');
      setEnergyLevel(block.energyLevel ?? 'none');
      setError('');
    }
  }, [block]);

  if (!block) return null;

  function handleSave() {
    if (!block) return;
    const startTime = timeToMinutes(startTimeStr);
    const endTime = timeToMinutes(endTimeStr);

    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }
    if (endTime - startTime < 15) {
      setError('Block must be at least 15 minutes');
      return;
    }

    // Past-slot guard — only check if weekDays provided (current week)
    if (weekDays && isPastSlot(block.day, endTime, weekDays)) {
      setError('This time has already passed — choose a future time');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const updatedBlock: PlannerBlock = {
      ...block,
      title: title.trim() || block.title,
      category: categoryId,
      color: selectedCategory?.color ?? block.color,
      startTime,
      endTime,
      notes: notes.trim() || undefined,
      isFocus,
      goalId: goalId === 'none' ? undefined : goalId,
      energyLevel: energyLevel === 'none' ? undefined : energyLevel as 'High' | 'Medium' | 'Low',
    };

    const result = onSave(updatedBlock);
    if (!result.success) {
      setError(result.error ?? 'Could not save block');
      return;
    }
    onClose();
  }

  function handleDelete() {
    if (block) {
      onDelete(block.id);
      onClose();
    }
  }

  return (
    <Dialog open={!!block} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
        <DialogHeader>
          <DialogTitle>Edit Block</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="block-title">Title</Label>
            <Input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Link Goal
            </Label>
            <Select value={goalId} onValueChange={(v) => setGoalId(v || "none")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Goal</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500" /> Energy Level
            </Label>
            <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as 'High' | 'Medium' | 'Low' | 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Select energy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific energy</SelectItem>
                <SelectItem value="High">High ⚡</SelectItem>
                <SelectItem value="Medium">Medium 🔋</SelectItem>
                <SelectItem value="Low">Low 🪫</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
              />
            </div>
          </div>

          {/* Notes field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="block-notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <span className={`text-[11px] tabular-nums ${notes.length > NOTES_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {notes.length}/{NOTES_MAX}
              </span>
            </div>
            <textarea
              id="block-notes"
              rows={2}
              maxLength={NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What do you want to accomplish in this block?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border/40 mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="focus-mode-toggle" className="text-sm font-medium">Focus Block</Label>
              <p className="text-[11px] text-muted-foreground">Mark this block for deep work. Enables flow tracking.</p>
            </div>
            <button
              id="focus-mode-toggle"
              type="button"
              onClick={() => setIsFocus(!isFocus)}
              className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring ${isFocus ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${isFocus ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex justify-between">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </motion.div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={handleSave}>Save</Button>
            </motion.div>
          </div>
        </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
