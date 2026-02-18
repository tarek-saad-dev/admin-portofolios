/**
 * Task OS - Tracks API Routes
 * GET /api/os/tracks?departmentId=xxx - List tracks for a department
 * POST /api/os/tracks - Create new track
 */

import { NextRequest, NextResponse } from "next/server";
import { getTracksCollection, toObjectId, isValidObjectId } from "@/lib/db/task-os-db";
import { Track, TrackInput } from "@/types/task-os";

// GET /api/os/tracks?departmentId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");

    const collection = await getTracksCollection();
    const query: Record<string, unknown> = { isActive: true };

    if (departmentId && isValidObjectId(departmentId)) {
      query.departmentId = toObjectId(departmentId);
    }

    const tracks = await collection
      .find(query)
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}

// POST /api/os/tracks
export async function POST(request: NextRequest) {
  try {
    const body: TrackInput = await request.json();

    // Validation
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    if (!body.departmentId || !isValidObjectId(body.departmentId)) {
      return NextResponse.json(
        { success: false, error: "Valid department ID is required" },
        { status: 400 }
      );
    }

    const collection = await getTracksCollection();

    // Check for duplicate slug within same department
    const existing = await collection.findOne({
      departmentId: toObjectId(body.departmentId),
      slug: body.slug,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Track with this slug already exists for this department" },
        { status: 409 }
      );
    }

    const now = new Date();
    const track: Track = {
      departmentId: toObjectId(body.departmentId),
      name: body.name,
      slug: body.slug,
      order: body.order,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(track);
    const created = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating track:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create track" },
      { status: 500 }
    );
  }
}
