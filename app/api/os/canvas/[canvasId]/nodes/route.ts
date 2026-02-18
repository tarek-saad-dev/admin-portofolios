import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasNodesCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";
import { CanvasNodeInput } from "@/types/canvas";

// POST /api/os/canvas/:canvasId/nodes - Create new node
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ canvasId: string }> },
) {
  try {
    const { canvasId } = await params;

    if (!isValidObjectId(canvasId)) {
      return NextResponse.json(
        { success: false, error: "Invalid canvas ID" },
        { status: 400 },
      );
    }

    const body: Omit<CanvasNodeInput, "canvasId"> = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Node title is required" },
        { status: 400 },
      );
    }

    const nodesCollection = await getCanvasNodesCollection();

    const newNode = {
      canvasId: toObjectId(canvasId),
      title: body.title.trim(),
      description: body.description || "",
      type: body.type || "idea",
      position: body.position,
      meta: body.meta || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await nodesCollection.insertOne(newNode);
    const created = await nodesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: created,
      message: "Node created successfully",
    });
  } catch (error) {
    console.error("Error creating node:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create node",
      },
      { status: 500 },
    );
  }
}
