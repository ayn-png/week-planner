export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface PlannerBlock {
  id: string;
  title: string;
  category: string;
  color: string;        // hex
  day: DayOfWeek;
  startTime: number;    // minutes from midnight (0–1439)
  endTime: number;      // minutes from midnight (1–1440)
  createdAt: number;
  notes?: string;       // freeform context for the block
  isFocus?: boolean;    // indicates if this is a Focus Block
  goalId?: string;      // ID of the mapped Goal
  status?: 'todo' | 'done'; // Tracks completion status
  energyLevel?: 'High' | 'Medium' | 'Low'; // for energy-based scheduling
  // Optional visual state flags (not persisted)
  isConflicting?: boolean;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  isDefault: boolean;
}

export interface WeeklyPlan {
  weekId: string;       // "2026-W13"
  blocks: PlannerBlock[];
  lastModified: number;
}

// dnd-kit drag data payload
export interface DragData {
  type: 'CATEGORY' | 'BLOCK' | 'RESIZE';
  category?: Category;
  block?: PlannerBlock;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sleep',    label: 'Sleep',    color: '#6366f1', isDefault: true },
  { id: 'work',     label: 'Work',     color: '#0ea5e9', isDefault: true },
  { id: 'gym',      label: 'Gym',      color: '#22c55e', isDefault: true },
  { id: 'study',    label: 'Study',    color: '#f59e0b', isDefault: true },
  { id: 'personal', label: 'Personal', color: '#ec4899', isDefault: true },
];

export const DAY_LABELS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Weekly Dashboard Types ──────────────────────────────────────────────────

export interface DayTodo {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyGoal {
  id: string;
  text: string;
}

export interface WeeklyExtras {
  weekId: string;
  todos: Partial<Record<DayOfWeek | 'Weekend', DayTodo[]>>;
  goals: WeeklyGoal[];
  notes: {
    mantra: string;
    grateful: string;
    nightOut: string;
    reachOut: string;
  };
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface CategoryStat {
  categoryId: string;
  label: string;
  color: string;
  totalMinutes: number;
  blockCount: number;
}

export interface WeeklyStats {
  totalMinutes: number;
  categoryStats: CategoryStat[];
  mostUsedCategory: CategoryStat | null;
  productivityScore: number; // 0-100
  suggestions: string[];
}
