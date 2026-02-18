"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Clock, Flame, TrendingUp } from "lucide-react";
import { DailyFocusWithTasks, TaskWithDetails, AnalyticsOverview } from "@/types/task-os";
import { TaskCard } from "@/components/task-os/task-card";
import { QuickAddTask } from "@/components/task-os/quick-add-task";

export default function TaskOsDashboard() {
  const [todayFocus, setTodayFocus] = useState<DailyFocusWithTasks | null>(null);
  const [thisWeekTasks, setThisWeekTasks] = useState<TaskWithDetails[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Run cleanup first, then fetch data
    const initializeDashboard = async () => {
      try {
        // Cleanup overdue tasks (move incomplete "today" tasks back to backlog)
        await fetch("/api/os/tasks/cleanup", { method: "POST" });
      } catch (error) {
        console.error("Error running cleanup:", error);
      }
      // Then fetch fresh data
      fetchDashboardData();
    };

    initializeDashboard();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get week range
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [todayTasksRes, weekRes, analyticsRes] = await Promise.all([
        fetch(`/api/os/tasks?status=today`),
        fetch(`/api/os/tasks?status=this_week`),
        fetch(`/api/os/analytics?from=${weekStart.toISOString().split("T")[0]}&to=${weekEnd.toISOString().split("T")[0]}`),
      ]);

      const [todayTasksData, weekData, analyticsData] = await Promise.all([
        todayTasksRes.json(),
        weekRes.json(),
        analyticsRes.json(),
      ]);

      // Create a DailyFocusWithTasks-like object from today's tasks
      if (todayTasksData.success) {
        const todayTasksList = todayTasksData.data;
        const totalMinutes = todayTasksList.reduce((sum: number, task: TaskWithDetails) => sum + (task.estimatedMinutes || 0), 0);

        setTodayFocus({
          date: today,
          tasks: [],
          taskDetails: todayTasksList,
          totalEstimatedMinutes: totalMinutes,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      if (weekData.success) setThisWeekTasks(weekData.data);
      if (analyticsData.success) setAnalytics(analyticsData.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/os/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayTasks = todayFocus?.taskDetails || [];
  const completedThisWeek = analytics?.totalCompleted || 0;
  const focusMinutesThisWeek = analytics?.totalFocusMinutes || 0;
  const streak = analytics?.streak || 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tarek OS</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your multi-department task operating system</p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Quick Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(focusMinutesThisWeek / 60)}h</div>
            <p className="text-xs text-muted-foreground">{focusMinutesThisWeek} minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak}</div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Today ({todayTasks.length}/5)</CardTitle>
            <CardDescription>
              {todayFocus?.totalEstimatedMinutes
                ? `~${todayFocus.totalEstimatedMinutes} minutes planned`
                : "No tasks planned yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks for today. Add tasks from "This Week" or create new ones.</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <TaskCard
                  key={task._id?.toString()}
                  task={task}
                  onComplete={() => handleTaskComplete(task._id!.toString())}
                  onUpdate={fetchDashboardData}
                  compact
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* This Week Panel */}
        <Card>
          <CardHeader>
            <CardTitle>This Week ({thisWeekTasks.length})</CardTitle>
            <CardDescription>Tasks ready to be scheduled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {thisWeekTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks for this week. Move tasks from backlog or create new ones.</p>
              </div>
            ) : (
              thisWeekTasks.slice(0, 10).map((task) => (
                <TaskCard
                  key={task._id?.toString()}
                  task={task}
                  onUpdate={fetchDashboardData}
                  compact
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      {analytics && analytics.completedTasksByDepartment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>This Week by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.completedTasksByDepartment.map((dept) => (
                <div key={dept.departmentId} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept.departmentName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(dept.count / completedThisWeek) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {dept.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTask
          open={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
