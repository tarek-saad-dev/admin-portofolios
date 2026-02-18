# Canvas Planning Integration - Phase C2

## Overview
Extended Canvas module with planning controls to push linked tasks into the existing task system (Backlog / Weekly Planner).

## ✅ Completed Implementation

### 1. Task Schema Updates
**File:** `types/task-os.ts`

Added fields to Task interface:
```typescript
weekId?: string;              // e.g. "2026-02-15_to_2026-02-21"
assignedDay?: DayOfWeek | null; // "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat"
sourceCanvasNodeId?: ObjectId;  // Link back to canvas node
```

New type:
```typescript
export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
```

### 2. API Updates
**File:** `app/api/os/tasks/[id]/route.ts`

Enhanced PATCH endpoint with:
- Support for `weekId` and `assignedDay` updates
- **Critical Backlog Return Logic:**
  ```typescript
  if (status === "backlog") {
    if (task.weekId exists) {
      → status = "this_week"
      → assignedDay = null
      → Keep weekId (stays in weekly planner)
    } else {
      → status = "backlog"
      → weekId = null
      → assignedDay = null (true backlog)
    }
  }
  ```
- Auto-status management:
  - `assignedDay` set → status = "today"
  - `assignedDay` = null + `weekId` exists → status = "this_week"

### 3. Week Utilities
**File:** `lib/utils/week-utils.ts`

Helper functions:
- `generateWeekId(date?)` - Creates week identifier
- `getCurrentDayOfWeek()` - Gets current day as DayOfWeek
- `getDayName(day)` - Converts DayOfWeek to readable name
- `parseWeekId(weekId)` - Extracts start/end dates
- `isCurrentWeek(weekId)` - Checks if weekId is current week

### 4. Task Planning Controls Component
**File:** `components/canvas/task-planning-controls.tsx`

Features:
- **Status Dropdown:** Backlog / This Week Pool / Today / Done
- **Week Display:** Shows current week (read-only)
- **Day Assignment:** Dropdown for Sun-Sat or None
- **Quick Actions:**
  - "Send to This Week Pool" button
  - "Schedule for Today" button
- **Open in Tasks** link
- Task info display (ID, week, day)

## Rules & Logic

### Task Status Flow
```
Backlog (no weekId)
    ↓ (add to week)
This Week Pool (weekId set, assignedDay = null)
    ↓ (assign day)
Today (weekId set, assignedDay = specific day)
    ↓ (complete)
Done
```

### Backlog Return Behavior
**Scenario 1: Task from This Week Pool**
- Task has `weekId` set
- User moves to "backlog"
- Result: Returns to "This Week Pool" (status = "this_week")
- Reason: Task is still part of this week's planning

**Scenario 2: True Backlog**
- Task has no `weekId`
- User moves to "backlog"
- Result: Goes to true Backlog (status = "backlog")
- Reason: Task was never part of weekly planning

### Day Assignment Rules
1. **assignedDay NOT null** → Task scheduled for specific day
2. **assignedDay = null + weekId exists** → Task in This Week Pool
3. **assignedDay = null + no weekId** → Task in Backlog

## Integration with Canvas Inspector

When `node.linkedTaskId` exists, show:
```tsx
import { TaskPlanningControls } from "@/components/canvas/task-planning-controls";

{node.linkedTaskId && (
  <TaskPlanningControls
    taskId={node.linkedTaskId.toString()}
    onTaskUpdated={() => {
      // Refresh canvas data
      // Invalidate tasks cache
    }}
  />
)}
```

## Sync Requirements

After planning changes in Canvas:
1. Tasks Board automatically reflects changes (via status/weekId/assignedDay)
2. Weekly Planner shows task in correct day column
3. No disappearing tasks (backlog logic prevents this)
4. Cache invalidation triggers refetch

## API Endpoints

### Update Task Planning
```http
PATCH /api/os/tasks/:taskId
Content-Type: application/json

{
  "status": "this_week",
  "weekId": "2026-02-15_to_2026-02-21",
  "assignedDay": "mon"
}
```

### Quick Actions
**Send to This Week Pool:**
```json
{
  "status": "this_week",
  "weekId": "<current_week>",
  "assignedDay": null
}
```

**Schedule for Today:**
```json
{
  "status": "today",
  "weekId": "<current_week>",
  "assignedDay": "<current_day>"
}
```

## Testing Checklist

- [ ] Convert Canvas node to task
- [ ] Send task to This Week Pool from Canvas
- [ ] Verify task appears in Weekly Planner "This Week Pool"
- [ ] Assign task to specific day from Canvas
- [ ] Verify task appears in correct day column in Weekly Planner
- [ ] Return task to "backlog" from assigned day
- [ ] Verify task returns to This Week Pool (not disappearing)
- [ ] Clear weekId and return to true backlog
- [ ] Verify task appears in Tasks Board Backlog column
- [ ] Mark task as done from Canvas
- [ ] Verify task appears in Done column

## Database Indexes

Add to `lib/db/task-os-db.ts` in `createIndexes()`:

```typescript
// Tasks indexes for Canvas planning
await db.collection("tasks").createIndexes([
  { key: { weekId: 1 } },
  { key: { assignedDay: 1 } },
  { key: { sourceCanvasNodeId: 1 } },
  { key: { weekId: 1, assignedDay: 1 } },
  { key: { weekId: 1, status: 1 } },
]);
```

## Next Steps

1. **Canvas Inspector Integration:**
   - Add TaskPlanningControls to Canvas Inspector
   - Show only when node.linkedTaskId exists
   - Handle cache invalidation on updates

2. **Convert-to-Task API:**
   - Create endpoint to convert Canvas node to task
   - Set sourceCanvasNodeId on created task
   - Update node.linkedTaskId after creation

3. **Weekly Planner Sync:**
   - Ensure Weekly Planner queries by weekId + assignedDay
   - Update This Week Pool to show tasks with weekId but no assignedDay
   - Test full workflow end-to-end

4. **UI Polish:**
   - Add loading states
   - Show success/error toasts
   - Add confirmation dialogs for destructive actions
   - Display task status badge in Canvas node

## Benefits

✅ **No Disappearing Tasks** - Backlog logic respects weekId  
✅ **Seamless Integration** - Canvas controls update existing task system  
✅ **Clear Status Flow** - Backlog → This Week → Today → Done  
✅ **Flexible Planning** - Assign/unassign days without losing context  
✅ **Bi-directional Sync** - Changes in Canvas reflect in Tasks/Planner  
✅ **Week-based Organization** - Tasks grouped by week for better planning  
