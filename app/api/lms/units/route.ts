import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/lms-db";
import { UnitSchema, ReorderSchema } from "@/lib/lms-validation";
import { Unit } from "@/types/lms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const id = searchParams.get("id");

    // Fetch single unit by id
    if (id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid unit ID" },
          { status: 400 },
        );
      }

      const units = await query<Unit>("SELECT * FROM units WHERE id = $1", [
        numericId,
      ]);

      if (units.length === 0) {
        return NextResponse.json(
          { success: false, error: "Unit not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: units[0],
      });
    }

    // Fetch units by courseId
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 },
      );
    }

    const numericCourseId = Number(courseId);
    if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const units = await query<Unit>(
      'SELECT * FROM units WHERE course_id = $1 ORDER BY "order"',
      [numericCourseId],
    );

    return NextResponse.json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error("[LMS API] Error fetching units:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch units" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "reorder") {
      const validatedData = ReorderSchema.parse(body);

      await transaction(async (client) => {
        for (const item of validatedData.items) {
          await client.query(
            'UPDATE units SET "order" = $1, updated_at = NOW() WHERE id = $2',
            [item.order, item.id],
          );
        }
      });

      console.log("[LMS API] Units reordered:", validatedData.items.length);

      return NextResponse.json({
        success: true,
        data: { reordered: validatedData.items.length },
      });
    }

    const validatedData = UnitSchema.parse(body);

    const result = await query<Unit>(
      `INSERT INTO units (course_id, title, description, "order")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        validatedData.courseId,
        validatedData.title,
        validatedData.description || "",
        validatedData.order,
      ],
    );

    console.log("[LMS API] Unit created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating unit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create unit",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Unit ID is required" },
        { status: 400 },
      );
    }

    const validatedData = UnitSchema.partial().parse(updateData);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`);
      params.push(validatedData.title);
      paramIndex++;
    }
    if (validatedData.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`);
      params.push(validatedData.description || "");
      paramIndex++;
    }
    if (validatedData.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex}`);
      params.push(validatedData.order);
      paramIndex++;
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query<Unit>(
      `UPDATE units SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Unit not found" },
        { status: 404 },
      );
    }

    console.log("[LMS API] Unit updated:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating unit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update unit",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Unit ID is required" },
        { status: 400 },
      );
    }

    await query("DELETE FROM units WHERE id = $1", [id]);

    console.log("[LMS API] Unit deleted:", id);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("[LMS API] Error deleting unit:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete unit" },
      { status: 500 },
    );
  }
}
