/**
 * Canvas Module - TypeScript Type Definitions
 */

import { ObjectId } from "mongodb";
import { TaskPriority } from "./task-os";

// ==================== CANVAS ====================

export type CanvasNodeType = "idea" | "task" | "group";

export interface Canvas {
  _id?: ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasInput {
  title: string;
}

export interface CanvasNode {
  _id?: ObjectId;
  canvasId: ObjectId;
  title: string;
  description?: string;
  type: CanvasNodeType;
  position: {
    x: number;
    y: number;
  };
  meta?: {
    department?: string;
    track?: string;
    priority?: TaskPriority;
    estimateMinutes?: number;
    effort?: number; // 1-5 scale
    impact?: number; // 1-5 scale
    width?: number; // For resizable nodes
    height?: number; // For resizable nodes
    taskStatus?: string; // For tracking task completion
  };
  linkedTaskId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasNodeInput {
  canvasId: string;
  title: string;
  description?: string;
  type?: CanvasNodeType;
  position: {
    x: number;
    y: number;
  };
  meta?: {
    department?: string;
    track?: string;
    priority?: TaskPriority;
    estimateMinutes?: number;
    effort?: number;
    impact?: number;
    width?: number;
    height?: number;
  };
}

export interface CanvasNodeUpdate {
  title?: string;
  description?: string;
  type?: CanvasNodeType;
  position?: {
    x: number;
    y: number;
  };
  meta?: {
    department?: string;
    track?: string;
    priority?: TaskPriority;
    estimateMinutes?: number;
    effort?: number;
    impact?: number;
    width?: number;
    height?: number;
    taskStatus?: string;
  };
  linkedTaskId?: ObjectId;
}

export interface CanvasEdge {
  _id?: ObjectId;
  canvasId: ObjectId;
  sourceNodeId: ObjectId;
  targetNodeId: ObjectId;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasEdgeInput {
  canvasId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export interface CanvasWithData {
  canvas: Canvas;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// For React Flow integration
export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    node: CanvasNode;
  };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    edge: CanvasEdge;
  };
}
