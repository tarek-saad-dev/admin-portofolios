"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { WeeklyPlannerGrid } from "@/components/task-os/weekly-planner-grid";
import { TaskWithDetails, Department, DailyFocusWithTasks } from "@/types/task-os";

export default function PlannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [dailyFocusData, setDailyFocusData] = useState<Map<string, DailyFocusWithTasks>>(new Map());
  const [thisWeekTasks, setThisWeekTasks] = useState<TaskWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeWeek = async () => {
      try {
        // Cleanup overdue tasks first
        await fetch("/api/os/tasks/cleanup", { method: "POST" });
      } catch (error) {
        console.error("Error running cleanup:", error);
      }

      const dates = generateWeekDates(currentWeekStart);
      setWeekDates(dates);
      fetchWeekData(dates);
    };

    initializeWeek();
  }, [currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Start on Sunday
    return new Date(d.setDate(diff));
  }

  function generateWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const fetchWeekData = async (dates: Date[]) => {
    try {
      setLoading(true);

      // Fetch departments
      const deptsRes = await fetch("/api/os/departments");
      const deptsData = await deptsRes.json();
      if (deptsData.success) setDepartments(deptsData.data);

      // Fetch this week tasks
      const tasksRes = await fetch("/api/os/tasks?status=this_week");
      const tasksData = await tasksRes.json();
      if (tasksData.success) setThisWeekTasks(tasksData.data);

      // Fetch daily focus for each day
      const dailyFocusMap = new Map<string, DailyFocusWithTasks>();
      await Promise.all(
        dates.map(async (date) => {
          const dateStr = date.toISOString().split("T")[0];
          const res = await fetch(`/api/os/daily-focus?date=${dateStr}`);
          const data = await res.json();
          if (data.success) {
            dailyFocusMap.set(dateStr, data.data);
          }
        })
      );
      setDailyFocusData(dailyFocusMap);
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDrop = async (taskId: string, date: string) => {
    try {
      const dayData = dailyFocusData.get(date);
      const currentTasks = dayData?.tasks?.map((id) => id.toString()) || [];

      // Add new task
      const updatedTasks = [...currentTasks, taskId];

      const res = await fetch(`/api/os/daily-focus?date=${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: updatedTasks,
          focusDepartmentId: dayData?.focusDepartmentId?.toString() || null,
          notes: dayData?.notes || "",
        }),
      });

      if (res.ok) {
        // Also update task status to "today" if it's today's date
        const today = new Date().toISOString().split("T")[0];
        if (date === today) {
          await fetch(`/api/os/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "today" }),
          });
        }

        await fetchWeekData(weekDates);
      }
    } catch (error) {
      console.error("Error dropping task:", error);
    }
  };

  const handleFocusDepartmentChange = async (date: string, departmentId: string | null) => {
    try {
      const dayData = dailyFocusData.get(date);
      const currentTasks = dayData?.tasks?.map((id) => id.toString()) || [];

      const res = await fetch(`/api/os/daily-focus?date=${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: currentTasks,
          focusDepartmentId: departmentId,
          notes: dayData?.notes || "",
        }),
      });

      if (res.ok) {
        await fetchWeekData(weekDates);
      }
    } catch (error) {
      console.error("Error updating focus department:", error);
    }
  };

  const handleTaskRemove = async (taskId: string, date: string) => {
    try {
      const dayData = dailyFocusData.get(date);
      const currentTasks = dayData?.tasks?.map((id) => id.toString()) || [];
      const updatedTasks = currentTasks.filter((id) => id !== taskId);

      // Update daily focus to remove task from this day
      const res = await fetch(`/api/os/daily-focus?date=${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: updatedTasks,
          focusDepartmentId: dayData?.focusDepartmentId?.toString() || null,
          notes: dayData?.notes || "",
        }),
      });

      if (res.ok) {
        // Update task status back to "this_week" so it returns to This Week Pool
        await fetch(`/api/os/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "this_week" }),
        });

        await fetchWeekData(weekDates);
      }
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getWeekRange = () => {
    if (weekDates.length === 0) return "";
    const start = weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Planner</h1>
          <p className="text-muted-foreground">Drag tasks from the pool to plan your week</p>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-lg">{getWeekRange()}</span>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <WeeklyPlannerGrid
        weekDates={weekDates}
        dailyFocusData={dailyFocusData}
        thisWeekTasks={thisWeekTasks}
        departments={departments}
        onTaskDrop={handleTaskDrop}
        onFocusDepartmentChange={handleFocusDepartmentChange}
        onTaskRemove={handleTaskRemove}
      />
    </div>
  );
}
