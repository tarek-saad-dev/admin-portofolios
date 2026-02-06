import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/lms-db";
import { LessonSchema, ReorderSchema } from "@/lib/lms-validation";
import { Lesson } from "@/types/lms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unitId");
    const id = searchParams.get("id");

    // Fetch single lesson by id
    if (id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid lesson ID" },
          { status: 400 },
        );
      }

      const lessons = await query<Lesson>(
        "SELECT * FROM lessons WHERE id = $1",
        [numericId],
      );

      if (lessons.length === 0) {
        return NextResponse.json(
          { success: false, error: "Lesson not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: lessons[0],
      });
    }

    // Fetch lessons by unitId
    if (!unitId) {
      return NextResponse.json(
        { success: false, error: "Unit ID is required" },
        { status: 400 },
      );
    }

    const numericUnitId = Number(unitId);
    if (!Number.isInteger(numericUnitId) || numericUnitId <= 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const lessons = await query<Lesson>(
      'SELECT * FROM lessons WHERE unit_id = $1 ORDER BY "order"',
      [numericUnitId],
    );

    return NextResponse.json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    console.error("[LMS API] Error fetching lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
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
            'UPDATE lessons SET "order" = $1, updated_at = NOW() WHERE id = $2',
            [item.order, item.id],
          );
        }
      });

      console.log("[LMS API] Lessons reordered:", validatedData.items.length);

      return NextResponse.json({
        success: true,
        data: { reordered: validatedData.items.length },
      });
    }

    const validatedData = LessonSchema.parse(body);

    const result = await query<Lesson>(
      `INSERT INTO lessons (unit_id, title, "order")
       VALUES ($1, $2, $3)
       RETURNING *`,
      [validatedData.unitId, validatedData.title, validatedData.order],
    );

    console.log("[LMS API] Lesson created:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error creating lesson:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create lesson",
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
        { success: false, error: "Lesson ID is required" },
        { status: 400 },
      );
    }

    const validatedData = LessonSchema.partial().parse(updateData);

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`);
      params.push(validatedData.title);
      paramIndex++;
    }
    if (validatedData.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex}`);
      params.push(validatedData.order);
      paramIndex++;
    }

    params.push(id);

    const result = await query<Lesson>(
      `UPDATE lessons SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params,
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 },
      );
    }

    console.log("[LMS API] Lesson updated:", result[0]);

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("[LMS API] Error updating lesson:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update lesson",
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
        { success: false, error: "Lesson ID is required" },
        { status: 400 },
      );
    }

    await query("DELETE FROM lessons WHERE id = $1", [id]);

    console.log("[LMS API] Lesson deleted:", id);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("[LMS API] Error deleting lesson:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete lesson" },
      { status: 500 },
    );
  }
}
