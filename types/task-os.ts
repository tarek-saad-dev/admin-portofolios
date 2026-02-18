/**
 * Task OS - TypeScript Type Definitions
 */

import { ObjectId } from "mongodb";

// ==================== ENUMS ====================

export type TaskStatus = "backlog" | "this_week" | "today" | "done" | "archived";
export type TaskPriority = "high" | "medium" | "low";
export type EnergyType = "deep" | "light" | "creative" | "admin";
export type RevenueType = "revenue_now" | "long_term_brand" | "skill_growth";
export type FocusMode = "pomodoro" | "custom";

// ==================== DEPARTMENT ====================

export interface Department {
  _id?: ObjectId;
  name: string;
  slug: string;
  icon: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentInput {
  name: string;
  slug: string;
  icon: string;
  color?: string;
  order: number;
  isActive?: boolean;
}

// ==================== TRACK ====================

export interface Track {
  _id?: ObjectId;
  departmentId: ObjectId;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackInput {
  departmentId: string;
  name: string;
  slug: string;
  order: number;
  isActive?: boolean;
}

// ==================== TASK ====================

export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface Task {
  _id?: ObjectId;
  title: string;
  description?: string;
  departmentId: ObjectId;
  trackId: ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  energyType: EnergyType;
  revenueType: RevenueType;
  estimatedMinutes: number;
  dueDate?: Date | null;
  tags: string[];
  orderIndex: number;
  isPinned: boolean;
  createdBy?: string;
  weekId?: string; // e.g. "2026-02-15_to_2026-02-21" for weekly planning
  assignedDay?: DayOfWeek | null; // Day assignment within the week
  sourceCanvasNodeId?: ObjectId; // Link back to canvas node if created from Canvas
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  archivedAt?: Date | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  departmentId: string;
  trackId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  energyType?: EnergyType;
  revenueType?: RevenueType;
  estimatedMinutes?: number;
  dueDate?: string | null;
  tags?: string[];
  isPinned?: boolean;
  weekId?: string;
  assignedDay?: DayOfWeek | null;
  sourceCanvasNodeId?: string;
}

export interface TaskWithDetails extends Task {
  department?: Department;
  track?: Track;
  isStale?: boolean;
}

// ==================== DAILY FOCUS ====================

export interface DailyFocus {
  _id?: ObjectId;
  date: string; // YYYY-MM-DD
  tasks: ObjectId[];
  focusDepartmentId?: ObjectId | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyFocusInput {
  date: string;
  tasks?: string[];
  focusDepartmentId?: string | null;
  notes?: string;
}

export interface DailyFocusWithTasks extends DailyFocus {
  taskDetails?: TaskWithDetails[];
  totalEstimatedMinutes?: number;
  focusDepartment?: Department;
}

// ==================== FOCUS SESSION ====================

export interface FocusSession {
  _id?: ObjectId;
  taskId?: ObjectId | null;
  date: string; // YYYY-MM-DD
  startAt: Date;
  endAt?: Date;
  durationMinutes: number;
  mode: FocusMode;
  createdAt: Date;
}

export interface FocusSessionInput {
  taskId?: string | null;
  mode?: FocusMode;
}

export interface FocusSessionWithTask extends FocusSession {
  task?: TaskWithDetails;
}

// ==================== ANALYTICS ====================

export interface AnalyticsOverview {
  }[];
  revenueTypeDistribution: {
    revenueType: RevenueType;
    count: number;
  }[];
  streak: number;
  topStaleTasks: {
    count: number;
    tasks: TaskWithDetails[];
  };
  totalCompleted: number;
  totalFocusMinutes: number;
  completionRate: number;
}

export interface DailyCompletionData {
  date: string;
  completed: number;
  focusMinutes: number;
}

// ==================== QUERY PARAMS ====================

export interface TaskQueryParams {
  status?: TaskStatus;
  departmentId?: string;
  trackId?: string;
  priority?: TaskPriority;
  revenueType?: RevenueType;
  energyType?: EnergyType;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export interface FocusSessionQueryParams {
  from?: string;
  to?: string;
  departmentId?: string;
  taskId?: string;
}

export interface AnalyticsQueryParams {
  from?: string;
  to?: string;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
