/**
 * Task OS - Analytics API Route
 * GET /api/os/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getTasksCollection,
  getDepartmentsCollection,
  getTracksCollection,
  getFocusSessionsCollection,
} from "@/lib/db/task-os-db";
import { AnalyticsOverview } from "@/types/task-os";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const tasksCol = await getTasksCollection();
    const departmentsCol = await getDepartmentsCollection();
    const tracksCol = await getTracksCollection();
    const sessionsCol = await getFocusSessionsCollection();

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (from || to) {
      dateFilter.completedAt = {};
      if (from) {
        (dateFilter.completedAt as Record<string, unknown>).$gte = new Date(from);
      }
      if (to) {
        (dateFilter.completedAt as Record<string, unknown>).$lte = new Date(to);
      }
    }

    // Get all departments and tracks for reference
    const [departments, tracks] = await Promise.all([
      departmentsCol.find({ isActive: true }).toArray(),
      tracksCol.find({ isActive: true }).toArray(),
    ]);

    // Completed tasks by department
    const completedTasks = await tasksCol
      .find({
        status: "done",
        completedAt: { $ne: null },
        ...dateFilter,
      })
      .toArray();

    const completedByDept = departments.map((dept) => {
      const count = completedTasks.filter(
        (task) => task.departmentId.toString() === dept._id!.toString()
      ).length;
      return {
        departmentId: dept._id!.toString(),
        departmentName: dept.name,
        count,
      };
    });

    // Completed tasks by track
    const completedByTrack = tracks.map((track) => {
      const count = completedTasks.filter(
        (task) => task.trackId.toString() === track._id!.toString()
      ).length;
      const dept = departments.find(
        (d) => d._id!.toString() === track.departmentId.toString()
      );
      return {
        trackId: track._id!.toString(),
        trackName: track.name,
        departmentName: dept?.name || "Unknown",
        count,
      };
    });

    // Revenue type distribution
    const revenueTypes = ["revenue_now", "long_term_brand", "skill_growth"] as const;
    const revenueTypeDistribution = revenueTypes.map((type) => ({
      revenueType: type,
      count: completedTasks.filter((task) => task.revenueType === type).length,
    }));

    // Focus minutes by department
    const sessionDateFilter: Record<string, unknown> = {};
    if (from || to) {
      sessionDateFilter.date = {};
      if (from) {
        (sessionDateFilter.date as Record<string, unknown>).$gte = from;
      }
      if (to) {
        (sessionDateFilter.date as Record<string, unknown>).$lte = to;
      }
    }

    const sessions = await sessionsCol.find(sessionDateFilter).toArray();
    
    const focusMinutesByDept = await Promise.all(
      departments.map(async (dept) => {
        const deptTasks = await tasksCol
          .find({ departmentId: dept._id })
          .toArray();
        const deptTaskIds = deptTasks.map((t) => t._id!.toString());
        
        const minutes = sessions
          .filter((s) => s.taskId && deptTaskIds.includes(s.taskId.toString()))
          .reduce((sum, s) => sum + s.durationMinutes, 0);

        return {
          departmentId: dept._id!.toString(),
          departmentName: dept.name,
          minutes,
        };
      })
    );

    // Calculate streak (consecutive days with at least 1 completed task)
    const streak = await calculateStreak(tasksCol);

    // Stale tasks (>30 days in backlog)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const staleTasks = await tasksCol
      .find({
        status: "backlog",
        createdAt: { $lt: thirtyDaysAgo },
      })
      .limit(10)
      .toArray();

    const staleTasksEnriched = await Promise.all(
      staleTasks.map(async (task) => {
        const [dept, track] = await Promise.all([
          departmentsCol.findOne({ _id: task.departmentId }),
          tracksCol.findOne({ _id: task.trackId }),
        ]);
        return {
          ...task,
          department: dept || undefined,
          track: track || undefined,
          isStale: true,
        };
      })
    );

    const totalCompleted = completedTasks.length;
    const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    // Calculate completion rate (completed vs total non-archived)
    const totalNonArchived = await tasksCol.countDocuments({
      status: { $ne: "archived" },
    });
    const completionRate = totalNonArchived > 0 
      ? Math.round((totalCompleted / totalNonArchived) * 100) 
      : 0;

    const analytics: AnalyticsOverview = {
      completedTasksByDepartment: completedByDept,
      completedTasksByTrack: completedByTrack,
      focusMinutesByDepartment: focusMinutesByDept,
      revenueTypeDistribution,
      streak,
      topStaleTasks: {
        count: await tasksCol.countDocuments({
          status: "backlog",
          createdAt: { $lt: thirtyDaysAgo },
        }),
        tasks: staleTasksEnriched,
      },
      totalCompleted,
      totalFocusMinutes,
      completionRate,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

async function calculateStreak(tasksCol: Awaited<ReturnType<typeof getTasksCollection>>): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const tasksOnDay = await tasksCol.countDocuments({
      status: "done",
      completedAt: {
        $gte: currentDate,
        $lt: nextDay,
      },
    });

    if (tasksOnDay > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }

    // Prevent infinite loop
    if (streak > 365) break;
  }

  return streak;
}
