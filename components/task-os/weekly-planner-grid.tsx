"use client";

import { useState } from "react";
import { TaskWithDetails, Department, DailyFocusWithTasks } from "@/types/task-os";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCard } from "./task-card";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyPlannerGridProps {
  weekDates: Date[];
  dailyFocusData: Map<string, DailyFocusWithTasks>;
  thisWeekTasks: TaskWithDetails[];
  departments: Department[];
  onTaskDrop: (taskId: string, date: string) => Promise<void>;
  onFocusDepartmentChange: (date: string, departmentId: string | null) => Promise<void>;
  onTaskRemove: (taskId: string, date: string) => Promise<void>;
}

export function WeeklyPlannerGrid({
  weekDates,
  dailyFocusData,
  thisWeekTasks,
  departments,
  onTaskDrop,
  onFocusDepartmentChange,
  onTaskRemove,
}: WeeklyPlannerGridProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getDateDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDragStart = (task: TaskWithDetails) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTask) return;

    const dayData = dailyFocusData.get(date);
    const currentTaskCount = dayData?.tasks?.length || 0;

    // Check if task is already in this day
    const isAlreadyInDay = dayData?.tasks?.some(
      (id) => id.toString() === draggedTask._id?.toString()
    );

    if (isAlreadyInDay) {
      setDraggedTask(null);
      return;
    }

    // Check max 5 tasks per day
    if (currentTaskCount >= 5) {
      alert("This day is full (max 5 tasks). Remove a task first.");
      setDraggedTask(null);
      return;
    }

    await onTaskDrop(draggedTask._id!.toString(), date);
    setDraggedTask(null);
  };

  const getTotalMinutes = (date: string) => {
    const dayData = dailyFocusData.get(date);
    return dayData?.totalEstimatedMinutes || 0;
  };

  const getTasksForDay = (date: string) => {
    const dayData = dailyFocusData.get(date);
    return dayData?.taskDetails || [];
  };

  const getFocusDepartment = (date: string) => {
    const dayData = dailyFocusData.get(date);
    return dayData?.focusDepartment;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
      {/* This Week Pool */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>This Week Pool</span>
            <Badge variant="secondary">{thisWeekTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {thisWeekTasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks in this week pool
            </div>
          ) : (
            thisWeekTasks.map((task) => (
              <div
                key={task._id?.toString()}
                draggable
                onDragStart={() => handleDragStart(task)}
                className="cursor-move"
              >
                <TaskCard task={task} onUpdate={() => {}} compact />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 7-Day Grid */}
      <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date) => {
          const dateStr = formatDate(date);
          const dayTasks = getTasksForDay(dateStr);
          const totalMinutes = getTotalMinutes(dateStr);
          const focusDept = getFocusDepartment(dateStr);
          const isDragOver = dragOverDate === dateStr;
          const isTodayDate = isToday(date);

          return (
            <Card
              key={dateStr}
              className={cn(
                "flex flex-col transition-all",
                isDragOver && "ring-2 ring-primary",
                isTodayDate && "border-primary border-2"
              )}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              <CardHeader className="pb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{getDayName(date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getDateDisplay(date)}
                    </div>
                  </div>
                  <Badge variant={isTodayDate ? "default" : "outline"} className="text-xs">
                    {dayTasks.length}/5
                  </Badge>
                </div>

                {/* Focus Department Selector */}
                <Select
                  value={focusDept?._id?.toString() || "none"}
                  onValueChange={(val) =>
                    onFocusDepartmentChange(dateStr, val === "none" ? null : val)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Focus dept" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No focus</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id?.toString()} value={dept._id!.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Total Time */}
                {totalMinutes > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {totalMinutes}m (~{Math.round(totalMinutes / 60)}h)
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                {dayTasks.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    {isDragOver ? "Drop here" : "No tasks"}
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div key={task._id?.toString()} className="relative group">
                      <TaskCard task={task} onUpdate={() => {}} compact />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                        onClick={() => onTaskRemove(task._id!.toString(), dateStr)}
                      >
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}

                {dayTasks.length >= 5 && (
                  <div className="text-xs text-center text-orange-500 font-medium">
                    Day is full
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
