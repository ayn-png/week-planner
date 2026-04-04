'use client';

import { useState } from 'react';
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

const PRESET_COLORS = [
  '#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899',
  '#f97316', '#14b8a6', '#8b5cf6', '#ef4444', '#06b6d4',
];

const MAX_LABEL_LENGTH = 30;

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, color: string) => void;
}

export function AddCategoryModal({ open, onClose, onAdd }: AddCategoryModalProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  function handleLabelChange(value: string) {
    setLabel(value);
    if (value.length > MAX_LABEL_LENGTH) {
      setError(`Category name must be ${MAX_LABEL_LENGTH} characters or less`);
    } else if (error) {
      setError('');
    }
  }

  function handleAdd() {
    if (!label.trim()) {
      setError('Please enter a category name');
      return;
    }
    if (label.length > MAX_LABEL_LENGTH) {
      setError(`Category name must be ${MAX_LABEL_LENGTH} characters or less`);
      return;
    }
    onAdd(label.trim(), color);
    setLabel('');
    setColor(PRESET_COLORS[0]);
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-label">Name</Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. Reading"
              maxLength={MAX_LABEL_LENGTH}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              aria-invalid={!!error}
              aria-describedby={error ? 'cat-label-error' : undefined}
            />
            {error && (
              <p id="cat-label-error" className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'white' : 'transparent',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-muted-foreground">Custom:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
