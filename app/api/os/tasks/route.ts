/**
 * Task OS - Tasks API Routes
 * GET /api/os/tasks - List tasks with filters and pagination
 * POST /api/os/tasks - Create new task
 */

import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getDepartmentsCollection, getTracksCollection, toObjectId, isValidObjectId } from "@/lib/db/task-os-db";
import { Task, TaskInput, TaskQueryParams, TaskWithDetails } from "@/types/task-os";
import { ObjectId } from "mongodb";

// GET /api/os/tasks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: TaskQueryParams = {
      status: searchParams.get("status") as any,
      departmentId: searchParams.get("departmentId") || undefined,
      trackId: searchParams.get("trackId") || undefined,
      priority: searchParams.get("priority") as any,
      revenueType: searchParams.get("revenueType") as any,
      energyType: searchParams.get("energyType") as any,
      q: searchParams.get("q") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
      includeArchived: searchParams.get("includeArchived") === "true",
    };

    const collection = await getTasksCollection();
    const query: any = {};

    // Build query filters
    if (params.status) {
      query.status = params.status;
    } else if (!params.includeArchived) {
      query.status = { $ne: "archived" };
    }

    if (params.departmentId && isValidObjectId(params.departmentId)) {
      query.departmentId = toObjectId(params.departmentId);
    }

    if (params.trackId && isValidObjectId(params.trackId)) {
      query.trackId = toObjectId(params.trackId);
    }

    if (params.priority) {
      query.priority = params.priority;
    }

    if (params.revenueType) {
      query.revenueType = params.revenueType;
    }

    if (params.energyType) {
      query.energyType = params.energyType;
    }

    // Text search
    if (params.q) {
      query.$text = { $search: params.q };
    }

    // Date range filters
    if (params.from || params.to) {
      query.createdAt = {};
      if (params.from) {
        query.createdAt.$gte = new Date(params.from);
      }
      if (params.to) {
        query.createdAt.$lte = new Date(params.to);
      }
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    // Execute query
    const [tasks, total] = await Promise.all([
      collection
        .find(query)
        .sort({ isPinned: -1, orderIndex: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    // Enrich with department and track details
    const departmentsCol = await getDepartmentsCollection();
    const tracksCol = await getTracksCollection();

    const tasksWithDetails: TaskWithDetails[] = await Promise.all(
      tasks.map(async (task) => {
        const [department, track] = await Promise.all([
          departmentsCol.findOne({ _id: task.departmentId }),
          tracksCol.findOne({ _id: task.trackId }),
        ]);

        // Check if task is stale (>30 days in backlog)
        const isStale =
          task.status === "backlog" &&
          task.createdAt &&
          Date.now() - task.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000;

        return {
          ...task,
          department: department || undefined,
          track: track || undefined,
          isStale,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: tasksWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/os/tasks
export async function POST(request: NextRequest) {
  try {
    const body: TaskInput = await request.json();

    // Validation
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.departmentId || !isValidObjectId(body.departmentId)) {
      return NextResponse.json(
        { success: false, error: "Valid department ID is required" },
        { status: 400 }
      );
    }

    if (!body.trackId || !isValidObjectId(body.trackId)) {
      return NextResponse.json(
        { success: false, error: "Valid track ID is required" },
        { status: 400 }
      );
    }

    // Check if adding to "today" would exceed limit
    if (body.status === "today") {
      const collection = await getTasksCollection();
      const todayCount = await collection.countDocuments({ status: "today" });
      
      if (todayCount >= 5) {
        return NextResponse.json(
          { success: false, error: "Today is full (max 5 tasks). Move something out first." },
          { status: 400 }
        );
      }
    }

    const collection = await getTasksCollection();

    // Get next order index for the status
    const lastTask = await collection
      .findOne({ status: body.status || "backlog" }, { sort: { orderIndex: -1 } });
    const nextOrderIndex = lastTask ? (lastTask.orderIndex || 0) + 1 : 1;

    const now = new Date();
    const task: Task = {
      title: body.title.trim(),
      description: body.description?.trim() || "",
      departmentId: toObjectId(body.departmentId),
      trackId: toObjectId(body.trackId),
      status: body.status || "backlog",
      priority: body.priority || "medium",
      energyType: body.energyType || "light",
      revenueType: body.revenueType || "long_term_brand",
      estimatedMinutes: body.estimatedMinutes || 60,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags || [],
      orderIndex: nextOrderIndex,
      isPinned: body.isPinned || false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      archivedAt: null,
    };

    const result = await collection.insertOne(task);
    const created = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
