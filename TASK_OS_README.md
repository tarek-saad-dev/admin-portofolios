# Tarek OS - Multi-Department Task Operating System

A complete internal task management system for managing multiple career streams (Graphic Design, Video Editing, Instructor, Programming) with Corporate/Freelance tracks.

---

## 🎯 Features

- **Central Task Capture** - Brain dump tasks and organize them by department and track
- **Daily Execution** - Max 5 tasks per day with focus planning
- **Weekly Planning** - Choose focus department per day
- **Progress Analytics** - Track completion, focus time, and streaks
- **Multiple Views** - Board (Kanban), Table, and Weekly Planner
- **Keyboard Shortcuts** - Ultra-fast task entry and navigation

---

## 📊 Data Model

### Collections

1. **departments** - Company departments (Graphic Design, Video Editing, Instructor, Programming)
2. **tracks** - Corporate/Freelance tracks per department
3. **tasks** - Core task entities with status, priority, energy type, revenue type
4. **daily_focus** - Daily plans with max 5 tasks
5. **focus_sessions** - Deep work timer sessions

### Task Statuses

- `backlog` → `this_week` → `today` → `done` → `archived`

### Business Rules

- **Max 5 tasks per day** - Hard limit enforced
- **Stale task warning** - Tasks in backlog >30 days flagged
- **Task size recommendation** - Suggest splitting tasks >120 minutes
- **Auto-cleanup** - Remove archived tasks from daily focus

---

## 🚀 Getting Started

### 1. Environment Setup

Ensure your `.env.local` has MongoDB connection:

```env
MONGODB_URI=mongodb+srv://your-connection-string
```

The Task OS uses a separate database called `task-os`.

### 2. Seed Initial Data

Run the seed script to create departments and tracks:

```bash
# Option 1: Direct execution
npx ts-node lib/db/seed-task-os.ts

# Option 2: Via API (first time the system runs)
# The seed will auto-run on first API call
```

This creates:
- 4 Departments: Graphic Design, Video Editing, Instructor, Programming
- 2 Tracks per department: Corporate, Freelance

### 3. Access the System

Navigate to: **http://localhost:3001/admin/os**

---

## 📡 API Endpoints

### Departments

```
GET    /api/os/departments
POST   /api/os/departments
PATCH  /api/os/departments/:id
DELETE /api/os/departments/:id
```

### Tracks

```
GET    /api/os/tracks?departmentId=xxx
POST   /api/os/tracks
PATCH  /api/os/tracks/:id
```

### Tasks

```
GET    /api/os/tasks?status=&departmentId=&trackId=&priority=&q=
POST   /api/os/tasks
PATCH  /api/os/tasks/:id
DELETE /api/os/tasks/:id
```

**Query Parameters:**
- `status` - Filter by status (backlog, this_week, today, done, archived)
- `departmentId` - Filter by department
- `trackId` - Filter by track
- `priority` - Filter by priority (high, medium, low)
- `revenueType` - Filter by revenue type
- `energyType` - Filter by energy type
- `q` - Text search in title/description
- `from` / `to` - Date range filters
- `page` / `limit` - Pagination

### Daily Focus

```
GET    /api/os/daily-focus?date=YYYY-MM-DD
PUT    /api/os/daily-focus?date=YYYY-MM-DD
```

### Analytics

```
GET    /api/os/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
```

---

## 📋 API Response Examples

### Create Task

**Request:**
```json
POST /api/os/tasks
{
  "title": "Design new landing page",
  "description": "Create hero section with animations",
  "departmentId": "507f1f77bcf86cd799439011",
  "trackId": "507f1f77bcf86cd799439012",
  "status": "backlog",
  "priority": "high",
  "energyType": "creative",
  "revenueType": "revenue_now",
  "estimatedMinutes": 90,
  "tags": ["design", "landing-page"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Design new landing page",
    "status": "backlog",
    "priority": "high",
    "energyType": "creative",
    "revenueType": "revenue_now",
    "estimatedMinutes": 90,
    "orderIndex": 1,
    "isPinned": false,
    "createdAt": "2026-02-17T07:52:00.000Z",
    "updatedAt": "2026-02-17T07:52:00.000Z"
  }
}
```

### Get Analytics

**Request:**
```
GET /api/os/analytics?from=2026-02-10&to=2026-02-17
```

**Response:**
```json
{
  "success": true,
  "data": {
    "completedTasksByDepartment": [
      {
        "departmentId": "507f1f77bcf86cd799439011",
        "departmentName": "Graphic Design",
        "count": 12
      },
      {
        "departmentId": "507f1f77bcf86cd799439014",
        "departmentName": "Programming",
        "count": 8
      }
    ],
    "completedTasksByTrack": [
      {
        "trackId": "507f1f77bcf86cd799439012",
        "trackName": "Corporate",
        "departmentName": "Graphic Design",
        "count": 7
      }
    ],
    "focusMinutesByDepartment": [
      {
        "departmentId": "507f1f77bcf86cd799439011",
        "departmentName": "Graphic Design",
        "minutes": 480
      }
    ],
    "revenueTypeDistribution": [
      {
        "revenueType": "revenue_now",
        "count": 8
      },
      {
        "revenueType": "long_term_brand",
        "count": 6
      },
      {
        "revenueType": "skill_growth",
        "count": 6
      }
    ],
    "streak": 5,
    "topStaleTasks": {
      "count": 3,
      "tasks": []
    },
    "totalCompleted": 20,
    "totalFocusMinutes": 1200,
    "completionRate": 65
  }
}
```

