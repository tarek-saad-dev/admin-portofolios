"use client";

import { memo, useState, useRef, useEffect, CSSProperties } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Target } from "lucide-react";
import { CanvasNode } from "@/types/canvas";

interface BrainstormNodeData {
  label: string;
  node: CanvasNode;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
}

function BrainstormNode({ id, data, selected }: NodeProps<BrainstormNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const node = data.node;
  const isTask = !!node.linkedTaskId;
  const isDone = node.meta?.taskStatus === "done";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag/pan interference
    console.log("🎯 EDIT MODE ON");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (title.trim() && title !== data.label) {
      console.log("💾 SAVED:", title.trim());
      data.onUpdate(id, { title: title.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log("❌ CANCEL");
    setTitle(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent keyboard shortcuts from interfering
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to process first
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  // Node styling based on state
  const getNodeStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      padding: "12px 16px",
      borderRadius: "8px",
      border: "2px solid",
      minWidth: "150px",
      minHeight: "60px",
      background: "white",
      cursor: isEditing ? "text" : "pointer",
      transition: "all 0.2s ease",
    };

    if (isDone) {
      return {
        ...baseStyle,
        borderColor: "#22c55e",
        background: "#f0fdf4",
      };
    } else if (isTask) {
      return {
        ...baseStyle,
        borderColor: "#3b82f6",
        background: "#eff6ff",
      };
    } else {
      return {
        ...baseStyle,
        borderColor: selected ? "#8b5cf6" : "#e5e7eb",
        background: selected ? "#faf5ff" : "white",
      };
    }
  };

  const getBadgeIcon = () => {
    if (isDone) return <CheckCircle2 className="h-3 w-3" />;
    if (isTask) return <Target className="h-3 w-3" />;
    return <Lightbulb className="h-3 w-3" />;
  };

  const getBadgeText = () => {
    if (isDone) return "DONE";
    if (isTask) return "TASK";
    return "IDEA";
  };

  const getBadgeVariant = () => {
    if (isDone) return "default" as const;
    if (isTask) return "default" as const;
    return "secondary" as const;
  };

  return (
    <>
      {/* Resize handles - only show when selected */}
      {selected && (
        <NodeResizer
          minWidth={150}
          minHeight={60}
          isVisible={selected}
          lineClassName="border-purple-500"
          handleClassName="h-3 w-3 bg-purple-500 rounded-full"
        />
      )}

      <div
        ref={nodeRef}
        style={getNodeStyle()}
        onDoubleClick={handleDoubleClick}
        className="relative group"
      >
        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-purple-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-purple-500"
        />

        {/* Status badge */}
        <div className="absolute -top-3 -right-3 z-10">
          <Badge
            variant={getBadgeVariant()}
            className="text-xs flex items-center gap-1 shadow-sm"
          >
            {getBadgeIcon()}
            {getBadgeText()}
          </Badge>
        </div>

        {/* Debug marker */}
        <div className="absolute top-1 left-1 text-[8px] font-mono text-purple-600 bg-purple-100 px-1 rounded">
          CUSTOM NODE
        </div>

        {/* Editable title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full bg-transparent border-none outline-none font-medium text-sm"
            style={{ minHeight: "20px" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="font-medium text-sm break-words cursor-text"
            onDoubleClick={handleDoubleClick}
          >
            {data.label}
          </div>
        )}

        {/* Description preview */}
        {node.description && !isEditing && (
          <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {node.description}
          </div>
        )}

        {/* Quick action hint - only show on hover when selected */}
        {selected && !isEditing && (
          <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm">
              Double-click or Enter to edit
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(BrainstormNode);
