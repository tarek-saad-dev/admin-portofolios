"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Calendar, Clock } from "lucide-react";
import { TaskStatus, DayOfWeek, TaskWithDetails } from "@/types/task-os";
import { generateWeekId, getCurrentDayOfWeek, getDayName } from "@/lib/utils/week-utils";
import { useToast } from "@/components/ui/use-toast";

interface TaskPlanningControlsProps {
  taskId: string;
  onTaskUpdated?: () => void;
}

export function TaskPlanningControls({ taskId, onTaskUpdated }: TaskPlanningControlsProps) {
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("backlog");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "none">("none");

  const days: Array<{ value: DayOfWeek | "none"; label: string }> = [
    { value: "none", label: "None (This Week Pool)" },
    { value: "sun", label: "Sunday" },
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
  ];

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/os/tasks/${taskId}`);
      const data = await res.json();

      if (data.success) {
        setTask(data.data);
        setSelectedStatus(data.data.status || "backlog");
        setSelectedWeekId(data.data.weekId || generateWeekId());
        setSelectedDay(data.data.assignedDay || "none");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (updates: Partial<TaskWithDetails>) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/os/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (data.success) {
        setTask(data.data);
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
        onTaskUpdated?.();
      } else {
        throw new Error(data.error || "Failed to update task");
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendToThisWeekPool = async () => {
    await updateTask({
      status: "this_week",
      weekId: generateWeekId(),
      assignedDay: null,
    });
  };

  const handleScheduleForToday = async () => {
    const today = getCurrentDayOfWeek();
    await updateTask({
      status: "today",
      weekId: generateWeekId(),
      assignedDay: today,
    });
  };

  const handleStatusChange = async (status: TaskStatus) => {
    setSelectedStatus(status);

    if (status === "backlog") {
      // Let the API handle the backlog logic (This Week Pool vs true Backlog)
      await updateTask({ status: "backlog" });
    } else if (status === "this_week") {
      await updateTask({
        status: "this_week",
        weekId: selectedWeekId,
        assignedDay: null,
      });
    } else if (status === "done") {
      await updateTask({ status: "done" });
    }
  };

  const handleDayChange = async (day: DayOfWeek | "none") => {
    setSelectedDay(day);

    if (day === "none") {
      // Move to This Week Pool
      await updateTask({
        status: "this_week",
        weekId: selectedWeekId,
        assignedDay: null,
      });
    } else {
      // Assign to specific day
      await updateTask({
        status: "today",
        weekId: selectedWeekId,
        assignedDay: day,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Task Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Task Planning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => handleStatusChange(value as TaskStatus)}
            disabled={updating}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="this_week">This Week Pool</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Week Selector (read-only for now, shows current week) */}
        {(selectedStatus === "this_week" || selectedStatus === "today") && (
          <div className="space-y-2">
            <Label>Week</Label>
            <div className="text-sm text-muted-foreground">
              Current Week ({selectedWeekId})
            </div>
          </div>
        )}

        {/* Day Assignment */}
        {(selectedStatus === "this_week" || selectedStatus === "today") && (
          <div className="space-y-2">
            <Label htmlFor="day">Assign Day</Label>
            <Select
              value={selectedDay}
              onValueChange={(value) => handleDayChange(value as DayOfWeek | "none")}
              disabled={updating}
            >
              <SelectTrigger id="day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Label>Quick Actions</Label>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendToThisWeekPool}
              disabled={updating}
              className="w-full justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Send to This Week Pool
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScheduleForToday}
              disabled={updating}
              className="w-full justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule for Today ({getDayName(getCurrentDayOfWeek())})
            </Button>
          </div>
        </div>

        {/* Open in Tasks Link */}
        <div className="pt-2 border-t">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => window.open(`/admin/os/tasks`, "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in Tasks Board
          </Button>
        </div>

        {/* Task Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div>Task ID: {taskId}</div>
          {task.weekId && <div>Week: {task.weekId}</div>}
          {task.assignedDay && <div>Day: {getDayName(task.assignedDay)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
