export interface Goal {
  id: string;
  type: 'Monthly' | 'Weekly';
  title: string;
  progress: number; // 0-100 derived
  month?: string; // YYYY-MM
  weekId?: string; // e.g. "2026-W13"
  color?: string;
  parentGoalId?: string;
  createdAt: number;
}

export interface TaskGoalMapping {
  id: string;
  taskId: string; // The ID of the PlannerBlock or DayTodo
  goalId: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  activeMinutes: number;
  idleMinutes: number;
  tasksCompleted: number;
  flowSessions: number; // count of continuous sessions > 25m
}
