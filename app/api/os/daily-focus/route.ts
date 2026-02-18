/**
 * Task OS - Daily Focus API Routes
 * GET /api/os/daily-focus?date=YYYY-MM-DD - Get daily focus plan
 * PUT /api/os/daily-focus?date=YYYY-MM-DD - Upsert daily focus plan
 */

import { NextRequest, NextResponse } from "next/server";
import { getDailyFocusCollection, getTasksCollection, getDepartmentsCollection, toObjectId, isValidObjectId } from "@/lib/db/task-os-db";
import { DailyFocusInput, DailyFocusWithTasks } from "@/types/task-os";

// GET /api/os/daily-focus?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const collection = await getDailyFocusCollection();
    const dailyFocus = await collection.findOne({ date });

    if (!dailyFocus) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          tasks: [],
          focusDepartmentId: null,
          notes: "",
          taskDetails: [],
          totalEstimatedMinutes: 0,
        },
      });
    }

    // Fetch task details
    const tasksCol = await getTasksCollection();
    const departmentsCol = await getDepartmentsCollection();

    const taskDetails = await tasksCol
      .find({ _id: { $in: dailyFocus.tasks } })
      .toArray();

    // Clean up any archived/deleted tasks
    const validTaskIds = taskDetails.map((t) => t._id!);
    if (validTaskIds.length !== dailyFocus.tasks.length) {
      await collection.updateOne(
        { _id: dailyFocus._id },
        { $set: { tasks: validTaskIds } }
      );
    }

    // Enrich tasks with department/track info
    const enrichedTasks = await Promise.all(
      taskDetails.map(async (task) => {
        const [department, tracksCol] = await Promise.all([
          departmentsCol.findOne({ _id: task.departmentId }),
          import("@/lib/db/task-os-db").then((m) => m.getTracksCollection()),
        ]);
        const track = await tracksCol.findOne({ _id: task.trackId });

        return {
          ...task,
          department: department || undefined,
          track: track || undefined,
        };
      })
    );

    const totalEstimatedMinutes = enrichedTasks.reduce(
      (sum, task) => sum + (task.estimatedMinutes || 0),
      0
    );

    let focusDepartment;
    if (dailyFocus.focusDepartmentId) {
      focusDepartment = await departmentsCol.findOne({
        _id: dailyFocus.focusDepartmentId,
      });
    }

    const response: DailyFocusWithTasks = {
      ...dailyFocus,
      taskDetails: enrichedTasks,
      totalEstimatedMinutes,
      focusDepartment: focusDepartment || undefined,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching daily focus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily focus" },
      { status: 500 }
    );
  }
}

// PUT /api/os/daily-focus?date=YYYY-MM-DD (upsert)
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const body: DailyFocusInput = await request.json();

    // Validate max 5 tasks
    const taskIds = body.tasks || [];
    if (taskIds.length > 5) {
      return NextResponse.json(
        { success: false, error: "Maximum 5 tasks allowed per day" },
        { status: 400 }
      );
    }

    // Validate task IDs
    const validTaskIds = taskIds.filter((id) => isValidObjectId(id));
    if (validTaskIds.length !== taskIds.length) {
      return NextResponse.json(
        { success: false, error: "Invalid task IDs provided" },
        { status: 400 }
      );
    }

    const collection = await getDailyFocusCollection();
    const now = new Date();

    const updateData = {
      date,
      tasks: validTaskIds.map((id) => toObjectId(id)),
      focusDepartmentId: body.focusDepartmentId
        ? toObjectId(body.focusDepartmentId)
        : null,
      notes: body.notes || "",
      updatedAt: now,
    };

    const result = await collection.findOneAndUpdate(
      { date },
      {
        $set: updateData,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating daily focus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update daily focus" },
      { status: 500 }
    );
  }
}
