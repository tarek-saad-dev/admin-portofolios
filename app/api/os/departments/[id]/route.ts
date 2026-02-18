/**
 * Task OS - Department API Routes (Single)
 * PATCH /api/os/departments/:id - Update department
 * DELETE /api/os/departments/:id - Soft delete department
 */

import { NextRequest, NextResponse } from "next/server";
import { getDepartmentsCollection, toObjectId, isValidObjectId } from "@/lib/db/task-os-db";
import { DepartmentInput } from "@/types/task-os";

// PATCH /api/os/departments/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const body: Partial<DepartmentInput> = await request.json();
    const collection = await getDepartmentsCollection();

    // Check if slug is being changed and if it conflicts
    if (body.slug) {
      const existing = await collection.findOne({
        slug: body.slug,
        _id: { $ne: toObjectId(id) },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Department with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE /api/os/departments/:id (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const collection = await getDepartmentsCollection();

    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Department deactivated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
