"use client";

import { useState } from "react";
import { TaskWithDetails, TaskStatus } from "@/types/task-os";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTableProps {
  tasks: TaskWithDetails[];
  onTaskUpdate: () => void;
}

export function TaskTable({ tasks, onTaskUpdate }: TaskTableProps) {
  const [sortBy, setSortBy] = useState<"createdAt" | "priority" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const statusColors = {
    backlog: "bg-slate-500/10 text-slate-500",
    this_week: "bg-blue-500/10 text-blue-500",
    today: "bg-purple-500/10 text-purple-500",
    done: "bg-green-500/10 text-green-500",
    archived: "bg-gray-500/10 text-gray-500",
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "createdAt") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === "status") {
      const statusOrder = { today: 4, this_week: 3, backlog: 2, done: 1, archived: 0 };
      comparison = statusOrder[a.status] - statusOrder[b.status];
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleComplete = async (taskId: string) => {
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

  const handleArchive = async (taskId: string) => {
    if (!confirm("Archive this task?")) return;

    try {
      const res = await fetch(`/api/os/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error archiving task:", error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/os/tasks/${taskId}`, {
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
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tasks found. Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("status")}
            >
              Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Track</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("priority")}
            >
              Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Energy</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("createdAt")}
            >
              Created {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task._id?.toString()} className="group">
              <TableCell>
                {task.status !== "done" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleComplete(task._id!.toString())}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[task.status]}>
                  {task.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {task.description}
                      </div>
                    )}
                  </div>
                  {task.isStale && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Stale
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {task.department?.name || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {task.track?.name || "N/A"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs", priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}m
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground capitalize">
                  {task.energyType}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(task.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleArchive(task._id!.toString())}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
