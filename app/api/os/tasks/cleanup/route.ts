import { NextResponse } from "next/server";
import {
  getTasksCollection,
  getDailyFocusCollection,
  toObjectId,
} from "@/lib/db/task-os-db";
import { ObjectId } from "mongodb";

export async function POST() {
  try {
    const tasksCollection = await getTasksCollection();
    const dailyFocusCollection = await getDailyFocusCollection();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get week boundaries (Sunday to Saturday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // ========================================
    // LEVEL 1: DAILY CLEANUP
    // Move incomplete "today" tasks to "this_week"
    // ========================================
    const staleTodayTasks = await tasksCollection
      .find({
        status: "today",
        updatedAt: { $lt: today },
      })
      .toArray();

    const todayTaskIds = staleTodayTasks.map((t) => t._id.toString());

    if (todayTaskIds.length > 0) {
      // Move from "today" to "this_week"
      await tasksCollection.updateMany(
        {
          _id: { $in: todayTaskIds.map((id) => new ObjectId(id)) },
        },
        {
          $set: {
            status: "this_week",
            updatedAt: new Date(),
          },
        },
      );

      // Remove from old daily_focus entries
      await dailyFocusCollection.updateMany(
        {
          date: { $lt: today.toISOString().split("T")[0] },
        },
        {
          $pull: {
            tasks: { $in: todayTaskIds.map((id) => new ObjectId(id)) } as any,
          },
        } as any,
      );
    }

    // ========================================
    // LEVEL 2: WEEKLY CLEANUP
    // Move incomplete "this_week" tasks to "backlog"
    // ========================================
    const staleThisWeekTasks = await tasksCollection
      .find({
        status: "this_week",
        updatedAt: { $lt: currentWeekStart },
      })
      .toArray();

    const weekTaskIds = staleThisWeekTasks.map((t) => t._id.toString());

    if (weekTaskIds.length > 0) {
      // Move from "this_week" to "backlog"
      await tasksCollection.updateMany(
        {
          _id: { $in: weekTaskIds.map((id) => new ObjectId(id)) },
        },
        {
          $set: {
            status: "backlog",
            updatedAt: new Date(),
          },
        },
      );

      // Remove from old daily_focus entries from previous weeks
      await dailyFocusCollection.updateMany(
        {
          date: { $lt: currentWeekStart.toISOString().split("T")[0] },
        },
        {
          $pull: {
            tasks: { $in: weekTaskIds.map((id) => new ObjectId(id)) } as any,
          },
        } as any,
      );
    }

    // Return summary of cleanup
    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${todayTaskIds.length} tasks moved to This Week, ${weekTaskIds.length} tasks moved to Backlog`,
      dailyCleanup: {
        movedToThisWeek: todayTaskIds.length,
        taskIds: todayTaskIds,
      },
      weeklyCleanup: {
        movedToBacklog: weekTaskIds.length,
        taskIds: weekTaskIds,
      },
    });
  } catch (error) {
    console.error("Error in task cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to cleanup tasks",
      },
      { status: 500 },
    );
  }
}
