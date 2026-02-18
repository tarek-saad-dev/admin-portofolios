"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Table as TableIcon, Plus, Search, Filter } from "lucide-react";
import { TaskBoard } from "@/components/task-os/task-board";
import { TaskTable } from "@/components/task-os/task-table";
import { QuickAddTask } from "@/components/task-os/quick-add-task";
import { TaskWithDetails, Department, Track, TaskStatus, TaskPriority } from "@/types/task-os";
import { cn } from "@/lib/utils";

type ViewMode = "board" | "table";

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Cleanup overdue tasks first
        await fetch("/api/os/tasks/cleanup", { method: "POST" });
      } catch (error) {
        console.error("Error running cleanup:", error);
      }
      fetchData();
    };

    initializePage();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, deptsRes, tracksRes] = await Promise.all([
        fetch("/api/os/tasks?includeArchived=false"),
        fetch("/api/os/departments"),
        fetch("/api/os/tracks"),
      ]);

      const [tasksData, deptsData, tracksData] = await Promise.all([
        tasksRes.json(),
        deptsRes.json(),
        tracksRes.json(),
      ]);

      if (tasksData.success) setTasks(tasksData.data);
      if (deptsData.success) setDepartments(deptsData.data);
      if (tracksData.success) setTracks(tracksData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterDepartment !== "all" && task.departmentId.toString() !== filterDepartment) {
      return false;
    }
    if (filterTrack !== "all" && task.trackId.toString() !== filterTrack) {
      return false;
    }
    if (filterStatus !== "all" && task.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== "all" && task.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const activeFiltersCount = [
    filterDepartment !== "all",
    filterTrack !== "all",
    filterStatus !== "all",
    filterPriority !== "all",
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowQuickAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id?.toString()} value={dept._id!.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTrack} onValueChange={setFilterTrack}>
                <SelectTrigger>
                  <SelectValue placeholder="Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {tracks.map((track) => (
                    <SelectItem key={track._id?.toString()} value={track._id!.toString()}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as TaskStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={(val) => setFilterPriority(val as TaskPriority | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === "board" ? (
        <TaskBoard tasks={filteredTasks} onTaskUpdate={fetchData} />
      ) : (
        <TaskTable tasks={filteredTasks} onTaskUpdate={fetchData} />
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTask
          open={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
