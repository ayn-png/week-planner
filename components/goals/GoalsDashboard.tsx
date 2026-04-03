'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlannerStore } from '@/store/plannerStore';
import { Goal } from '@/types/deepwork';
import { useAuth } from '@/hooks/useAuth';
import { fetchGoals, createGoal, deleteGoalService } from '@/lib/services/goalService';
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
  
  useEffect(() => {
    if (goalsOpen && user) {
      fetchGoals(user.uid).then(setGoals);
    }
  }, [goalsOpen, user, setGoals]);

  const handleAddGoal = async () => {
    if (!title.trim() || !user) return;
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
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteGoalService(user.uid, id);
    setGoals(goals.filter(g => g.id !== id));
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
                onChange={e => setTitle(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <Button onClick={handleAddGoal}>Add</Button>
            </div>
            {type === 'Weekly' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground w-[120px]">Link to Monthly Goal:</span>
                <Select value={parentGoalId} onValueChange={(v) => setParentGoalId(v || "none")}>
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

          <div className="space-y-4">
            {/* Monthly Goals */}
            <div className="space-y-2">
              <h3 className="font-semibold px-1 text-sm bg-muted/50 py-1 rounded">Monthly Goals</h3>
              {monthlyGoals.length === 0 && <p className="text-xs text-muted-foreground px-2">No monthly goals set.</p>}
              {monthlyGoals.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-md border bg-card/50">
                  <div>
                    <h4 className="font-medium text-sm">{g.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${g.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{g.progress}%</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Weekly Goals */}
            <div className="space-y-2 pt-2">
              <h3 className="font-semibold px-1 text-sm bg-muted/50 py-1 rounded">Weekly Goals</h3>
              {weeklyGoals.length === 0 && <p className="text-xs text-muted-foreground px-2">No weekly goals set.</p>}
              {weeklyGoals.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-md border bg-card/50">
                  <div>
                    <h4 className="font-medium text-sm">{g.title}</h4>
                    {g.parentGoalId && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        ↳ {monthlyGoals.find(m => m.id === g.parentGoalId)?.title || 'Unknown Parent'}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${g.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{g.progress}%</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
