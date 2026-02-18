import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasEdgesCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";

// DELETE /api/os/canvas/:canvasId/edges/:edgeId - Delete edge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ canvasId: string; edgeId: string }> },
) {
  try {
    const { canvasId, edgeId } = await params;

    if (!isValidObjectId(canvasId) || !isValidObjectId(edgeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid canvas or edge ID" },
        { status: 400 },
      );
    }

    const edgesCollection = await getCanvasEdgesCollection();

    const result = await edgesCollection.deleteOne({
      _id: toObjectId(edgeId),
      canvasId: toObjectId(canvasId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Edge not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Edge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting edge:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete edge",
      },
      { status: 500 },
    );
  }
}
