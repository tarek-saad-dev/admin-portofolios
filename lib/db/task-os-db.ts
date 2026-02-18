/**
 * Task OS - MongoDB Database Connection and Collections
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import {
  Department,
  Track,
  Task,
  DailyFocus,
  FocusSession,
} from "@/types/task-os";
import { Canvas, CanvasNode, CanvasEdge } from "@/types/canvas";

const TASK_OS_DB_NAME = "task-os";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToTaskOsDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  const client = new MongoClient(uri);
  await client.connect();

  cachedClient = client;
  cachedDb = client.db(TASK_OS_DB_NAME);

  console.log(`Connected to Task OS Database: ${TASK_OS_DB_NAME}`);

  // Create indexes on first connection
  await createIndexes(cachedDb);

  return cachedDb;
}

export async function getTaskOsDb(): Promise<Db> {
  if (!cachedDb) {
    return await connectToTaskOsDb();
  }
  return cachedDb;
}

// ==================== COLLECTIONS ====================

export async function getDepartmentsCollection(): Promise<
  Collection<Department>
> {
  const db = await getTaskOsDb();
  return db.collection<Department>("departments");
}

export async function getTracksCollection(): Promise<Collection<Track>> {
  const db = await getTaskOsDb();
  return db.collection<Track>("tracks");
}

export async function getTasksCollection(): Promise<Collection<Task>> {
  const db = await getTaskOsDb();
  return db.collection<Task>("tasks");
}

export async function getDailyFocusCollection(): Promise<
  Collection<DailyFocus>
> {
  const db = await getTaskOsDb();
  return db.collection<DailyFocus>("daily_focus");
}

export async function getFocusSessionsCollection(): Promise<
  Collection<FocusSession>
> {
  const db = await getTaskOsDb();
  return db.collection<FocusSession>("focus_sessions");
}

export async function getCanvasCollection(): Promise<Collection<Canvas>> {
  const db = await getTaskOsDb();
  return db.collection<Canvas>("canvas");
}

export async function getCanvasNodesCollection(): Promise<
  Collection<CanvasNode>
> {
  const db = await getTaskOsDb();
  return db.collection<CanvasNode>("canvas_nodes");
}

export async function getCanvasEdgesCollection(): Promise<
  Collection<CanvasEdge>
> {
  const db = await getTaskOsDb();
  return db.collection<CanvasEdge>("canvas_edges");
}

// ==================== INDEXES ====================

async function createIndexes(db: Db): Promise<void> {
  try {
    // Departments indexes
    await db
      .collection("departments")
      .createIndexes([
        { key: { slug: 1 }, unique: true },
        { key: { order: 1 } },
        { key: { isActive: 1 } },
      ]);

    // Tracks indexes
    await db
      .collection("tracks")
      .createIndexes([
        { key: { departmentId: 1 } },
        { key: { departmentId: 1, slug: 1 }, unique: true },
        { key: { isActive: 1 } },
      ]);

    // Tasks indexes (critical for performance)
    await db.collection("tasks").createIndexes([
      { key: { status: 1 } },
      { key: { departmentId: 1 } },
      { key: { trackId: 1 } },
      { key: { status: 1, departmentId: 1 } },
      { key: { status: 1, trackId: 1 } },
      { key: { createdAt: -1 } },
      { key: { completedAt: -1 } },
      { key: { dueDate: 1 } },
      { key: { priority: 1 } },
      { key: { revenueType: 1 } },
      { key: { energyType: 1 } },
      { key: { isPinned: -1 } },
      { key: { orderIndex: 1 } },
      { key: { title: "text", description: "text" } }, // Text search
    ]);

    // Daily Focus indexes
    await db
      .collection("daily_focus")
      .createIndexes([
        { key: { date: 1 }, unique: true },
        { key: { focusDepartmentId: 1 } },
      ]);

    // Focus Sessions indexes
    await db
      .collection("focus_sessions")
      .createIndexes([
        { key: { taskId: 1 } },
        { key: { date: 1 } },
        { key: { startAt: -1 } },
        { key: { date: 1, taskId: 1 } },
      ]);

    // Canvas indexes
    await db
      .collection("canvas")
      .createIndexes([{ key: { createdAt: -1 } }, { key: { updatedAt: -1 } }]);

    // Canvas Nodes indexes
    await db
      .collection("canvas_nodes")
      .createIndexes([
        { key: { canvasId: 1 } },
        { key: { type: 1 } },
        { key: { linkedTaskId: 1 } },
        { key: { canvasId: 1, type: 1 } },
      ]);

    // Canvas Edges indexes
    await db
      .collection("canvas_edges")
      .createIndexes([
        { key: { canvasId: 1 } },
        { key: { sourceNodeId: 1 } },
        { key: { targetNodeId: 1 } },
        { key: { canvasId: 1, sourceNodeId: 1 } },
        { key: { canvasId: 1, targetNodeId: 1 } },
      ]);

    console.log("Task OS indexes created successfully");
  } catch (error) {
    console.error("Error creating Task OS indexes:", error);
  }
}

// ==================== HELPER FUNCTIONS ====================

export function toObjectId(id: string | ObjectId): ObjectId {
  if (typeof id === "string") {
    return new ObjectId(id);
  }
  return id;
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export async function closeTaskOsConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("Task OS database connection closed");
  }
}