---

## 🎨 UI Pages

### Dashboard (`/admin/os`)

- **Today Panel** - Current day's tasks (max 5)
- **This Week Panel** - Tasks ready to schedule
- **Stats Widgets** - Completed tasks, focus time, streak, completion rate
- **Department Breakdown** - Visual progress bars

### Tasks Page (`/admin/os/tasks`)

Three views:
1. **Board View** - Kanban board (Backlog / This Week / Today / Done)
2. **Table View** - Advanced filtering and sorting
3. **Quick Add** - Fast task creation

### Weekly Planner (`/admin/os/planner`)

- 7-day layout (configurable start day)
- Drag tasks from "This Week" to specific days
- Set focus department per day
- Enforce max 5 tasks per day
- Show estimated total minutes

### Analytics (`/admin/os/analytics`)

Charts:
- Completed tasks over time (line chart)
- Focus minutes over time (area chart)
- Revenue type distribution (pie chart)
- Department performance (bar chart)
- Stale tasks list

### Settings (`/admin/os/settings`)

- CRUD departments
- CRUD tracks
- Reorder departments
- Configure colors and icons

---

## ⌨️ Keyboard Shortcuts

- **`N`** - Open Quick Add Task modal
- **`Enter`** - Save/Submit
- **`Esc`** - Close modal/dialog
- **`/`** - Focus search (when implemented)

---

## 🗄️ Database Indexes

Optimized indexes for performance:

**Tasks Collection:**
- `status` (single)
- `departmentId` (single)
- `trackId` (single)
- `status + departmentId` (compound)
- `createdAt` (descending)
- `completedAt` (descending)
- `dueDate` (ascending)
- `title + description` (text search)

**Daily Focus Collection:**
- `date` (unique)
- `focusDepartmentId`

**Focus Sessions Collection:**
- `taskId`
- `date`
- `startAt` (descending)

---

## 🔧 Development

### File Structure

```
app/
├── admin/os/
│   ├── page.tsx              # Dashboard
│   ├── tasks/page.tsx        # Tasks page (to be created)
│   ├── planner/page.tsx      # Weekly planner (to be created)
│   ├── analytics/page.tsx    # Analytics (to be created)
│   └── settings/page.tsx     # Settings (to be created)
├── api/os/
│   ├── departments/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── tracks/route.ts
│   ├── tasks/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── daily-focus/route.ts
│   └── analytics/route.ts
components/task-os/
├── task-card.tsx
├── quick-add-task.tsx
├── task-board.tsx            # To be created
├── task-table.tsx            # To be created
└── weekly-planner.tsx        # To be created
lib/db/
├── task-os-db.ts
└── seed-task-os.ts
types/
└── task-os.ts
```

### Adding New Features

1. **Add new task field:**
   - Update `Task` interface in `types/task-os.ts`
   - Update API validation in task routes
   - Update UI forms

2. **Add new department:**
   - Use Settings page or POST to `/api/os/departments`
   - Add tracks for the department

3. **Custom analytics:**
   - Extend `/api/os/analytics/route.ts`
   - Add new chart components

---

## 🚨 Error Handling

### Common Errors

**"Today is full (max 5 tasks)"**
- Move a task out of today before adding new ones
- Archive or complete existing tasks

**"Invalid department/track ID"**
- Ensure department and track exist
- Check that IDs are valid MongoDB ObjectIds

**"Task not found"**
- Task may have been archived
- Check task ID is correct

---

## 📈 Best Practices

### Task Management

1. **Keep tasks small** - 30-90 minutes ideal
2. **Use energy types** - Match tasks to your energy level
3. **Set priorities** - Focus on high-priority items
4. **Review weekly** - Move tasks from backlog to this week
5. **Daily planning** - Select max 5 tasks each morning

### Department Organization

- **Graphic Design** - Client work, personal projects, portfolio
- **Video Editing** - Corporate videos, freelance edits
- **Instructor** - Course creation, student support
- **Programming** - Development projects, learning

### Revenue Types

- **Revenue Now** - Immediate income-generating tasks
- **Long-term Brand** - Marketing, networking, content
- **Skill Growth** - Learning, experimentation, R&D

---

## 🔒 Security Notes

- All API routes should be protected with authentication (to be implemented)
- MongoDB connection string should be in environment variables
- Validate all user inputs on the server side
- Use proper error handling to avoid exposing sensitive data

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core data model and API
- ✅ Dashboard page
- ✅ Task creation and management
- ✅ Daily focus planning
- ✅ Analytics

### Phase 2 (Next)
- ⏳ Tasks page with Board/Table views
- ⏳ Weekly planner
- ⏳ Settings page
- ⏳ Keyboard shortcuts
- ⏳ Focus timer integration

### Phase 3 (Future)
- ⏳ Recurring tasks
- ⏳ Task dependencies
- ⏳ Team collaboration
- ⏳ Mobile app
- ⏳ Calendar integration
- ⏳ Notifications

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Check browser console for errors
4. Verify MongoDB connection

---

## 📝 License

Internal tool for personal use.

---

**Built with:** Next.js 14, MongoDB, TypeScript, Tailwind CSS, shadcn/ui
