import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasCollection,
  getCanvasNodesCollection,
  getCanvasEdgesCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";

// GET /api/os/canvas/:canvasId - Get canvas with all nodes and edges
export async function GET(
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

    const canvasCollection = await getCanvasCollection();
    const nodesCollection = await getCanvasNodesCollection();
    const edgesCollection = await getCanvasEdgesCollection();

    const canvas = await canvasCollection.findOne({
      _id: toObjectId(canvasId),
    });

    if (!canvas) {
      return NextResponse.json(
        { success: false, error: "Canvas not found" },
        { status: 404 },
      );
    }

    const nodes = await nodesCollection
      .find({ canvasId: toObjectId(canvasId) })
      .toArray();

    const edges = await edgesCollection
      .find({ canvasId: toObjectId(canvasId) })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        canvas,
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error("Error fetching canvas:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch canvas",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/os/canvas/:canvasId - Update canvas
export async function PATCH(
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

    const body = await request.json();
    const canvasCollection = await getCanvasCollection();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    const result = await canvasCollection.findOneAndUpdate(
      { _id: toObjectId(canvasId) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Canvas not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating canvas:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update canvas",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/os/canvas/:canvasId - Delete canvas and all its nodes/edges
export async function DELETE(
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

    const canvasCollection = await getCanvasCollection();
    const nodesCollection = await getCanvasNodesCollection();
    const edgesCollection = await getCanvasEdgesCollection();

    // Delete all nodes and edges first
    await nodesCollection.deleteMany({ canvasId: toObjectId(canvasId) });
    await edgesCollection.deleteMany({ canvasId: toObjectId(canvasId) });

    // Delete canvas
    const result = await canvasCollection.deleteOne({
      _id: toObjectId(canvasId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Canvas not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Canvas deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting canvas:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete canvas",
      },
      { status: 500 },
    );
  }
}
