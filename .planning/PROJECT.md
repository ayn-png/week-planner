# Weekly Planner Pro

## What This Is
An extension of an existing Weekly Planner web application (React/Next.js + backend + database) to add advanced productivity and AI features. It transforms a basic planner into an AI-powered productivity system without breaking backward compatibility or current functionality.

## Core Value
Provide an ultra-advanced, AI-powered productivity and deep work system that integrates seamlessly into the existing planner, using only free tools and maintaining a clean, scalable architecture.

## Requirements

### Validated
- ✓ Working Weekly Planner web application
- ✓ Basic task management
- ✓ Existing backend architecture and database
- ✓ Existing frontend (React/Next.js)

### Active
- [ ] Add "Focus Mode" toggle and Focus Blocks
- [ ] Implement Pomodoro Timer
- [ ] Implement Flow State Detection (track continuous work > 25 mins)
- [ ] Time Intelligence (track activity/idle time, suggest Best Time)
- [ ] Goal Linking System (Monthly -> Weekly -> Tasks) with progress
- [ ] Smart Scheduler (heuristic/local AI to suggest time slots)
- [ ] Voice Planner (Web Speech API for task creation)
- [ ] AI Insights Dashboard (productivity analytics, Recharts/Chart.js)
- [ ] Predictive Planning (auto-reschedule incomplete tasks)
- [ ] Fix Weekly Dashboard UI overlapping issue

### Out of Scope
- Paid AI APIs or paid tools (rule: strictly free tools/libraries only)
- Rewriting the existing system
- Removing or heavily modifying existing working features

## Context
- Existing App: React/Next.js frontend + backend + database.
- Goal: Add advanced Deep Work and AI features.
- Keep UI minimalistic, support dark mode. Add components modularly.
- Backend needs new services: `schedulingService`, `analyticsService`, `goalService`.
- DB schema extension required but must not break existing tables.

## Constraints
- **Cost**: Only use FREE tools, APIs, and libraries (e.g. Web Speech API, Chart.js). Use heuristic scheduling if no open-source AI is available.
- **Backward Compatibility**: Do NOT break existing features or modify existing endpoints/components heavily.
- **Architecture**: Modular, feature-based or service-based. Clean, scalable, production-ready.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Web Speech API for voice | Free built-in browser API, avoids external cloud costs | — Pending |
| Use Chart.js/Recharts | Free, easy to integrate into Next.js | — Pending |

---
*Last updated: 2026-04-01 after project initialization*
