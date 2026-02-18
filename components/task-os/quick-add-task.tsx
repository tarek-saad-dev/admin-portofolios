"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, Track, TaskPriority, EnergyType, RevenueType } from "@/types/task-os";
import { useToast } from "@/components/ui/use-toast";

interface QuickAddTaskProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickAddTask({ open, onClose, onSuccess }: QuickAddTaskProps) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    trackId: "",
    priority: "medium" as TaskPriority,
    energyType: "light" as EnergyType,
    revenueType: "long_term_brand" as RevenueType,
    estimatedMinutes: 60,
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchTracks(formData.departmentId);
    }
  }, [formData.departmentId]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/os/departments");
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
        if (data.data.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data.data[0]._id.toString() }));
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchTracks = async (departmentId: string) => {
    try {
      const res = await fetch(`/api/os/tracks?departmentId=${departmentId}`);
      const data = await res.json();
      if (data.success) {
        setTracks(data.data);
        if (data.data.length > 0) {
          setFormData((prev) => ({ ...prev, trackId: data.data[0]._id.toString() }));
        }
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/os/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        setFormData({
          title: "",
          departmentId: departments[0]?._id?.toString() || "",
          trackId: "",
          priority: "medium",
          energyType: "light",
          revenueType: "long_term_brand",
          estimatedMinutes: 60,
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id?.toString()} value={dept._id!.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="track">Track *</Label>
              <Select
                value={formData.trackId}
                onValueChange={(value) => setFormData({ ...formData, trackId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((track) => (
                    <SelectItem key={track._id?.toString()} value={track._id!.toString()}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedMinutes">Time (min)</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min="15"
                max="240"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="energyType">Energy Type</Label>
              <Select
                value={formData.energyType}
                onValueChange={(value) => setFormData({ ...formData, energyType: value as EnergyType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep">Deep Work</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueType">Revenue Type</Label>
              <Select
                value={formData.revenueType}
                onValueChange={(value) => setFormData({ ...formData, revenueType: value as RevenueType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue_now">Revenue Now</SelectItem>
                  <SelectItem value="long_term_brand">Long-term Brand</SelectItem>
                  <SelectItem value="skill_growth">Skill Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
