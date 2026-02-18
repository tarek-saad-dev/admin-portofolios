import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasNodesCollection,
  getTasksCollection,
  getDepartmentsCollection,
  getTracksCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";
import { Task } from "@/types/task-os";

// POST /api/os/canvas/:canvasId/nodes/:nodeId/convert-to-task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ canvasId: string; nodeId: string }> },
) {
  try {
    const { canvasId, nodeId } = await params;

    if (!isValidObjectId(canvasId) || !isValidObjectId(nodeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid canvas or node ID" },
        { status: 400 },
      );
    }

    const nodesCollection = await getCanvasNodesCollection();
    const tasksCollection = await getTasksCollection();
    const departmentsCollection = await getDepartmentsCollection();
    const tracksCollection = await getTracksCollection();

    // Get the node
    const node = await nodesCollection.findOne({
      _id: toObjectId(nodeId),
      canvasId: toObjectId(canvasId),
    });

    if (!node) {
      return NextResponse.json(
        { success: false, error: "Node not found" },
        { status: 404 },
      );
    }

    // Check if already converted
    if (node.linkedTaskId) {
      return NextResponse.json(
        { success: false, error: "Node is already linked to a task" },
        { status: 400 },
      );
    }

    // Get default department and track if not specified in node meta
    let departmentId = node.meta?.department
      ? toObjectId(node.meta.department)
      : null;
    let trackId = node.meta?.track ? toObjectId(node.meta.track) : null;

    // If no department specified, get the first active department
    if (!departmentId) {
      const defaultDept = await departmentsCollection.findOne(
        { isActive: true },
        { sort: { order: 1 } },
      );
      if (!defaultDept) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No active departments found. Please create a department first.",
          },
          { status: 400 },
        );
      }
      departmentId = defaultDept._id!;
    }

    // If no track specified, get the first active track for the department
    if (!trackId) {
      const defaultTrack = await tracksCollection.findOne(
        { departmentId, isActive: true },
        { sort: { order: 1 } },
      );
      if (!defaultTrack) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No active tracks found for the department. Please create a track first.",
          },
          { status: 400 },
        );
      }
      trackId = defaultTrack._id!;
    }

    // Create task from node data
    const newTask: Task = {
      title: node.title,
      description: node.description || "",
      departmentId,
      trackId,
      status: "backlog",
      priority: node.meta?.priority || "medium",
      energyType: "light",
      revenueType: "skill_growth",
      estimatedMinutes: node.meta?.estimateMinutes || 30,
      dueDate: null,
      tags: [],
      orderIndex: 0,
      isPinned: false,
      sourceCanvasNodeId: node._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const taskResult = await tasksCollection.insertOne(newTask);
    const createdTask = await tasksCollection.findOne({
      _id: taskResult.insertedId,
    });

    // Update node to link to task and change type to "task"
    await nodesCollection.updateOne(
      { _id: toObjectId(nodeId) },
      {
        $set: {
          linkedTaskId: taskResult.insertedId,
          type: "task",
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        task: createdTask,
        nodeId: nodeId,
      },
      message: "Node converted to task successfully",
    });
  } catch (error) {
    console.error("Error converting node to task:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert node to task",
      },
      { status: 500 },
    );
  }
}
