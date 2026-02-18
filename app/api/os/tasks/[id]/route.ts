/**
 * Task OS - Task API Routes (Single)
 * GET /api/os/tasks/:id - Get task details
 * PATCH /api/os/tasks/:id - Update task
 * DELETE /api/os/tasks/:id - Archive task
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getTasksCollection,
  getDailyFocusCollection,
  toObjectId,
  isValidObjectId,
} from "@/lib/db/task-os-db";
import { TaskInput } from "@/types/task-os";

// GET /api/os/tasks/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid task ID" },
        { status: 400 },
      );
    }

    const collection = await getTasksCollection();
    const task = await collection.findOne({ _id: toObjectId(id) });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

// PATCH /api/os/tasks/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid task ID" },
        { status: 400 },
      );
    }

    const body: Partial<TaskInput> = await request.json();
    const collection = await getTasksCollection();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Handle status change
    if (body.status) {
      // Check if moving to "today" would exceed limit
      if (body.status === "today") {
        const todayCount = await collection.countDocuments({
          status: "today",
          _id: { $ne: toObjectId(id) },
        });

        if (todayCount >= 5) {
          return NextResponse.json(
            {
              success: false,
              error: "Today is full (max 5 tasks). Move something out first.",
            },
            { status: 400 },
          );
        }
      }

      updateData.status = body.status;

      // Set completedAt when marking as done
      if (body.status === "done") {
        updateData.completedAt = new Date();
      }

      // Set archivedAt when archiving
      if (body.status === "archived") {
        updateData.archivedAt = new Date();
      }
    }

    // Handle weekId and assignedDay for Canvas planning integration
    if (body.weekId !== undefined) updateData.weekId = body.weekId;
    if (body.assignedDay !== undefined)
      updateData.assignedDay = body.assignedDay;

    // Critical: Backlog return logic
    // If moving to backlog, decide placement based on weekId
    if (body.status === "backlog") {
      const currentTask = await collection.findOne({ _id: toObjectId(id) });

      if (currentTask?.weekId) {
        // Task was part of a week - return to This Week Pool
        updateData.status = "this_week";
        updateData.assignedDay = null;
        // Keep weekId so it stays in the weekly planner
      } else {
        // True backlog - clear everything
        updateData.status = "backlog";
        updateData.weekId = null;
        updateData.assignedDay = null;
      }
    }

    // If assignedDay is set, ensure task has proper status
    if (body.assignedDay && body.assignedDay !== null) {
      // Task is being assigned to a specific day
      if (!updateData.status || updateData.status === "backlog") {
        updateData.status = "today";
      }
    }

    // If assignedDay is explicitly cleared (set to null), move to this_week
    if (body.assignedDay === null && body.weekId) {
      updateData.status = "this_week";
    }

    // Update other fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description.trim();
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.energyType !== undefined) updateData.energyType = body.energyType;
    if (body.revenueType !== undefined)
      updateData.revenueType = body.revenueType;
    if (body.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = body.estimatedMinutes;
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.departmentId && isValidObjectId(body.departmentId)) {
      updateData.departmentId = toObjectId(body.departmentId);
    }
    if (body.trackId && isValidObjectId(body.trackId)) {
      updateData.trackId = toObjectId(body.trackId);
    }

    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 },
      );
    }

    // If task is marked done, remove from daily focus
    if (body.status === "done" || body.status === "archived") {
      const dailyFocusCol = await getDailyFocusCollection();
      await dailyFocusCol.updateMany(
        { tasks: toObjectId(id) },
        { $pull: { tasks: toObjectId(id) } },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 },
    );
  }
}

// DELETE /api/os/tasks/:id (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid task ID" },
        { status: 400 },
      );
    }

    const collection = await getTasksCollection();

    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      {
        $set: {
          status: "archived",
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 },
      );
    }

    // Remove from daily focus
    const dailyFocusCol = await getDailyFocusCollection();
    await dailyFocusCol.updateMany(
      { tasks: toObjectId(id) },
      { $pull: { tasks: toObjectId(id) } },
    );

    return NextResponse.json({
      success: true,
      message: "Task archived successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error archiving task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to archive task" },
      { status: 500 },
    );
  }
}
