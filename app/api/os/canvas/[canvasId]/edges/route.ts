import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasEdgesCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";
import { CanvasEdgeInput } from "@/types/canvas";

// POST /api/os/canvas/:canvasId/edges - Create new edge
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

    const body: Omit<CanvasEdgeInput, "canvasId"> & {
      sourceNodeId: string;
      targetNodeId: string;
    } = await request.json();

    if (!body.sourceNodeId || !body.targetNodeId) {
      return NextResponse.json(
        { success: false, error: "Source and target node IDs are required" },
        { status: 400 },
      );
    }

    if (
      !isValidObjectId(body.sourceNodeId) ||
      !isValidObjectId(body.targetNodeId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid source or target node ID" },
        { status: 400 },
      );
    }

    const edgesCollection = await getCanvasEdgesCollection();

    const newEdge = {
      canvasId: toObjectId(canvasId),
      sourceNodeId: toObjectId(body.sourceNodeId),
      targetNodeId: toObjectId(body.targetNodeId),
      label: body.label || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await edgesCollection.insertOne(newEdge);
    const created = await edgesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: created,
      message: "Edge created successfully",
    });
  } catch (error) {
    console.error("Error creating edge:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create edge",
      },
      { status: 500 },
    );
  }
}
