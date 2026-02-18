"use client";

import { useState } from "react";
import { TaskWithDetails, TaskStatus } from "@/types/task-os";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: TaskWithDetails[];
  onTaskUpdate: () => void;
}

const COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: "backlog", title: "Backlog", color: "bg-slate-100 dark:bg-slate-900" },
  { status: "this_week", title: "This Week", color: "bg-blue-50 dark:bg-blue-950" },
  { status: "today", title: "Today", color: "bg-purple-50 dark:bg-purple-950" },
  { status: "done", title: "Done", color: "bg-green-50 dark:bg-green-950" },
];

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: TaskWithDetails) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Check if moving to "today" would exceed limit
    if (newStatus === "today") {
      const todayTasks = getTasksByStatus("today");
      if (todayTasks.length >= 5 && draggedTask.status !== "today") {
        alert("Today is full (max 5 tasks). Move something out first.");
        setDraggedTask(null);
        return;
      }
    }

    try {
      const res = await fetch(`/api/os/tasks/${draggedTask._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onTaskUpdate();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }

    setDraggedTask(null);
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/os/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });

      if (res.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isToday = column.status === "today";
        const isDragOver = dragOverColumn === column.status;

        return (
          <div
            key={column.status}
            className="flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <Card className={cn(
              "flex-1 flex flex-col transition-all",
              isDragOver && "ring-2 ring-primary"
            )}>
              <CardHeader className={cn("pb-3", column.color)}>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{column.title}</span>
                  <Badge variant="secondary" className="ml-2">
                    {columnTasks.length}
                    {isToday && "/5"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {isDragOver ? "Drop here" : "No tasks"}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task._id?.toString()}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="cursor-move"
                    >
                      <TaskCard
                        task={task}
                        onComplete={
                          column.status !== "done"
                            ? () => handleTaskComplete(task._id!.toString())
                            : undefined
                        }
                        onUpdate={onTaskUpdate}
                        compact
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
