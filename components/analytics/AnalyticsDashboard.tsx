'use client';

import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart2, TrendingUp, Clock, Trophy, Zap, Activity } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import type { PlannerBlock, Category, WeeklyStats, CategoryStat } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';

interface AnalyticsDashboardProps {
  open: boolean;
  onClose: () => void;
  blocks: PlannerBlock[];
  categories: Category[];
  weekRangeLabel: string;
}

function computeStats(blocks: PlannerBlock[], categories: Category[]): WeeklyStats {
  const catMap = new Map<string, CategoryStat>();

  categories.forEach((cat) => {
    catMap.set(cat.id, {
      categoryId: cat.id,
      label: cat.label,
      color: cat.color,
      totalMinutes: 0,
      blockCount: 0,
    });
  });

  blocks.forEach((block) => {
    const stat = catMap.get(block.category);
    if (stat) {
      stat.totalMinutes += block.endTime - block.startTime;
      stat.blockCount += 1;
    }
  });

  const categoryStats = Array.from(catMap.values()).filter((s) => s.totalMinutes > 0);
  const totalMinutes = categoryStats.reduce((sum, s) => sum + s.totalMinutes, 0);
  const mostUsedCategory = categoryStats.reduce<CategoryStat | null>(
    (max, s) => (!max || s.totalMinutes > max.totalMinutes ? s : max),
    null
  );

  // Productivity score: (work + study + gym) / total * 100, capped at 100
  const productiveIds = categories
    .filter((c) => ['work', 'study', 'gym'].includes(c.id) || c.label.toLowerCase().match(/work|study|gym|code|exercise/))
    .map((c) => c.id);
  const productiveMinutes = categoryStats
    .filter((s) => productiveIds.includes(s.categoryId))
    .reduce((sum, s) => sum + s.totalMinutes, 0);
  const productivityScore = totalMinutes > 0
    ? Math.min(100, Math.round((productiveMinutes / Math.max(totalMinutes - sleepMinutes(categoryStats, categories), 1)) * 100))
    : 0;

  return { totalMinutes, categoryStats, mostUsedCategory, productivityScore, suggestions: [] };
}

function sleepMinutes(stats: CategoryStat[], categories: Category[]): number {
  const sleepIds = categories.filter(c => c.id === 'sleep' || c.label.toLowerCase().includes('sleep')).map(c => c.id);
  return stats.filter(s => sleepIds.includes(s.categoryId)).reduce((sum, s) => sum + s.totalMinutes, 0);
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function AnalyticsDashboard({ open, onClose, blocks, categories, weekRangeLabel }: AnalyticsDashboardProps) {
  const { activeMinutes, idleMinutes } = usePlannerStore();
  const stats = useMemo(() => computeStats(blocks, categories), [blocks, categories]);

  // Per-day bar data
  const dailyData = DAY_LABELS.map((day) => {
    const dayBlocks = blocks.filter((b) => b.day === day);
    const entry: Record<string, number | string> = { day };
    categories.forEach((cat) => {
      entry[cat.label] = Math.round(
        dayBlocks.filter((b) => b.category === cat.id).reduce((sum, b) => sum + b.endTime - b.startTime, 0) / 60
      );
    });
    return entry;
  });

  const energyData = useMemo(() => {
    return [
      { name: 'High', count: blocks.filter(b => b.energyLevel === 'High').length, fill: '#eab308' }, // yellow
      { name: 'Medium', count: blocks.filter(b => b.energyLevel === 'Medium').length, fill: '#22c55e' }, // green
      { name: 'Low', count: blocks.filter(b => b.energyLevel === 'Low').length, fill: '#3b82f6' }, // blue
    ].filter(d => d.count > 0);
  }, [blocks]);

  const activityData = useMemo(() => {
    if (activeMinutes === 0 && idleMinutes === 0) return [];
    return [
      { name: 'Active', value: activeMinutes, fill: '#22c55e' },
      { name: 'Idle', value: idleMinutes, fill: '#94a3b8' },
    ];
  }, [activeMinutes, idleMinutes]);

  const scoreColor =
    stats.productivityScore >= 70 ? '#22c55e' :
    stats.productivityScore >= 40 ? '#f59e0b' :
    '#ef4444';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Weekly Analytics — {weekRangeLabel}
          </DialogTitle>
        </DialogHeader>

        {blocks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No blocks this week. Add some blocks to see analytics.
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Total Planned
                </div>
                <p className="text-lg font-bold">{minutesToHours(stats.totalMinutes)}</p>
                <p className="text-xs text-muted-foreground">{blocks.length} blocks</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Trophy className="h-3 w-3" />
                  Top Category
                </div>
                {stats.mostUsedCategory ? (
                  <>
                    <p className="text-lg font-bold" style={{ color: stats.mostUsedCategory.color }}>
                      {stats.mostUsedCategory.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {minutesToHours(stats.mostUsedCategory.totalMinutes)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Productivity Score
                </div>
                <p className="text-lg font-bold" style={{ color: scoreColor }}>
                  {stats.productivityScore}%
                </p>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stats.productivityScore}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>
            </div>

            {/* NEW Grid: Energy Distribution + Activity Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {/* Energy Distribution */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-500"/> Energy Distribution</h3>
                {energyData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No energy tags tracked.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={energyData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {energyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Activity Track (Active vs Idle) */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-500"/> Session Activity</h3>
                {activityData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No activity tracked this session.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <ResponsiveContainer width={100} height={100}>
                      <PieChart>
                        <Pie
                          data={activityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={2}
                        >
                          {activityData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value}m`, 'Time']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 flex-1">
                      {activityData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="text-muted-foreground font-medium">{item.value}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pie chart — time per category */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-3">Time by Category</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={stats.categoryStats}
                      dataKey="totalMinutes"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {stats.categoryStats.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => minutesToHours(typeof value === 'number' ? value : 0)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {stats.categoryStats.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{minutesToHours(cat.totalMinutes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart — daily hours by category */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-3">Daily Breakdown (hours)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyData} barSize={12} barGap={2}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <RechartsTooltip
                    formatter={(value) => [`${value}h`]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {categories
                    .filter((cat) => stats.categoryStats.some((s) => s.categoryId === cat.id))
                    .map((cat) => (
                      <Bar key={cat.id} dataKey={cat.label} fill={cat.color} radius={[3, 3, 0, 0]} />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
