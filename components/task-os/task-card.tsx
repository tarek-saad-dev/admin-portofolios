"use client";

import { TaskWithDetails } from "@/types/task-os";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithDetails;
  onComplete?: () => void;
  onUpdate?: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onComplete, compact = false }: TaskCardProps) {
  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const energyIcons = {
    deep: <Zap className="h-3 w-3" />,
    creative: <Zap className="h-3 w-3" />,
    light: <Clock className="h-3 w-3" />,
    admin: <Clock className="h-3 w-3" />,
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", compact && "border-l-4")} style={{
      borderLeftColor: task.department?.color || "#8B5CF6"
    }}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Title and Department */}
            <div className="flex items-start gap-2">
              {onComplete && task.status !== "done" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mt-0.5"
                  onClick={onComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <h4 className={cn("font-medium", compact ? "text-sm" : "text-base")}>
                  {task.title}
                </h4>
                {task.description && !compact && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              {task.department && (
                <Badge variant="outline" className="text-xs">
                  {task.department.name}
                </Badge>
              )}
              {task.track && (
                <Badge variant="secondary" className="text-xs">
                  {task.track.name}
                </Badge>
              )}
              <Badge className={cn("text-xs", priorityColors[task.priority])}>
                {task.priority}
              </Badge>
              {task.estimatedMinutes && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}m
                </div>
              )}
              {task.energyType && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {energyIcons[task.energyType]}
                  {task.energyType}
                </div>
              )}
              {task.isStale && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Stale
                </Badge>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && !compact && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
