import { NextRequest, NextResponse } from "next/server";
import {
  getCanvasNodesCollection,
  getCanvasEdgesCollection,
  isValidObjectId,
  toObjectId,
} from "@/lib/db/task-os-db";
import { CanvasNodeUpdate } from "@/types/canvas";

// PATCH /api/os/canvas/:canvasId/nodes/:nodeId - Update node
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ canvasId: string; nodeId: string }> },
) {
  try {
    const { canvasId, nodeId } = await params;

    if (!isValidObjectId(canvasId) || !isValidObjectId(nodeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid canvas or node ID" },
        { status: 400 },
      );
    }

    const body: CanvasNodeUpdate = await request.json();
    const nodesCollection = await getCanvasNodesCollection();

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.meta !== undefined) updateData.meta = body.meta;
    if (body.linkedTaskId !== undefined)
      updateData.linkedTaskId = body.linkedTaskId;

    const result = await nodesCollection.findOneAndUpdate(
      { _id: toObjectId(nodeId), canvasId: toObjectId(canvasId) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating node:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update node",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/os/canvas/:canvasId/nodes/:nodeId - Delete node and its edges
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ canvasId: string; nodeId: string }> },
) {
  try {
    const { canvasId, nodeId } = await params;

    if (!isValidObjectId(canvasId) || !isValidObjectId(nodeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid canvas or node ID" },
        { status: 400 },
      );
    }

    const nodesCollection = await getCanvasNodesCollection();
    const edgesCollection = await getCanvasEdgesCollection();

    // Delete all edges connected to this node
    await edgesCollection.deleteMany({
      canvasId: toObjectId(canvasId),
      $or: [
        { sourceNodeId: toObjectId(nodeId) },
        { targetNodeId: toObjectId(nodeId) },
      ],
    });

    // Delete the node
    const result = await nodesCollection.deleteOne({
      _id: toObjectId(nodeId),
      canvasId: toObjectId(canvasId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Node deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting node:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete node",
      },
      { status: 500 },
    );
  }
}
