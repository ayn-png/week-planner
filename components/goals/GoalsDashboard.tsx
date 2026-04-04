'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlannerStore } from '@/store/plannerStore';
import { Goal } from '@/types/deepwork';
import { useAuth } from '@/hooks/useAuth';
import { fetchGoals, createGoal, deleteGoalService, updateGoalService } from '@/lib/services/goalService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Trash2 } from 'lucide-react';

export function GoalsDashboard() {
  const { goalsOpen, setGoalsOpen, goals, setGoals } = usePlannerStore();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Monthly' | 'Weekly'>('Monthly');
  const [parentGoalId, setParentGoalId] = useState<string>('none');
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goalsOpen && user) {
      setLoading(true);
      fetchGoals(user.uid)
        .then(setGoals)
        .finally(() => setLoading(false));
    }
  }, [goalsOpen, user, setGoals]);

  const handleAddGoal = async () => {
    if (!title.trim()) {
      setTitleError('Goal title cannot be empty');
      return;
    }
    if (!user) return;

    setTitleError('');
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type,
      progress: 0,
      createdAt: Date.now(),
      parentGoalId: type === 'Weekly' && parentGoalId !== 'none' ? parentGoalId : undefined,
    };
    await createGoal(user.uid, newGoal);
    setGoals([...goals, newGoal]);
    setTitle('');
    setParentGoalId('none');
    toast.success('Goal added');
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteGoalService(user.uid, id);
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleProgressUpdate = async (goal: Goal, rawValue: string) => {
    if (!user) return;
    const parsed = parseInt(rawValue, 10);
    const clamped = Math.min(100, Math.max(0, isNaN(parsed) ? 0 : parsed));
    const updated = { ...goal, progress: clamped };
    setGoals(goals.map(g => g.id === goal.id ? updated : g));
    await updateGoalService(user.uid, updated);
  };

  const monthlyGoals = goals.filter(g => g.type === 'Monthly');
  const weeklyGoals = goals.filter(g => g.type === 'Weekly');

  return (
    <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Goals Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-2">
          {/* Create Goal Form */}
          <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
            <h4 className="font-semibold text-sm">Create New Goal</h4>
            <div className="flex gap-2">
              <Select value={type} onValueChange={(v) => setType(v as 'Monthly' | 'Weekly')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Goal title..."
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (titleError && e.target.value.trim()) setTitleError('');
                }}
                className="flex-1"
                maxLength={80}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
              />
              <Button onClick={handleAddGoal}>Add</Button>
            </div>
            {titleError && (
              <p id="title-error" className="text-xs text-destructive">{titleError}</p>
            )}
            {type === 'Weekly' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground w-[120px]">Link to Monthly Goal:</span>
                <Select value={parentGoalId} onValueChange={(v) => setParentGoalId(v || 'none')}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Select Parent Goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {monthlyGoals.map(Mg => (
                      <SelectItem key={Mg.id} value={Mg.id}>{Mg.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Monthly Goals */}
              <div className="space-y-2">
                <h3 className="font-semibold px-1 text-sm bg-muted/50 py-1 rounded">Monthly Goals</h3>
                {monthlyGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2">No monthly goals set.</p>
                )}
                {monthlyGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-md border bg-card/50 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{g.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-primary" style={{ width: `${g.progress}%` }} />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={g.progress}
                          key={g.id + '-progress'}
                          onBlur={(e) => handleProgressUpdate(g, e.target.value)}
                          className="w-12 text-[10px] text-muted-foreground bg-transparent border border-border/40 rounded px-1 py-0.5 focus:outline-none focus:border-border"
                          aria-label={`Progress for ${g.title}`}
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(g.id)}
                      className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Weekly Goals */}
              <div className="space-y-2 pt-2">
                <h3 className="font-semibold px-1 text-sm bg-muted/50 py-1 rounded">Weekly Goals</h3>
                {weeklyGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2">No weekly goals set.</p>
                )}
                {weeklyGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-md border bg-card/50 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{g.title}</h4>
                      {g.parentGoalId && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          ↳ {monthlyGoals.find(m => m.id === g.parentGoalId)?.title || 'Unknown Parent'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-primary" style={{ width: `${g.progress}%` }} />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={g.progress}
                          key={g.id + '-progress'}
                          onBlur={(e) => handleProgressUpdate(g, e.target.value)}
                          className="w-12 text-[10px] text-muted-foreground bg-transparent border border-border/40 rounded px-1 py-0.5 focus:outline-none focus:border-border"
                          aria-label={`Progress for ${g.title}`}
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(g.id)}
                      className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
