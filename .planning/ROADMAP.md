---

## Proposed Roadmap

**5 phases** | **22 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Groundwork & UI Fix | Fix existing UI overlaps and extend DB schema/backend foundation | FIX-01, UX-01, ARCH-01, ARCH-02 | 3 |
| 2 | Deep Work System | Implement Focus Mode, Pomodoro, and Flow state tracking | DEEP-01 to DEEP-06 | 3 |
| 3 | Goal Tracking | Add Monthly/Weekly goals and hierarchical linking | GOAL-01 to GOAL-04 | 3 |
| 4 | Time Intelligence & Insights | Activity tracking, charts, and energy-based tagging | TIME-01 to TIME-04, AI-04 | 3 |
| 5 | Smart & Predictive Planning | Voice input, heuristic scheduling, auto-rescheduling | AI-01 to AI-03 | 3 |

### Phase Details

**Phase 1: Groundwork & UI Fix**
Goal: Fix the Weekly Dashboard UI overlap and safely prepare the backend/DB for new features.
Requirements: FIX-01, UX-01, ARCH-01, ARCH-02
Success criteria:
1. Weekly dashboard displays tasks without UI overlapping.
2. New DB tables (`goals`, `task_goal_mapping`, `activity_logs`) are created via migrations safely.
3. Stub backend services (`schedulingService`, `analyticsService`, `goalService`) exist.
**UI hint**: yes

**Phase 2: Deep Work System**
Goal: Equip users with Pomodoro tools, Focus Blocks, and flow detection.
Requirements: DEEP-01, DEEP-02, DEEP-03, DEEP-04, DEEP-05, DEEP-06
Success criteria:
1. User can toggle Focus Mode and use Pomodoro timer.
2. Flow state activates when working continuously for >25 mins.
3. System can block time on the calendar for Focus Blocks.
**UI hint**: yes

**Phase 3: Goal Tracking**
Goal: Users can link individual tasks up to Weekly and Monthly goals.
Requirements: GOAL-01, GOAL-02, GOAL-03, GOAL-04
Success criteria:
1. Goal Dashboard correctly calculates progress % based on linked tasks.
2. User can create a Monthly Goal and link Weekly Goals/Tasks to it.
**UI hint**: yes

**Phase 4: Time Intelligence & Insights**
Goal: Track time spent and display analytics dashboards.
Requirements: TIME-01, TIME-02, TIME-03, TIME-04, AI-04
Success criteria:
1. Idle time and active metrics are logged in DB.
2. Insights Dashboard renders charts via Chart.js/Recharts.
3. Energy tagging allows users to filter/select optimal tasks.
**UI hint**: yes

**Phase 5: Smart & Predictive Planning**
Goal: Automate scheduling and add voice task creation.
Requirements: AI-01, AI-02, AI-03
Success criteria:
1. Voice Planner successfully creates a task using Web Speech API.
2. Algorithm schedules tasks into empty slots avoiding conflicts.
3. Dashboard suggests rescheduling incomplete past tasks.
**UI hint**: yes

---
