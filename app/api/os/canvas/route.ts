import { NextRequest, NextResponse } from "next/server";
import { getCanvasCollection } from "@/lib/db/task-os-db";
import { Canvas, CanvasInput } from "@/types/canvas";

// GET /api/os/canvas - List all canvases
export async function GET() {
  try {
    const canvasCollection = await getCanvasCollection();
    const canvases = await canvasCollection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: canvases,
    });
  } catch (error) {
    console.error("Error fetching canvases:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch canvases",
      },
      { status: 500 }
    );
  }
}

// POST /api/os/canvas - Create new canvas
export async function POST(request: NextRequest) {
  try {
    const body: CanvasInput = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Canvas title is required",
        },
        { status: 400 }
      );
    }

    const canvasCollection = await getCanvasCollection();

    const newCanvas: Canvas = {
      title: body.title.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await canvasCollection.insertOne(newCanvas);
    const created = await canvasCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: created,
      message: "Canvas created successfully",
    });
  } catch (error) {
    console.error("Error creating canvas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create canvas",
      },
      { status: 500 }
    );
  }
}
